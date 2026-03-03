import { PrismaClient } from "../../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding initial formula...");

  // Check if formula already exists
  const existing = await prisma.formula.findFirst({
    where: { name: "สูตรกระดาษขาว-ดำ" },
  });

  // We rewrite the old function into a mathjs expression:
  // Original:
  // const B6 = (B7 * D7) / B1;
  // const B12 = ((B2 / 60) * B13 * B14) / B3;
  // const B8 = ((B2 / 60) * B9 * B10) / B3;
  // const B4 = ((((((22 / 7) * B5 * B5) / 4) * 7850) / 1000000) * (1.1 + 1.1 + 1.8 + 1.8 + 0.9) * D5 * G5) / B3;
  // const B17 = B4 + B6 + B8 + B12;
  // const B19 = B16 + B17 + B18;
  // const profit = sellPrice - B19;

  // Let's create an expression. `sellPrice` will be passed dynamically.
  // We can write it as a single big expression or multiple, but our schema just has one `expression`.
  // Wait, if it's one big expression, we can construct it or we can let math.js define internal variables.
  // mathjs supports multi-line expressions if evaluated, but our `evaluate` usually takes one line or an array.
  // Let's just create one massive expression for the final formula.
  // Or, since it's just pure math, we can combine it:
  // "sellPrice - (B16 + ((((((22/7)*B5*B5)/4)*7850)/1000000)*(1.1+1.1+1.8+1.8+0.9)*D5*G5)/B3 + (B7*D7)/B1 + ((B2/60)*B9*B10)/B3 + ((B2/60)*B13*B14)/B3 + B18)"
  const expression =
    "sellPrice - (B16 + ((((((22/7)*B5^2)/4)*7850)/1000000)*(1.1+1.1+1.8+1.8+0.9)*D5*G5)/B3 + (B7*D7)/B1 + ((B2/60)*B9*B10)/B3 + ((B2/60)*B13*B14)/B3 + B18)";

  if (!existing) {
    const formula = await prisma.formula.create({
      data: {
        name: "สูตรกระดาษขาว-ดำ",
        expression: expression,
        keywords: {
          create: [
            { keyword: "ขาวดำ" },
            { keyword: "ขาว-ดำ" },
            { keyword: "กระดาษขาวดำ" },
            { keyword: "กระดาษ ขาว-ดำ" },
          ],
        },
        variables: {
          create: [
            { name: "B1", label: "ปริมาณ", value: 30000 },
            { name: "B2", label: "ระยะเวลาต่อก้อน", value: 20 },
            { name: "B3", label: "น้ำหนักก้อน", value: 1300 },
            { name: "B5", label: "ขนาดลวด", value: 3.2 },
            { name: "B7", label: "จำนวน", value: 6 },
            { name: "B9", label: "ขนาดมอเตอร์", value: 37 },
            { name: "B10", label: "ค่าไฟ", value: 7 },
            { name: "B11", label: "ค่าน้ำมัน", value: 1 },
            { name: "B13", label: "อัตราการสิ้นเปลือง", value: 5 },
            { name: "B14", label: "ค่าเชื้อเพลง", value: 33 },
            { name: "B16", label: "ทุนซื้อ", value: 6.2 },
            { name: "B18", label: "ขนส่ง", value: 0.6 },
            { name: "D5", label: "พารามิเตอร์ D5", value: 6 },
            { name: "G5", label: "พารามิเตอร์ G5", value: 25 },
            { name: "D7", label: "ค่าแรงต่อคน", value: 500 },
          ],
        },
      },
    });
    console.log(`Created formula: ${formula.name}`);
  } else {
    console.log("Formula already exists. Skipping...");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
