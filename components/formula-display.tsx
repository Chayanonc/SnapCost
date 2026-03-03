"use client";

import { useState, useTransition } from "react";
import { setItemFormula } from "@/app/actions/formula.actions";
import { evaluate } from "mathjs";
import type {
  Formula,
  FormulaVariable,
  FormulaKeyword,
} from "@/app/generated/prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type FullFormula = Formula & {
  variables: FormulaVariable[];
  keywords: FormulaKeyword[];
};

interface FormulaDisplayProps {
  itemId: string;
  itemName: string;
  value: number;
  formulaId: string | null;
  formulas: FullFormula[];
}

export function FormulaDisplay({
  itemId,
  itemName,
  value,
  formulaId,
  formulas,
}: FormulaDisplayProps) {
  const [isPending, startTransition] = useTransition();

  // 1. Determine which formula to use
  // First, check if the user manually selected one. If not, auto-detect from keywords.
  const activeFormulaConfig = formulaId
    ? formulas.find((f) => f.id === formulaId)
    : formulas.find((f) =>
        f.keywords.some((k) => itemName.includes(k.keyword)),
      );

  const calculateAndRenderProfit = () => {
    if (!activeFormulaConfig) {
      return <div className="text-muted-foreground text-xs">— (ไม่มีสูตร)</div>;
    }

    let profit = 0;
    try {
      const scope: Record<string, number> = { sellPrice: value };
      activeFormulaConfig.variables.forEach((v) => {
        scope[v.name] = v.value;
      });
      profit = evaluate(activeFormulaConfig.expression, scope);
    } catch (e) {
      console.error("Formula evaluation error:", e);
      return <div className="text-xs text-rose-500">Error in Formula</div>;
    }

    const isPositive = profit >= 0;

    return (
      <div className="flex flex-col items-end">
        <div
          className={`text-sm font-semibold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
        >
          {isPositive ? "+" : ""}
          {profit.toFixed(2)}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          กำไร ({activeFormulaConfig.name})
        </div>
      </div>
    );
  };

  const handleFormulaChange = (newFormulaId: string) => {
    startTransition(async () => {
      const selectedId = newFormulaId === "none" ? null : newFormulaId;
      await setItemFormula(itemId, selectedId);
    });
  };

  // Find auto formula for display purposes when none is explicitly selected
  const autoFormula = formulas.find((f) =>
    f.keywords.some((k) => itemName.includes(k.keyword)),
  );

  return (
    <div className="flex flex-col items-end gap-1.5">
      {calculateAndRenderProfit()}

      <div className="flex items-center gap-2">
        {isPending && (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        )}
        <Select
          value={formulaId || "auto"}
          onValueChange={handleFormulaChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-6 w-38 px-2 text-[10px] bg-secondary/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto" className="text-[10px]">
              อัตโนมัติ ({autoFormula?.name || "ไม่มี"})
            </SelectItem>
            <SelectItem
              value="none"
              className="text-[10px] text-muted-foreground"
            >
              ❌ ไม่ใช้สูตร
            </SelectItem>
            {formulas.map((config) => (
              <SelectItem
                key={config.id}
                value={config.id}
                className="text-[10px]"
              >
                {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
