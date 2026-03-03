import { NextRequest, NextResponse } from "next/server";
import { generateExcelFromOcr } from "@/lib/excel-generator";
import { extractTextFromImage } from "@/lib/gemini-ocr";
import { LineEvent } from "@/types/line";
import { lineService } from "@/service/line.service";
// ── Route handlers ────────────────────────────────────────────────────────────

/** GET — used by LINE Developer Console to verify the webhook URL */
export async function GET() {
  return NextResponse.json({ status: "LINE webhook is ready" });
}

/** POST — receives events from LINE Messaging API */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  // Reject unsigned / tampered requests
  if (!lineService.verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { events: LineEvent[] };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Derive the server's public base URL for generating download links
  const baseUrl =
    process.env.PUBLIC_BASE_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  // Process all events — LINE expects a fast 200 OK, so we don't await here.
  // Use waitUntil if deploying on a platform that supports it (e.g. Cloudflare).
  Promise.all(
    body.events.map(async (event) => {
      if (event.type !== "message") return;

      const { message, replyToken, source } = event;
      const lineUserId = source?.userId;

      try {
        const isImageMessage = message.type === "image";
        const isImageFile =
          message.type === "file" &&
          message.fileName &&
          /\.(jpe?g|png|webp|heic|heif)$/i.test(message.fileName);

        if (isImageMessage || isImageFile) {
          // ✅ Main feature: image → Gemini OCR → Excel → save record
          await lineService.handleImageMessage(
            message.id,
            replyToken,
            baseUrl,
            lineUserId,
          );
        } else if (message.type === "text") {
          // Generic text fallback
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent(message.text!);
          await lineService.replyToLine(replyToken, result.response.text());
        } else {
          await lineService.replyToLine(
            replyToken,
            "กรุณาส่งรูปภาพ (หรือไฟล์รูปภาพ) ที่มีข้อความ เพื่อให้ระบบอ่าน OCR และสร้างไฟล์ Excel ให้อัตโนมัติ 📷",
          );
        }
      } catch (err) {
        console.error("[LINE Webhook] Error:", err);
        await lineService.replyToLine(
          replyToken,
          "ขออภัย เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง",
        );
      }
    }),
  ).catch(console.error);

  // Return 200 immediately so LINE doesn't retry
  return NextResponse.json({ status: "ok" });
}
