import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  pushEncryptedDocumentToCloud,
  pullAndDecryptDocumentsFromCloud,
} from "@/services/zero-knowledge-cloud-sync";
import { encryptInvoiceDocument } from "@/services/vault-crypto-service";
import type { InvoiceEstimateDocument } from "@/domain/types";

const mockSampleInvoiceDocument: InvoiceEstimateDocument = {
  id: "doc-sync-test-uuid",
  documentType: "invoice",
  documentStatus: "issued",
  documentNumber: "INV-2026-999",
  issueDate: "2026-10-21",
  business: {
    businessName: "TrueSquare Construction Corp",
    addressLines: ["456 Timberline Trail"],
    city: "Denver",
    region: "CO",
    postalCode: "80202",
    country: "USA",
    email: "contact@truesquare.test",
    phone: "555-0199",
    paymentInstructions: "Net 15",
    defaultTaxLabel: "Sales Tax",
    defaultTaxRateBasisPoints: 850,
  },
  client: {
    id: "client-private-doe",
    name: "Private Client John Doe",
    companyName: "Doe Residential",
    addressLines: ["789 Hidden Valley Rd"],
    city: "Denver",
    region: "CO",
    postalCode: "80202",
    country: "USA",
    email: "secretclient@gmail.com",
    phone: "555-0988",
  },
  currency: "USD",
  items: [
    {
      id: "item-1",
      description: "Structural Cedar Post Installation",
      specification: "Heavy timber Grade A",
      unit: "Piece",
      quantity: 12,
      unitPriceCents: 45000,
      taxable: true,
    },
  ],
  taxLabel: "Sales Tax",
  taxRateBasisPoints: 850,
  notes: "Confidential contractor estimate notes.",
  paymentTerms: "Net 15 Days",
  generatedFromBudget: false,
  isDemo: false,
  createdAt: "2026-10-21T00:00:00.000Z",
  updatedAt: "2026-10-21T00:00:00.000Z",
  catalogueVersion: "1.0.0",
};

const TEST_MASTER_PASSCODE = "ContractorMasterSecurePasscode#2026";

describe("Service: Zero-Knowledge Cloud Sync & Encryption Envelope", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("strictly transmits zero plaintext client details over the wire when pushing to cloud", async () => {
    let capturedRequestBody: Record<string, unknown> = {};

    global.fetch = vi.fn().mockImplementation(async (_url, options) => {
      capturedRequestBody = JSON.parse(options.body as string);
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, documentId: "doc-sync-test-uuid" }),
      };
    });

    const result = await pushEncryptedDocumentToCloud(
      mockSampleInvoiceDocument,
      TEST_MASTER_PASSCODE
    );

    expect(result.success).toBe(true);
    expect(result.documentId).toBe("doc-sync-test-uuid");

    // Network inspection: The body MUST contain ciphertext envelope
    expect(capturedRequestBody.encryptedPayloadBase64).toBeDefined();
    expect(capturedRequestBody.checksumSha256).toBeDefined();
    expect(capturedRequestBody.documentId).toBe("doc-sync-test-uuid");

    // Zero-Knowledge Proof: No client PII or line items exist in the dispatched body string
    const serializedBody = JSON.stringify(capturedRequestBody);
    expect(serializedBody).not.toContain("Private Client John Doe");
    expect(serializedBody).not.toContain("secretclient@gmail.com");
    expect(serializedBody).not.toContain("789 Hidden Valley Rd");
    expect(serializedBody).not.toContain("Structural Cedar Post Installation");
    expect(serializedBody).not.toContain("Confidential contractor estimate notes");
  });

  it("pulls and decrypts remote document envelopes into domain documents", async () => {
    // 1. Generate real encrypted payload
    const encryptedPayload = await encryptInvoiceDocument(
      mockSampleInvoiceDocument,
      TEST_MASTER_PASSCODE
    );
    const serializedBase64 = btoa(JSON.stringify(encryptedPayload));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        documents: [
          {
            documentId: mockSampleInvoiceDocument.id,
            documentNumber: mockSampleInvoiceDocument.documentNumber,
            documentType: mockSampleInvoiceDocument.documentType,
            version: 1,
            encryptedPayloadBase64: serializedBase64,
            checksumSha256: "fake-sha-checksum",
            updatedAt: new Date().toISOString(),
          },
        ],
      }),
    });

    const pullResult = await pullAndDecryptDocumentsFromCloud(TEST_MASTER_PASSCODE);

    expect(pullResult.decryptedCount).toBe(1);
    expect(pullResult.documents[0].client.name).toBe("Private Client John Doe");
    expect(pullResult.documents[0].business.businessName).toBe(
      "TrueSquare Construction Corp"
    );
  });
});
