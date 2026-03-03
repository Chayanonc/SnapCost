/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CostSheet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CostSheetRow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Formula` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormulaVariable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Variable` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CostSheet" DROP CONSTRAINT "CostSheet_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CostSheetRow" DROP CONSTRAINT "CostSheetRow_sheetId_fkey";

-- DropForeignKey
ALTER TABLE "Formula" DROP CONSTRAINT "Formula_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "FormulaVariable" DROP CONSTRAINT "FormulaVariable_formulaId_fkey";

-- DropForeignKey
ALTER TABLE "FormulaVariable" DROP CONSTRAINT "FormulaVariable_variableId_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Variable" DROP CONSTRAINT "Variable_categoryId_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "CostSheet";

-- DropTable
DROP TABLE "CostSheetRow";

-- DropTable
DROP TABLE "Formula";

-- DropTable
DROP TABLE "FormulaVariable";

-- DropTable
DROP TABLE "Variable";

-- DropEnum
DROP TYPE "RowType";
