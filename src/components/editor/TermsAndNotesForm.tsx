import type { FC } from "react";
import type { CalculatedDocumentTotals } from "@/domain/types";
import { formatCents } from "@/domain/money";
import { Receipt, Percent, FileCheck } from "lucide-react";

interface TermsAndNotesFormProps {
  taxLabel: string;
  taxRateBasisPoints: number;
  notes: string;
  paymentTerms: string;
  calculatedDocumentTotals: CalculatedDocumentTotals;
  onUpdateTaxSettings: (taxLabel: string, taxRateBasisPoints: number) => void;
  onUpdateNotesAndTerms: (notes: string, paymentTerms: string) => void;
}

export const TermsAndNotesForm: FC<TermsAndNotesFormProps> = ({
  taxLabel,
  taxRateBasisPoints,
  notes,
  paymentTerms,
  calculatedDocumentTotals,
  onUpdateTaxSettings,
  onUpdateNotesAndTerms,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b border-border">
        <Receipt className="w-4 h-4 text-primary" />
        <h4 className="text-xs font-bold tracking-tight text-foreground">
          Tax, Terms &amp; Remittance Notes
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Tax rate & Notes */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Tax Description
              </label>
              <input
                type="text"
                value={taxLabel}
                onChange={(changeEvent) =>
                  onUpdateTaxSettings(changeEvent.target.value, taxRateBasisPoints)
                }
                placeholder="Sales Tax"
                className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Tax Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.001"
                  value={(taxRateBasisPoints / 100).toFixed(3)}
                  onChange={(changeEvent) => {
                    const parsedRate = Number(changeEvent.target.value);
                    const basisPoints = Math.round(parsedRate * 100);
                    onUpdateTaxSettings(taxLabel, basisPoints);
                  }}
                  className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono pr-6"
                />
                <Percent className="w-3 h-3 text-muted-foreground absolute right-2 top-2" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Legal Notes &amp; Special Conditions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(changeEvent) =>
                onUpdateNotesAndTerms(changeEvent.target.value, paymentTerms)
              }
              placeholder="e.g. Price valid for 30 days. Delivery within Austin metropolitan radius."
              className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Right: Calculated Totals Summary Box */}
        <div className="bg-muted/50 rounded-lg border border-border p-3.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono text-foreground font-medium">
                {formatCents(calculatedDocumentTotals.subtotalCents)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Taxable Subtotal</span>
              <span className="font-mono text-foreground">
                {formatCents(calculatedDocumentTotals.taxableSubtotalCents)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{taxLabel || "Tax"} ({(taxRateBasisPoints / 100).toFixed(2)}%)</span>
              <span className="font-mono text-foreground">
                {formatCents(calculatedDocumentTotals.taxCents)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border mt-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Total Due / Estimated</span>
              </div>
              <span className="text-base font-bold font-mono text-primary">
                {formatCents(calculatedDocumentTotals.totalCents)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
