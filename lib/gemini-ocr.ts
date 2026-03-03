import { GoogleGenerativeAI } from "@google/generative-ai";
import { OcrFormat, OcrItem, OcrResult } from "@/types/ocr";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Use gemini-2.5-flash which supports vision (image input)
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Extract text from an image using Gemini Vision (OCR).
 *
 * @param imageBase64 - Base64-encoded image data (without data URI prefix)
 * @param mimeType    - MIME type of the image, e.g. "image/jpeg" or "image/png"
 */
export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<OcrResult> {
  const prompt = `Role: คุณคือผู้เชี่ยวชาญด้านการสกัดข้อมูล (Data Extraction) จากเอกสารตารางราคาสินค้า

Task: ช่วย ocr ข้อมูลแบบละเอียด ให้เอาตามข้อมูลที่อ่านได้ ออกมาให้ครบทุก row แสดงเป็น json 

Rules:

แยกชื่อสินค้า (item) และราคา (price) ให้ชัดเจน

สินค้าที่มี 2 ราคา (เช่น /24 หรือ /56) ให้สร้างเป็น String "ราคาสูง/ราคาต่ำ" ตามที่ระบุในตาราง

ราคาให้ใช้จากคอลัมน์ "ราคา/กก." (ไม่ต้องรวม VAT)

output format
[
  { "item": "ทองแดง No.1 ใหญ่ปอก", "price": 377.00, "priceVat": 385.00 },
  { "item": "อลูมิเนียมล้อแม็กซ์", "price": 83.00, "priceVat": 385.00 }
]`;

  const result = await visionModel.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const rawText = result.response.text().trim();

  const items = parseJsonResponse(rawText);
  const rows = itemsToRows(items);
  return { rawText, items, rows };
}

export const ocrFormat = (content: string): OcrFormat => {
  // ใช้ Regex เพื่อดึงเฉพาะเนื้อหาที่อยู่ภายใน ```json ... ```
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

  if (jsonMatch && jsonMatch[1]) {
    // แปลง String ให้เป็น JSON Object
    const cleanedJson = JSON.parse(jsonMatch[1]);

    // ส่งข้อมูลออกไปแบบแยกเป็นราย Item เพื่อให้ Node ถัดไป (เช่น Google Sheets) ประมวลผลได้ทีละแถว
    const result = cleanedJson.map((item: any) => {
      return {
        ...item,
        price: item.price,
        priceVat: item.priceVat,
      };
    });
    return { result, message: "สำเร็จ" };
  } else {
    // กรณีที่รูปแบบข้อความไม่ตรงกับที่คาดไว้
    return { result: [], message: "ไม่พบข้อมูล JSON ในข้อความที่ได้รับ" };
  }
};

/**
 * Parse Gemini's JSON response into OcrItem[].
 * Strips markdown code fences (```json ... ```) if present.
 */
function parseJsonResponse(text: string): OcrItem[] {
  // Strip markdown fences that Gemini sometimes wraps around JSON

  const ocrFormatResult = ocrFormat(text);

  try {
    if (ocrFormatResult.result.length > 0) {
      return ocrFormatResult.result;
    } else {
      throw new Error(ocrFormatResult.message);
    }
  } catch {
    console.warn(
      "[OCR] Response is not valid JSON, falling back to plain text rows",
    );
  }

  // Fallback: treat each non-empty line as a single item
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => ({ item: l.trim(), price: "" }));
}

/**
 * Convert OcrItem[] into a 2D string array for Excel.
 * Row 0 = header, remaining rows = data.
 */
function itemsToRows(items: OcrItem[]): string[][] {
  const header = ["ชื่อสินค้า", "ราคา/กก.", "ราคา/กก. (VAT)"];
  const dataRows = items.map((it) => [
    it.item,
    String(it.price ?? ""),
    String(it.priceVat ?? ""),
  ]);
  return [header, ...dataRows];
}
