import { type FC } from "react";
import { formatCents } from "@/domain/money";
import type { CalculatedDocumentTotals } from "@/domain/types";
import { ShieldCheck, Layers, FileCheck } from "lucide-react";

export interface StatusBarProps {
  documentNumber: string;
  itemCount: number;
  calculatedTotals: CalculatedDocumentTotals;
  taxRateBasisPoints: number;
  persistenceStatus: "idle" | "saving" | "saved" | "error";
}

export const StatusBar: FC<StatusBarProps> = ({
  documentNumber,
  itemCount,
  calculatedTotals,
  taxRateBasisPoints,
  persistenceStatus,
}) => {
  const taxRatePercent = (taxRateBasisPoints / 100).toFixed(2);

  return (
    <footer className="hidden lg:flex w-full shrink-0 bg-card/95 backdrop-blur-md border-t border-border px-6 py-2 items-center justify-between text-xs select-none shadow-2xs">
      {/* Left: Document Metrics & Offline Guarantee */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-muted-foreground">
          <FileCheck className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono font-bold text-foreground">{documentNumber}</span>
        </div>

        <div className="flex items-center space-x-1 text-muted-foreground pl-3 border-l border-border">
          <Layers className="w-3.5 h-3.5" />
          <span>
            {itemCount} {itemCount === 1 ? "Line Item" : "Line Items"}
          </span>
          {itemCount > 6 && (
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold ml-1">
              &gt;6 items may cause 2-page print
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 text-muted-foreground pl-3 border-l border-border">
          <span
            className={`w-2 h-2 rounded-full ${
              persistenceStatus === "saving" ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
            }`}
          />
          <span className="text-[11px]">
            {persistenceStatus === "saving" ? "Autosaving..." : "Saved Locally"}
          </span>
        </div>

        <div className="flex items-center space-x-1 text-muted-foreground pl-3 border-l border-border">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px]">100% Offline · Zero Telemetry</span>
        </div>
      </div>

      {/* Right: Real-time Tabular Financial Breakdown */}
      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-4 font-mono text-xs">
          <div>
            <span className="text-muted-foreground font-sans text-[11px] mr-1.5">Subtotal:</span>
            <span className="font-medium text-foreground">
              {formatCents(calculatedTotals.subtotalCents)}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground font-sans text-[11px] mr-1.5">
              Tax ({taxRatePercent}%):
            </span>
            <span className="font-medium text-foreground">
              {formatCents(calculatedTotals.taxCents)}
            </span>
          </div>

          <div className="pl-3 border-l border-border">
            <span className="text-muted-foreground font-sans text-[11px] font-bold mr-1.5">
              Total Due:
            </span>
            <span className="font-extrabold text-foreground text-sm">
              {formatCents(calculatedTotals.totalCents)}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
