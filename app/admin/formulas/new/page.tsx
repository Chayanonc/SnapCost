"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFormula } from "@/app/actions/formula.actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { evaluate } from "mathjs";

interface Variable {
  id: string; // temp id for React list
  name: string;
  label: string;
  value: number;
}

export default function NewFormulaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [expression, setExpression] = useState("");

  // Keywords
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);

  // Variables
  const [variables, setVariables] = useState<Variable[]>([]);
  const [previewResult, setPreviewResult] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    if (keywords.includes(keywordInput.trim())) {
      toast.error("มีคำนี้อยู่แล้ว");
      return;
    }
    setKeywords([...keywords, keywordInput.trim()]);
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const addVariable = () => {
    setVariables([
      ...variables,
      {
        id: Math.random().toString(36).slice(2),
        name: `VAR_${variables.length + 1}`,
        label: "",
        value: 0,
      },
    ]);
  };

  const updateVariable = (
    id: string,
    field: keyof Variable,
    val: string | number,
  ) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, [field]: val } : v)),
    );
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  const testFormula = () => {
    try {
      if (!expression.trim()) {
        setPreviewError("กรุณากรอกสมการ");
        setPreviewResult(null);
        return;
      }
      const scope: Record<string, number> = { sellPrice: 100 }; // mock sellPrice
      variables.forEach((v) => {
        if (v.name.trim()) scope[v.name] = Number(v.value);
      });
      const res = evaluate(expression, scope);
      setPreviewResult(res);
      setPreviewError(null);
    } catch (e: any) {
      setPreviewError(e.message || "เกิดข้อผิดพลาดในสมการ");
      setPreviewResult(null);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error("กรุณากรอกชื่อสูตร");
    if (!expression.trim()) return toast.error("กรุณากรอกสมการ");

    // Check variable names
    const varNames = variables.map((v) => v.name.trim());
    if (varNames.some((n) => !n)) return toast.error("ชื่อตัวแปรห้ามว่าง");
    if (new Set(varNames).size !== varNames.length)
      return toast.error("ชื่อตัวแปรห้ามซ้ำกัน");

    startTransition(async () => {
      const res = await createFormula({
        name,
        expression,
        keywords,
        variables: variables.map((v) => ({
          name: v.name.trim(),
          label: v.label.trim(),
          value: Number(v.value),
        })),
      });

      if (res.success) {
        toast.success("สร้างสูตรใหม่สำเร็จ!");
        router.push("/admin/formulas");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground pb-20">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 right-1/4 size-[600px] rounded-full bg-violet-600/6 blur-[130px]" />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8 space-y-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/admin/formulas"
            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้ารายการสูตร
          </Link>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              สร้างสูตรการคำนวณใหม่
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              กำหนดรูปแบบสมการ ตัวแปร และคำค้นหาสำหรับผูกสูตรกับสินค้าอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ข้อมูลทั่วไป */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>ข้อมูลทั่วไป</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  ชื่อสูตร <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="เช่น สูตรกระดาษสี, สูตรขวดพลาสติก"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>คำค้นหายอดฮิต (Keywords)</Label>
                <CardDescription>
                  หากชื่อสินค้าที่อ่านจากภาพตรงกับคำเหล่านี้
                  จะใช้สูตรนี้อัตโนมัติ
                </CardDescription>
                <div className="flex gap-2">
                  <Input
                    placeholder="พิมพ์คำแล้วกด Add"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addKeyword())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addKeyword}
                    variant="secondary"
                  >
                    Add
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {keywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="pl-3 pr-1 py-1 flex items-center gap-1"
                      >
                        {kw}
                        <button
                          onClick={() => removeKeyword(kw)}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ตัวแปร */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ตัวแปรที่ใช้ (Variables)</CardTitle>
                <CardDescription className="mt-1">
                  ตัวแปรเหล่านี้จะถูกนำไปแทนค่าในสมการ
                </CardDescription>
              </div>
              <Button
                onClick={addVariable}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> เพิ่มตัวแปร
              </Button>
            </CardHeader>
            <CardContent>
              {variables.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground bg-secondary/10 rounded-lg border border-dashed border-border/50">
                  คลิกเพิ่มตัวแปรเพื่อเริ่มต้น
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-4 px-1 text-xs font-semibold text-muted-foreground uppercase">
                    <div className="flex-1">ชื่ออ้างอิง (ตย. B1, VAT)</div>
                    <div className="flex-1">คำอธิบาย (ภาษาไทย)</div>
                    <div className="w-32">ค่าเริ่มต้น</div>
                    <div className="w-8"></div>
                  </div>
                  {variables.map((v) => (
                    <div key={v.id} className="flex gap-4 items-center">
                      <Input
                        placeholder="Name"
                        value={v.name}
                        onChange={(e) =>
                          updateVariable(
                            v.id,
                            "name",
                            e.target.value.toUpperCase(),
                          )
                        }
                        className="font-mono text-sm uppercase flex-1"
                      />
                      <Input
                        placeholder="Label"
                        value={v.label}
                        onChange={(e) =>
                          updateVariable(v.id, "label", e.target.value)
                        }
                        className="text-sm flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="0"
                        value={v.value}
                        onChange={(e) =>
                          updateVariable(
                            v.id,
                            "value",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="font-mono text-sm w-32 text-right"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariable(v.id)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* สมการ */}
          <Card className="bg-card border-border shadow-sm border-blue-500/20">
            <CardHeader>
              <CardTitle>สมการคำนวณกำไร (Expression)</CardTitle>
              <CardDescription>
                คุณสามารถใช้ตัวแปรที่นิยามไว้ด้านบน และสามารถใช้ `sellPrice`
                ซึ่งเป็นตัวแปรพิเศษระบบสำหรับราคาขายล่าสุด
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="เช่น sellPrice - (B1 + B2)"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  className="font-mono bg-secondary/30"
                />
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/20 border border-border/50">
                <Button
                  onClick={testFormula}
                  variant="secondary"
                  className="gap-2"
                >
                  <Play className="w-4 h-4" /> ทดสอบสมการ
                </Button>

                <div className="flex-1 flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">
                    ผลลัพธ์การจำลอง (เมื่อ sellPrice = 100)
                  </span>
                  {previewError ? (
                    <span className="text-sm font-semibold text-rose-500 mt-1">
                      {previewError}
                    </span>
                  ) : previewResult !== null ? (
                    <span
                      className={`text-xl font-bold mt-1 ${previewResult >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {previewResult >= 0 ? "+" : ""}
                      {previewResult.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground mt-1">
                      —
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" asChild>
              <Link href="/admin/formulas">ยกเลิก</Link>
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="min-w-[120px]"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isPending ? "กำลังบันทึก..." : "บันทึกสูตรใหม่"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
