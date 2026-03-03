"use client";

import { useState, useTransition } from "react";
import { updateFormulaVariable } from "@/app/actions/formula.actions";
import { FormulaVariable } from "@/app/generated/prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export function VariableEditor({ variable }: { variable: FormulaVariable }) {
  const [value, setValue] = useState<string>(variable.value.toString());
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      toast.error("กรุณากรอกตัวเลขที่ถูกต้อง");
      return;
    }

    startTransition(async () => {
      const result = await updateFormulaVariable(variable.id, numValue);
      if (result.success) {
        toast.success(`อัปเดต ${variable.name} เป็น ${numValue} เรียบร้อยแล้ว`);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  const isChanged = parseFloat(value) !== variable.value;

  return (
    <div className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0 hover:bg-secondary/10 px-2 rounded-md transition-colors">
      <div className="w-16 font-mono text-sm font-bold text-blue-400">
        {variable.name}
      </div>
      <div className="flex-1 text-sm text-foreground/80">
        {variable.label || "-"}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 h-8 text-right font-mono text-sm"
          disabled={isPending}
        />
        <Button
          onClick={handleSave}
          disabled={!isChanged || isPending}
          size="sm"
          className="h-8 px-3"
          variant={isChanged ? "default" : "secondary"}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1.5" />
          )}
          {isPending ? "" : "บันทึก"}
        </Button>
      </div>
    </div>
  );
}
