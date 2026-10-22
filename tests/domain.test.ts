import { describe, it, expect } from "vitest";
import { formatCents, parseCurrencyToCents, roundToCents } from "../src/domain/money";
import { calculateLineTotalCents, calculateDocumentTotals } from "../src/domain/calculations";
import { generateDocumentNumber } from "../src/domain/invoice-number";
import {
  createDefaultContractorBusinessProfile,
  createNewDocumentDraft,
} from "../src/domain/document-factory";
import { InvoiceEstimateDocumentSchema, validateDocumentForExport } from "../src/domain/schemas";
import type { SupplyLineItem } from "../src/domain/types";

describe("Domain: Money Utilities", () => {
  it("formats integer cents into standard USD string", () => {
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(1250)).toBe("$12.50");
    expect(formatCents(105432)).toBe("$1,054.32");
    expect(formatCents(-500)).toBe("-$5.00");
  });

  it("parses user-entered currency strings into integer cents without float drift", () => {
    expect(parseCurrencyToCents("$12.50")).toBe(1250);
    expect(parseCurrencyToCents("12.5")).toBe(1250);
    expect(parseCurrencyToCents("1,450.75")).toBe(145075);
    expect(parseCurrencyToCents("$0.99")).toBe(99);
    expect(parseCurrencyToCents(15.25)).toBe(1525);
    expect(parseCurrencyToCents("invalid")).toBe(0);
    expect(parseCurrencyToCents("-50")).toBe(0);
  });

  it("safely rounds amounts to cents", () => {
    expect(roundToCents(10.499)).toBe(10);
    expect(roundToCents(10.5)).toBe(11);
  });
});

describe("Domain: Calculation Engine", () => {
  it("calculates line total in cents with integer precision", () => {
    expect(calculateLineTotalCents(1500, 5)).toBe(7500);
    expect(calculateLineTotalCents(1000, 2.5)).toBe(2500);
    expect(calculateLineTotalCents(333, 3)).toBe(999);
  });

  it("calculates document totals with 0% tax", () => {
    const supplyItems: SupplyLineItem[] = [
      {
        id: "item-1",
        description: "Drywall Sheet",
        unit: "sheet",
        quantity: 10,
        unitPriceCents: 1500,
        taxable: true,
      },
    ];

    const totals = calculateDocumentTotals({
      supplyItems,
      taxRateBasisPoints: 0,
    });

    expect(totals.subtotalCents).toBe(15000);
    expect(totals.taxableSubtotalCents).toBe(15000);
    expect(totals.taxCents).toBe(0);
    expect(totals.totalCents).toBe(15000);
  });

  it("calculates document totals with 8.25% tax on taxable rows only", () => {
    const supplyItems: SupplyLineItem[] = [
      {
        id: "item-1",
        description: "Drywall Sheet",
        unit: "sheet",
        quantity: 10,
        unitPriceCents: 1500, // $150.00 (taxable)
        taxable: true,
      },
      {
        id: "item-2",
        description: "Delivery Service",
        unit: "service",
        quantity: 1,
        unitPriceCents: 5000, // $50.00 (non-taxable)
        taxable: false,
      },
    ];

    const totals = calculateDocumentTotals({
      supplyItems,
      taxRateBasisPoints: 825,
    });

    expect(totals.subtotalCents).toBe(20000);
    expect(totals.taxableSubtotalCents).toBe(15000);
    expect(totals.taxCents).toBe(1238);
    expect(totals.totalCents).toBe(21238);
  });

  it("calculates remaining budget honestly when target is given", () => {
    const supplyItems: SupplyLineItem[] = [
      {
        id: "item-1",
        description: "2x4 Lumber",
        unit: "piece",
        quantity: 20,
        unitPriceCents: 425,
        taxable: false,
      },
    ];

    const totals = calculateDocumentTotals({
      supplyItems,
      taxRateBasisPoints: 0,
      targetBudgetTotalCents: 10000,
    });

    expect(totals.subtotalCents).toBe(8500);
    expect(totals.totalCents).toBe(8500);
    expect(totals.remainingBudgetCents).toBe(1500);
  });
});

describe("Domain: Invoice Numbering", () => {
  it("generates sequential estimate numbers and avoids collisions", () => {
    const existing = ["EST-2026-0001", "EST-2026-0002", "INV-2026-0001"];
    const nextEst = generateDocumentNumber("estimate", existing, 2026);
    expect(nextEst).toBe("EST-2026-0003");

    const nextInv = generateDocumentNumber("invoice", existing, 2026);
    expect(nextInv).toBe("INV-2026-0002");
  });

  it("starts at 0001 if no prior numbers exist", () => {
    const nextEst = generateDocumentNumber("estimate", [], 2026);
    expect(nextEst).toBe("EST-2026-0001");
  });
});

describe("Domain: Document Factory & Zod Validation", () => {
  it("creates a valid document draft that satisfies Zod schema", () => {
    const contractorProfile = createDefaultContractorBusinessProfile();
    const draft = createNewDocumentDraft({
      documentType: "invoice",
      contractorProfile,
      existingDocumentNumbers: [],
    });

    expect(draft.documentType).toBe("invoice");
    expect(draft.documentNumber).toMatch(/^INV-\d{4}-0001$/);
    expect(draft.currency).toBe("USD");

    const validationResult = InvoiceEstimateDocumentSchema.safeParse(draft);
    expect(validationResult.success).toBe(true);
  });

  it("blocks export if client name or line items are missing", () => {
    const contractorProfile = createDefaultContractorBusinessProfile();
    const draft = createNewDocumentDraft({
      documentType: "invoice",
      contractorProfile,
    });

    const check1 = validateDocumentForExport(draft);
    expect(check1.isValid).toBe(false);
    expect(check1.blockingValidationErrors).toContain("Client customer name is required.");
    expect(check1.blockingValidationErrors).toContain("At least one supply line item is required to generate a document.");

    draft.client.name = "John Doe";
    draft.items.push({
      id: "item-1",
      description: "Drywall 4x8",
      unit: "sheet",
      quantity: 10,
      unitPriceCents: 1500,
      taxable: true,
      catalogueStatus: "verified",
    });

    const check2 = validateDocumentForExport(draft);
    expect(check2.isValid).toBe(true);
    expect(check2.blockingValidationErrors.length).toBe(0);
  });
});
