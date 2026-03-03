-- CreateEnum
CREATE TYPE "RowType" AS ENUM ('INPUT', 'CALCULATED');

-- CreateTable
CREATE TABLE "CostSheet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostSheetRow" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RowType" NOT NULL,
    "value" DOUBLE PRECISION,
    "expression" TEXT,
    "unit" TEXT,
    "order" INTEGER NOT NULL,
    "sheetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostSheetRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CostSheetRow_sheetId_order_idx" ON "CostSheetRow"("sheetId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CostSheetRow_sheetId_key_key" ON "CostSheetRow"("sheetId", "key");

-- AddForeignKey
ALTER TABLE "CostSheet" ADD CONSTRAINT "CostSheet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostSheetRow" ADD CONSTRAINT "CostSheetRow_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "CostSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
