import prisma from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceHistoryButton } from "@/components/price-history-button";
import { formatPrice } from "@/lib/format-price";
import { FormulaDisplay } from "@/components/formula-display";

function getLatestPrice(
  prices: { price: number; priceVat: number | null; createdAt: Date }[],
) {
  if (!prices.length) return null;
  return prices[0];
}

function getPriceChange(prices: { price: number; createdAt: Date }[]) {
  if (prices.length < 2) return null;
  const diff = prices[0].price - prices[1].price;
  const pct = (diff / prices[1].price) * 100;
  return { diff, pct };
}

export const revalidate = 0;

export default async function Home() {
  const items = await prisma.item.findMany({
    include: {
      prices: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formulas = await prisma.formula.findMany({
    include: {
      variables: true,
      keywords: true,
    },
  });

  const totalItems = items.length;
  const totalPriceRecords = items.reduce(
    (sum, item) => sum + item.prices.length,
    0,
  );
  const itemsWithPrices = items.filter((i) => i.prices.length > 0);
  const avgLatestPrice =
    itemsWithPrices.length > 0
      ? itemsWithPrices.reduce(
          (sum, item) => sum + (item.prices[0]?.price ?? 0),
          0,
        ) / itemsWithPrices.length
      : 0;

  const stats = [
    {
      icon: "📦",
      label: "รายการสินค้า",
      value: totalItems.toLocaleString("th-TH"),
    },
    {
      icon: "🏷️",
      label: "บันทึกราคา",
      value: totalPriceRecords.toLocaleString("th-TH"),
    },
    {
      icon: "💰",
      label: "ราคาเฉลี่ย (บาท/กก.)",
      value: avgLatestPrice > 0 ? formatPrice(avgLatestPrice) : "—",
    },
  ];

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 size-[600px] rounded-full bg-blue-600/6 blur-[130px]" />
        <div className="absolute right-1/4 top-1/3 size-[500px] rounded-full bg-indigo-600/5 blur-[130px]" />
      </div>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-8 space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-400">
              <span className="size-1.5 animate-pulse rounded-full bg-blue-400" />
              Live Data
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              ราคาสินค้า
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ข้อมูลราคาที่อ่านจากรูปภาพด้วย Gemini OCR ผ่าน LINE Bot
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/categories"
              className="inline-flex items-center gap-2 rounded-lg border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-medium text-violet-400 transition hover:bg-violet-400/20"
            >
              🗂️ จัดการหมวดหมู่
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
            >
              🔄 รีเฟรช
            </a>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="text-xl">{s.icon}</span>
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Table ── */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">
                รายการสินค้าทั้งหมด
              </CardTitle>
              <Badge variant="secondary">{totalItems} รายการ</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                <span className="mb-3 text-5xl">📭</span>
                <p className="font-semibold">ยังไม่มีข้อมูลสินค้า</p>
                <p className="text-sm mt-1">
                  ส่งรูปภาพผ่าน LINE Bot เพื่อเพิ่มข้อมูล
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>ชื่อสินค้า</TableHead>
                      <TableHead className="text-right">ราคาล่าสุด</TableHead>
                      <TableHead className="text-right">การคำนวณ</TableHead>
                      <TableHead className="text-right">ราคาสูงสุด</TableHead>
                      <TableHead className="text-center">ประวัติ</TableHead>
                      <TableHead className="text-right">อัปเดตล่าสุด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => {
                      const latest = getLatestPrice(item.prices);
                      const change = getPriceChange(item.prices);
                      const updatedAt =
                        item.prices[0]?.createdAt ?? item.updatedAt;

                      return (
                        <TableRow key={item.id} className="border-border">
                          <TableCell className="text-muted-foreground font-medium">
                            {idx + 1}
                          </TableCell>

                          <TableCell>
                            <p className="font-semibold text-foreground">
                              {item.name}
                            </p>
                            {/* <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                              {item.id.slice(0, 8)}…
                            </p> */}
                          </TableCell>

                          <TableCell className="text-right">
                            {latest ? (
                              <>
                                <p className="font-bold tabular-nums">
                                  {formatPrice(latest.price)}
                                </p>
                                {latest.priceVat != null &&
                                  latest.priceVat > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      VAT: {formatPrice(latest.priceVat)}
                                    </p>
                                  )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">
                                ไม่มีข้อมูล
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <FormulaDisplay
                              itemId={item.id}
                              itemName={item.name}
                              value={item.prices[0].price}
                              formulaId={item.formulaId}
                              formulas={formulas}
                            />
                          </TableCell>

                          <TableCell className="text-right">
                            {change ? (
                              <Badge
                                variant="outline"
                                className={
                                  change.diff >= 0
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                                    : "border-orange-400/30 bg-orange-400/10 text-orange-400"
                                }
                              >
                                {change.diff >= 0 ? "▲" : "▼"}{" "}
                                {Math.abs(change.pct).toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          <TableCell className="text-center">
                            <PriceHistoryButton item={item} />
                          </TableCell>

                          <TableCell className="text-right text-xs text-muted-foreground">
                            {new Date(updatedAt).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          ข้อมูลอัปเดตอัตโนมัติเมื่อมีการส่งรูปภาพผ่าน LINE Bot ·{" "}
          <span className="font-semibold text-blue-500/80">Gemini OCR</span>
        </p>
      </main>
    </div>
  );
}
