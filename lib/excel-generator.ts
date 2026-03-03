import { OcrResult } from "@/types/ocr";
import ExcelJS from "exceljs";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

export interface ExcelOutput {
  /** Absolute path to the generated .xlsx file */
  filePath: string;
  /** File name only, e.g. "ocr-1234567890.xlsx" */
  fileName: string;
}

/**
 * Generate an Excel (.xlsx) file from OCR results and save to /tmp.
 *
 * @param ocr       - OCR result from extractTextFromImage()
 * @param sheetName - Optional sheet name (default: "OCR Result")
 */
export async function generateExcelFromOcr(
  ocr: OcrResult,
  sheetName = "OCR Result",
): Promise<ExcelOutput> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LINE OCR Bot";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);

  // ── Header row style ──────────────────────────────────────────────────────
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F81BD" },
  };
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 11,
  };

  // ── Add rows ──────────────────────────────────────────────────────────────
  ocr.rows.forEach((row, rowIndex) => {
    const excelRow = sheet.addRow(row);

    // Style the first row as a header if it looks like one
    if (rowIndex === 0 && ocr.rows.length > 1) {
      excelRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FF000000" } },
        };
      });
    } else {
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
        // Alternate row shading
        if (rowIndex % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F7FB" },
          };
        }
      });
    }
  });

  // ── If OCR returned plain text (single column), add a "Raw Text" sheet ──
  if (ocr.rows.length > 0 && ocr.rows[0].length === 1) {
    const rawSheet = workbook.addWorksheet("Raw Text");
    rawSheet.getColumn(1).width = 80;
    const rawRow = rawSheet.addRow(["Extracted Text"]);
    rawRow.getCell(1).font = headerFont;
    rawRow.getCell(1).fill = headerFill;
    rawSheet.addRow([ocr.rawText]);
    rawSheet.getRow(2).getCell(1).alignment = {
      wrapText: true,
      vertical: "top",
    };
  }

  // ── Auto-fit column widths (max 60) ───────────────────────────────────────
  sheet.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 4, 60);
  });

  // ── Save to /tmp ──────────────────────────────────────────────────────────
  const fileName = `ocr-${Date.now()}.xlsx`;
  const filePath = path.join(os.tmpdir(), fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await workbook.xlsx.writeFile(filePath);

  return { filePath, fileName };
}

/**
 * Read the generated Excel file and return it as a Buffer.
 * Used by the download API route.
 */
export async function readExcelFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}
