"use client";

export function FormulaDisplay({ value }: { value: number }) {
  //   ปริมาณ;
  const B1 = 30000;
  //   ระยะเวลาต่อก้อน;
  const B2 = 20;
  //   น้ำหนักก้อน;
  const B3 = 1300;

  //   ขนาดลวด;
  const B5 = 3.2;

  //   จำนวน;
  const B7 = 6;
  //   ขนาดมอเตอร์;
  const B9 = 37;
  //   ค่าไฟ;
  const B10 = 7;
  //   ค่าน้ำมัน;
  const B11 = 1;
  //   อัตราการสิ้นเปลือง;
  const B13 = 5;
  //   ค่าเชื้อเพลง;
  const B14 = 33;

  //   ทุนซื้อ;
  const B16 = 6.2;
  //   ขนส่ง;
  const B18 = 0.6;
  //   ขาย;
  const B20 = value;

  const D5 = 6;
  const G5 = 25;
  //   ค่าแรงต่อคน
  const D7 = 500;

  //   ค่าแรง;
  const B6 = (B7 * D7) / B1;

  //   BACKHOLE;
  //   B2÷60×B13×B14÷B3
  const B12 = ((B2 / 60) * B13 * B14) / B3;
  //   ค่าไฟฟ้า;
  //   B2÷60×B9×B10÷B3
  const B8 = ((B2 / 60) * B9 * B10) / B3;
  //   ค่าลวดมัดก้อน;
  //   22÷7×B5×B5÷4×7850÷1000000×(1.1+1.1+1.8+1.8+0.9)×D5×G5÷B3
  const B4 =
    ((((((22 / 7) * B5 * B5) / 4) * 7850) / 1000000) *
      (1.1 + 1.1 + 1.8 + 1.8 + 0.9) *
      D5 *
      G5) /
    B3;
  //   ผลิต;
  //   B4+B6+B8+B12
  const B17 = B4 + B6 + B8 + B12;

  //   ต้นทุน;
  //   B16+B17+B18
  const B19 = B16 + B17 + B18;

  //   กำไร;
  //   B20−B19
  const B21 = B20 - B19;

  return <div>กำไร {B21}</div>;
}
