import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { VariableEditor } from "@/components/variable-editor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0; // Disable caching so it always shows latest variables

export default async function AdminFormulasPage() {
  const formulas = await prisma.formula.findMany({
    include: {
      variables: {
        orderBy: { name: "asc" },
      },
      keywords: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 right-1/4 size-[600px] rounded-full bg-violet-600/6 blur-[130px]" />
        <div className="absolute left-1/4 top-1/3 size-[500px] rounded-full bg-fuchsia-600/5 blur-[130px]" />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับหน้าหลัก
            </Link>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                จัดการตัวแปรสูตรคำนวณ
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                ปรับแต่งค่าตัวแปร เช่น ค่าไฟ ค่าแรง ของแต่ละสูตร
                การเปลี่ยนแปลงนี้จะมีผลกับการคำนวณกำไรทันที
              </p>
            </div>
          </div>

          <Link
            href="/admin/formulas/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 whitespace-nowrap"
          >
            <span className="text-lg">➕</span> สร้างสูตรใหม่
          </Link>
        </div>

        {/* Formulas List */}
        <div className="space-y-6">
          {formulas.map((formula) => (
            <Card key={formula.id} className="bg-card border-border shadow-md">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <span className="text-2xl">🧮</span> {formula.name}
                    </CardTitle>
                    <CardDescription className="mt-2 font-mono text-xs bg-secondary/30 p-2 rounded-md border border-border/40 text-muted-foreground/80 break-all">
                      {formula.expression}
                    </CardDescription>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      Keywords (สำหรับเดาสูตรอัตโนมัติ):
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[250px]">
                      {formula.keywords.map((kw) => (
                        <Badge
                          key={kw.id}
                          variant="outline"
                          className="text-[10px] bg-secondary/10"
                        >
                          {kw.keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-4 px-2 py-1 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="w-16">ตัวแปร</div>
                    <div className="flex-1">คำอธิบาย</div>
                    <div className="w-32 text-right">ค่าปัจจุบัน</div>
                    <div className="w-20"></div>
                  </div>

                  {formula.variables.map((variable) => (
                    <VariableEditor key={variable.id} variable={variable} />
                  ))}

                  {formula.variables.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground bg-secondary/10 rounded-lg border border-dashed border-border/50">
                      สูตรนี้ไม่มีค่าตัวแปร (Variables) ให้ปรับแต่ง
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {formulas.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                ยังไม่มีสูตรในระบบ
              </h2>
              <p className="text-muted-foreground">
                ไม่พบข้อมูลสูตรการคำนวณในฐานข้อมูล
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
