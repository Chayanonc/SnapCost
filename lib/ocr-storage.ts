import { promises as fs } from "fs";
import path from "path";
import { OcrItem, OcrRecord } from "@/types/ocr";

// Save OCR records to a JSON file in the project root's `data/` folder.
// This persists across dev server restarts (unlike /tmp).
const DATA_DIR = path.join(process.cwd(), "data");
const OCR_FILE = path.join(DATA_DIR, "ocr-results.json");

// ── Internal helpers ──────────────────────────────────────────────────────────

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readAll(): Promise<OcrRecord[]> {
  try {
    const raw = await fs.readFile(OCR_FILE, "utf-8");
    return JSON.parse(raw) as OcrRecord[];
  } catch {
    return [];
  }
}

async function writeAll(records: OcrRecord[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(OCR_FILE, JSON.stringify(records, null, 2), "utf-8");
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Save a new OCR result record.
 * @returns The saved record with generated id and createdAt.
 */
export async function saveOcrRecord(
  input: Omit<OcrRecord, "id" | "createdAt" | "itemCount">,
): Promise<OcrRecord> {
  const record: OcrRecord = {
    ...input,
    id: `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    itemCount: input.items.length,
  };

  const records = await readAll();
  records.unshift(record); // newest first
  await writeAll(records);

  console.log(
    `[OCR Storage] Saved record id=${record.id} items=${record.itemCount}`,
  );
  return record;
}

/**
 * Get all saved OCR records, newest first.
 */
export async function getOcrRecords(): Promise<OcrRecord[]> {
  return readAll();
}

/**
 * Get a single OCR record by id.
 */
export async function getOcrRecordById(id: string): Promise<OcrRecord | null> {
  const records = await readAll();
  return records.find((r) => r.id === id) ?? null;
}
