export type FormulaFn = (price: number) => number;

export interface FormulaConfig {
  id: string;
  name: string;
  // Function to calculate profit based on sell price
  calculate: FormulaFn;
  // Keywords to match with item names (case-insensitive)
  matchKeywords: string[];
}

// ============================================
// 1. สูตรกระดาษขาวดำ (Black/White Paper Formula)
// ============================================
const calculateBlackWhitePaper: FormulaFn = (sellPrice: number) => {
  const B1 = 30000; // ปริมาณ
  const B2 = 20; // ระยะเวลาต่อก้อน
  const B3 = 1300; // น้ำหนักก้อน
  const B5 = 3.2; // ขนาดลวด
  const B7 = 6; // จำนวน
  const B9 = 37; // ขนาดมอเตอร์
  const B10 = 7; // ค่าไฟ
  const B11 = 1; // ค่าน้ำมัน
  const B13 = 5; // อัตราการสิ้นเปลือง
  const B14 = 33; // ค่าเชื้อเพลง
  const B16 = 6.2; // ทุนซื้อ
  const B18 = 0.6; // ขนส่ง

  const D5 = 6;
  const G5 = 25;
  const D7 = 500; // ค่าแรงต่อคน

  // การคำนวณต้นทุนแฝง
  const B6 = (B7 * D7) / B1; // ค่าแรง
  const B12 = ((B2 / 60) * B13 * B14) / B3; // BACKHOLE
  const B8 = ((B2 / 60) * B9 * B10) / B3; // ค่าไฟฟ้า
  const B4 =
    ((((((22 / 7) * B5 * B5) / 4) * 7850) / 1000000) *
      (1.1 + 1.1 + 1.8 + 1.8 + 0.9) *
      D5 *
      G5) /
    B3; // ค่าลวดมัดก้อน

  const B17 = B4 + B6 + B8 + B12; // ผลิต
  const B19 = B16 + B17 + B18; // ต้นทุนรวม
  const profit = sellPrice - B19; // กำไร

  return profit;
};

// ============================================
// Array of all available formulas
// ============================================
export const FORMULA_CONFIGS: FormulaConfig[] = [
  {
    id: "formula_paper_bw",
    name: "สูตรกระดาษขาว-ดำ",
    calculate: calculateBlackWhitePaper,
    // ถ้าชื่อสินค้ามีคำว่า "ขาวดำ" หรือ "ขาว-ดำ" จะใช้สูตรนี้
    matchKeywords: ["ขาวดำ", "ขาว-ดำ", "กระดาษขาวดำ", "กระดาษ ขาว-ดำ"],
  },
  // สามารถเพิ่มสูตรอื่น ๆ ตรงนี้ได้ในอนาคต เช่น
  // {
  //   id: "formula_plastic_pet",
  //   name: "สูตรพลาสติก PET",
  //   calculate: (price) => price - 10,
  //   matchKeywords: ["pet", "พลาสติกใส"],
  // }
];

/**
 * Helper: Find the right formula based on item name
 */
export function getFormulaForItemName(itemName: string): FormulaConfig | null {
  const normalizedName = itemName.trim().toLowerCase();

  for (const config of FORMULA_CONFIGS) {
    for (const keyword of config.matchKeywords) {
      if (normalizedName.includes(keyword.toLowerCase())) {
        return config;
      }
    }
  }
  return null;
}
