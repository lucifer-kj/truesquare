import { describe, expect, it } from "vitest";
import { mapDocumentToInvoiceTemplatePayload } from "../src/domain/invoice-template-mapper";
import {
  createNewDocumentDraft,
  createDefaultContractorBusinessProfile,
} from "../src/domain/document-factory";
import type { InvoiceEstimateDocument } from "../src/domain/types";

describe("Domain: Invoice Template Mapper", () => {
  it("correctly maps an estimate document into a pro_forma template payload", () => {
    const freshEstimateDocument: InvoiceEstimateDocument = createNewDocumentDraft({
      documentType: "estimate",
      contractorProfile: createDefaultContractorBusinessProfile(),
    });

    const templatePayload = mapDocumentToInvoiceTemplatePayload(freshEstimateDocument);

    expect(templatePayload.document_type).toBe("pro_forma");
    expect(templatePayload.invoice_no).toBe(freshEstimateDocument.documentNumber);
    expect(templatePayload.currency).toBe("USD");
    expect(templatePayload.seller.name).toBe(freshEstimateDocument.business.businessName);
    expect(templatePayload.bill_to.name).toBe(freshEstimateDocument.client.name);
    expect(templatePayload.tax.rate).toBe(freshEstimateDocument.taxRateBasisPoints / 10000);
    expect(templatePayload.items).toHaveLength(freshEstimateDocument.items.length);
    expect(templatePayload.terms.pro_forma.length).toBeGreaterThan(0);
  });

  it("correctly maps an invoice document into an invoice template payload with due date", () => {
    const freshInvoiceDocument: InvoiceEstimateDocument = createNewDocumentDraft({
      documentType: "invoice",
      contractorProfile: createDefaultContractorBusinessProfile(),
    });
    freshInvoiceDocument.dueOrExpiryDate = "2026-11-30";

    const templatePayload = mapDocumentToInvoiceTemplatePayload(freshInvoiceDocument);

    expect(templatePayload.document_type).toBe("invoice");
    expect(templatePayload.invoice_no).toBe(freshInvoiceDocument.documentNumber);
    expect(templatePayload.due_date).toBe("2026-11-30");
    expect(templatePayload.valid_until).toBe("");
  });
});
