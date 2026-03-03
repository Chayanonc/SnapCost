export interface OcrItem {
  item: string;
  price: number | string;
  priceVat?: number | string;
}

export interface OcrResult {
  /** Raw text/JSON returned by Gemini */
  rawText: string;
  /** Parsed product items from the JSON response */
  items: OcrItem[];
  /** Fallback 2D rows (header + data) for Excel — derived from items */
  rows: string[][];
}

export interface OcrRecord {
  id: string;
  createdAt: string;
  /** LINE message ID */
  messageId: string;
  /** LINE user ID (optional, passed from webhook) */
  lineUserId?: string;
  /** Raw text returned by Gemini */
  rawText: string;
  /** Structured items parsed from Gemini JSON response */
  items: OcrItem[];
  /** Excel filename stored in /tmp */
  excelFileName: string;
  /** Total item count */
  itemCount: number;
}

// ── Parsers ────────────────────────────────────────────────────────────────────

export interface OcrFormat {
  result: OcrItem[];
  message: string;
}
