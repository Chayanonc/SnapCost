"use server";

import { extractTextFromImage } from "@/lib/gemini-ocr";

export async function processManualOcr(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "กรุณาแนบไฟล์รูปภาพ" };
    }

    if (!file.type.startsWith("image/")) {
      return { success: false, error: "ไฟล์ต้องเป็นรูปภาพเท่านั้น" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = file.type;

    console.log(
      `[Manual OCR] Processing image size=${base64.length}, type=${mimeType}`,
    );

    // Call existing Gemini function
    const ocrResult = await extractTextFromImage(base64, mimeType);

    const items = ocrResult.items.map((item) => {
      const prices = item.price?.toString().split("/");
      return {
        ...item,
        price: Number(prices?.[0]),
        priceVat: 0,
      };
    });

    return {
      success: true,
      items: ocrResult.items,
      rawText: ocrResult.rawText,
    };
  } catch (error: any) {
    console.error("[Manual OCR Error]:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการประมวลผล OCR",
    };
  }
}
