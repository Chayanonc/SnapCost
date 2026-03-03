"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

function formatPrice(price: number) {
  return price.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Price = {
  id: string;
  price: number;
  priceVat: number | null;
  createdAt: Date;
};

type Item = {
  id: string;
  name: string;
  prices: Price[];
};

export function PriceHistoryButton({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);

  if (item.prices.length === 0) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-8 opacity-40"
        disabled
      >
        <History className="size-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10"
        onClick={() => setOpen(true)}
        title="ดูประวัติราคา"
      >
        <History className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dark max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              ประวัติราคา: <span className="text-blue-400">{item.name}</span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-3 pt-1">
              {item.prices.map((record, idx) => {
                const isLatest = idx === 0;
                const prev = item.prices[idx + 1];
                const diff = prev ? record.price - prev.price : null;
                const pct = diff && prev ? (diff / prev.price) * 100 : null;

                return (
                  <div
                    key={record.id}
                    className={`relative rounded-xl border p-4 transition ${
                      isLatest
                        ? "border-blue-400/30 bg-blue-400/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    {/* timeline dot */}
                    <span
                      className={`absolute -left-px top-1/2 -translate-y-1/2 hidden sm:block w-2 h-2 rounded-full ${
                        isLatest
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                          : "bg-muted-foreground/40"
                      }`}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-lg font-bold tabular-nums ${
                            isLatest
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatPrice(record.price)}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            ฿
                          </span>
                        </p>
                        {record.priceVat != null && record.priceVat > 0 && (
                          <p className="text-xs text-muted-foreground">
                            VAT: {formatPrice(record.priceVat)} ฿
                          </p>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                          {new Date(record.createdAt).toLocaleDateString(
                            "th-TH",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            },
                          )}
                        </span>
                        {pct !== null && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              pct >= 0
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                                : "border-orange-400/30 bg-orange-400/10 text-orange-400"
                            }`}
                          >
                            {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
                          </Badge>
                        )}
                        {isLatest && (
                          <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
                            ล่าสุด
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
