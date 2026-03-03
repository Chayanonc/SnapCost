import crypto from "crypto";
import {
  LINE_CHANNEL_ACCESS_TOKEN,
  LINE_CHANNEL_SECRET,
  LINE_CONTENT_API,
  LINE_PUSH_API,
  LINE_REPLY_API,
} from "@/constants/config.constant";
import { extractTextFromImage } from "@/lib/gemini-ocr";
import { generateExcelFromOcr } from "@/lib/excel-generator";
import prisma from "@/lib/prisma";

/**
 * Fetch binary content sent by a user (image, video, audio, file).
 * Returns a Response object — call .arrayBuffer(), .blob() etc.
 *
 * @param messageId - The message ID from the LINE event
 */
async function getLineContent(messageId: string): Promise<Response> {
  const res = await fetch(`${LINE_CONTENT_API}/${messageId}/content`, {
    headers: {
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to get LINE content: ${res.status} ${res.statusText}`,
    );
  }

  return res;
}

/**
 * Download LINE content and return it as a base64 string.
 *
 * @param messageId - The message ID from the LINE event
 * @returns { base64: string; contentType: string }
 */
async function getLineContentAsBase64(
  messageId: string,
): Promise<{ base64: string; contentType: string }> {
  const res = await getLineContent(messageId);
  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64, contentType };
}

// ── Signature verification ────────────────────────────────────────────────────

/** Verify that the request genuinely comes from LINE */
function verifySignature(body: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", LINE_CHANNEL_SECRET);
  hmac.update(body);
  return hmac.digest("base64") === signature;
}

// ── LINE API helpers ──────────────────────────────────────────────────────────

/** Send a text reply back via LINE Reply API (use only once per replyToken) */
async function replyToLine(replyToken: string, text: string) {
  const res = await fetch(LINE_REPLY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[LINE] replyToLine failed: ${res.status} ${err}`);
  }
}

/**
 * Send a proactive (push) message to a LINE user.
 * Use this when replyToken is already consumed or not available.
 */
async function pushToLine(
  userId: string,
  text: string,
  retryKey?: string,
  retryCount = 0,
) {
  const currentRetryKey = retryKey || crypto.randomUUID();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
  };

  if (retryCount > 0) {
    headers["X-Line-Retry-Key"] = currentRetryKey;
  }

  try {
    const res = await fetch(LINE_PUSH_API, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text }],
      }),
    });

    if (res.status === 409) {
      console.log(
        `[LINE] pushToLine previously succeeded for user ${userId} (409 Conflict)`,
      );
      return;
    }

    if (!res.ok) {
      const err = await res.text();
      console.error(`[LINE] pushToLine failed: ${res.status} ${err}`);

      // Retry on 5xx server errors or 429 rate limit, up to a maximum number of retries
      if ((res.status >= 500 || res.status === 429) && retryCount < 3) {
        console.log(
          `[LINE] Retrying push message for user ${userId} (Attempt ${retryCount + 1})`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return pushToLine(userId, text, currentRetryKey, retryCount + 1);
      }
    }
  } catch (error) {
    console.error(`[LINE] pushToLine fetch error:`, error);
    // Retry on network errors
    if (retryCount < 3) {
      console.log(
        `[LINE] Retrying push message for user ${userId} due to fetch error (Attempt ${retryCount + 1})`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (retryCount + 1)),
      );
      return pushToLine(userId, text, currentRetryKey, retryCount + 1);
    }
  }
}

/**
 * Main image processing pipeline:
 * 1. Download image from LINE
 * 2. Send to Gemini Vision for OCR
 * 3. Generate Excel file from extracted text
 * 4. Reply to user with a download link
 */
async function handleImageMessage(
  messageId: string,
  replyToken: string,
  baseUrl: string,
  lineUserId?: string,
) {
  // Step 1 — send an immediate "processing" push so the user isn't left waiting.
  // We CANNOT use replyToken here because we need it at the end for the result.
  // Push API requires a userId; if unavailable (e.g. group without userId), skip.
  if (lineUserId) {
    await lineService.pushToLine(
      lineUserId,
      "📷 ได้รับรูปภาพแล้ว กำลังอ่านข้อความด้วย Gemini OCR โปรดรอสักครู…",
    );
  }

  // Step 2 — download image from LINE
  const { base64, contentType } =
    await lineService.getLineContentAsBase64(messageId);

  // Step 3 — Gemini Vision OCR
  console.log(
    `[OCR] Processing image id=${messageId} type=${contentType} size=${base64.length} chars`,
  );
  const ocrResult = await extractTextFromImage(base64, contentType);

  try {
    for (const item of ocrResult.items) {
      const price =
        item.price.toString().split("/").length > 1
          ? item.price
              .toString()
              .split("/")
              .map((price) => Number(price))
          : [Number(item.price)];
      const priceVatVal = 0;

      await prisma.item.upsert({
        where: { name: item.item },
        update: {
          prices: {
            create: price.map((price) => ({
              price,
              priceVat: priceVatVal,
            })),
          },
        },
        create: {
          name: item.item,
          prices: {
            create: price.map((price) => ({
              price,
              priceVat: priceVatVal,
            })),
          },
        },
      });
    }
  } catch (error) {
    console.error("[Prisma] Failed to save items:", error);
  }

  console.log(`[OCR] Extracted ${ocrResult.items.length} items`);

  // Step 4 — generate Excel
  const { fileName } = await generateExcelFromOcr(ocrResult);

  // Step 6 — reply ONCE with the full result using the replyToken
  const downloadUrl = `${baseUrl}/api/download/${fileName}`;
  const itemCount = ocrResult.items.length;

  const replyText = ocrResult.rawText
    ? [
        `✅ OCR สำเร็จ! พบสินค้า ${itemCount} รายการ`,
        `📄 ดาวน์โหลดไฟล์ Excel:`,
        downloadUrl,
      ].join("\n")
    : "⚠️ ไม่พบข้อความในรูปภาพ กรุณาส่งรูปที่มีตารางหรือข้อความชัดเจน";

  await lineService.replyToLine(replyToken, replyText);
}

export const lineService = {
  getLineContentAsBase64,
  verifySignature,
  replyToLine,
  pushToLine,
  handleImageMessage,
};
