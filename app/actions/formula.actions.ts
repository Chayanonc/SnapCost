"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function setItemFormula(itemId: string, formulaId: string | null) {
  try {
    console.log("itemId", itemId);
    console.log("formulaId", formulaId);
    await prisma.item.update({
      where: { id: itemId },
      data: { formulaId: formulaId },
    });
    // ให้ revalidate หน้าแรก เพื่อโหลดข้อมูลใหม่
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update formula:", error);
    return { success: false, error: "Unable to update formula" };
  }
}

export async function updateFormulaVariable(
  variableId: string,
  newValue: number,
) {
  try {
    await prisma.formulaVariable.update({
      where: { id: variableId },
      data: { value: newValue },
    });
    // Revalidate the pages that might display calculations using this variable
    revalidatePath("/");
    revalidatePath("/admin/formulas");
    return { success: true };
  } catch (error) {
    console.error("Failed to update formula variable:", error);
    return { success: false, error: "Unable to update variable" };
  }
}
