import type { CalculatedDocumentTotals, SupplyLineItem } from "./types";
import { roundToCents } from "./money";

/**
 * Calculate the line total in integer cents for a single supply line item.
 */
export function calculateLineTotalCents(unitPriceCents: number, quantity: number): number {
  if (!Number.isFinite(unitPriceCents) || unitPriceCents < 0) return 0;
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return roundToCents(unitPriceCents * quantity);
}

/**
 * Calculate document-level financial totals strictly in integer cents.
 */
export function calculateDocumentTotals(calculationParams: {
  supplyItems: SupplyLineItem[];
  taxRateBasisPoints: number;
  targetBudgetTotalCents?: number;
}): CalculatedDocumentTotals {
  const { supplyItems, taxRateBasisPoints, targetBudgetTotalCents } = calculationParams;

  let subtotalCents = 0;
  let taxableSubtotalCents = 0;

  for (const lineItem of supplyItems) {
    const lineTotal = calculateLineTotalCents(lineItem.unitPriceCents, lineItem.quantity);
    subtotalCents += lineTotal;
    if (lineItem.taxable) {
      taxableSubtotalCents += lineTotal;
    }
  }

  const safeTaxRateBasisPoints = Math.max(0, taxRateBasisPoints || 0);
  const taxCents = roundToCents((taxableSubtotalCents * safeTaxRateBasisPoints) / 10000);
  const totalCents = subtotalCents + taxCents;

  const remainingBudgetCents =
    typeof targetBudgetTotalCents === "number" && targetBudgetTotalCents > 0
      ? targetBudgetTotalCents - totalCents
      : undefined;

  return {
    subtotalCents,
    taxableSubtotalCents,
    taxCents,
    totalCents,
    remainingBudgetCents,
  };
}
