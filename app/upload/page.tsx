"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  FileImage,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { processManualOcr } from "@/app/actions/upload.actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format-price";

interface OcrItem {
  item: string;
  price: string | number;
  priceVat?: string | number;
}

export default function ManualUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<OcrItem[]>([]);
  const [rawText, setRawText] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith("image/")) {
        toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResults([]); // Reset previous results on new file
      setRawText("");
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setResults([]);
    setRawText("");
  };

  const handleUpload = () => {
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await processManualOcr(formData);

      if (res.success && res.items) {
        setResults(res.items);
        setRawText(res.rawText || "");
        toast.success(`อ่านข้อมูลสำเร็จ ปริมาณ ${res.items.length} รายการ`);
      } else {
        toast.error(res.error || "ไม่สามารถอ่านข้อความจากรูปภาพได้");
      }
    });
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground pb-20">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 right-1/4 size-[600px] rounded-full bg-blue-600/6 blur-[130px]" />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8 space-y-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <UploadCloud className="w-8 h-8 text-blue-500" /> อัปโหลดรูประบบ
              (ไม่ผ่าน LINE)
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ทดสอบระบบสกัดข้อความ (OCR) ของ Gemini Vision ทันทีบนหน้าเว็บ
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* อัปโหลด & รูปภาพ */}
          <Card className="bg-card border-border shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>เลือกรูปภาพตารางราคา</CardTitle>
              <CardDescription>รูปแบบ JPG, PNG หรือ WebP</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {!previewUrl ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border/50 rounded-xl cursor-pointer bg-secondary/20 hover:bg-secondary/40 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileImage className="w-12 h-12 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground font-semibold">
                      คลิกเพื่ออัปโหลด
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      รองรับไฟล์รูปภาพทั้งหมด
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-border">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain bg-black/40"
                  />
                </div>
              )}

              <div className="mt-auto flex gap-3 pt-4">
                {file && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearFile}
                    disabled={isPending}
                  >
                    เปลี่ยนรูปภาพ
                  </Button>
                )}
                <Button
                  className="flex-1 gap-2"
                  onClick={handleUpload}
                  disabled={!file || isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isPending ? "กำลังวิเคราะห์..." : "อ่านข้อความ (OCR)"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ผลลัพธ์ Raw Text ชั่วคราว */}
          <Card className="bg-card border-border shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>ข้อความดิบ (Raw Text)</CardTitle>
              <CardDescription>
                ข้อมูลสมบูรณ์จาก Gemini ก่อนแปลงตาข่าย
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {rawText ? (
                <div className="h-64 overflow-y-auto w-full rounded-xl bg-secondary/30 p-4 border border-border/50">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                    {rawText}
                  </pre>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center w-full border border-dashed border-border/50 rounded-xl bg-secondary/10">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    ผลลัพธ์จะแสดงที่นี่
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ผลลัพธ์แบบ Table */}
        {results.length > 0 && (
          <Card className="bg-card border-border shadow-sm mt-6 border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-emerald-500 flex gap-2 items-center">
                <CheckCircle2 className="w-5 h-5" /> ตารางข้อมูลสินค้าที่สกัดได้
              </CardTitle>
              <CardDescription>
                ข้อมูลนี้เป็นเพียงการพรีวิวจาก OCR ยังไม่ได้นำไปบันทึกซ้อนกับ
                Database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>ชื่อสินค้า</TableHead>
                      <TableHead className="text-right">ราคา/กก.</TableHead>
                      <TableHead className="text-right">
                        ราคา/กก. (รวม VAT)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((res, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-center text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {res.item}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-400">
                          {res.price ? formatPrice(Number(res.price)) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {res.priceVat
                            ? formatPrice(Number(res.priceVat))
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
