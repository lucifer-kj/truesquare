import { describe, it, expect } from "vitest";
import {
  encryptPlaintextPayload,
  decryptCiphertextPayload,
  encryptInvoiceDocument,
  decryptInvoiceDocument,
  convertBufferToBase64,
  convertBase64ToBuffer,
} from "../src/services/vault-crypto-service";
import type { InvoiceEstimateDocument } from "../src/domain/types";

describe("Service: Vault WebCrypto AES-GCM 256 Encryption", () => {
  const samplePasscode = "ContractorSecretPasscode#2026";
  const samplePlaintext = JSON.stringify({
    clientName: "Acme Framing Co.",
    amountCents: 450000,
    jobLocation: "Austin, Texas",
  });

  it("converts binary buffers to base64 and back losslessly", () => {
    const originalBytes = new Uint8Array([0, 255, 128, 42, 19, 73]);
    const base64Encoded = convertBufferToBase64(originalBytes);
    const roundTrippedBytes = convertBase64ToBuffer(base64Encoded);

    expect(Array.from(roundTrippedBytes)).toEqual(Array.from(originalBytes));
  });

  it("encrypts and decrypts arbitrary plaintext correctly using a passcode", async () => {
    const encryptedPayload = await encryptPlaintextPayload(samplePlaintext, samplePasscode);

    expect(encryptedPayload.algorithm).toBe("AES-GCM-256");
    expect(encryptedPayload.version).toBe(1);
    expect(encryptedPayload.ciphertextBase64.length).toBeGreaterThan(0);
    expect(encryptedPayload.initializationVectorBase64.length).toBeGreaterThan(0);
    expect(encryptedPayload.saltBase64.length).toBeGreaterThan(0);

    // Verify decrypted plaintext matches original exactly
    const decryptedResult = await decryptCiphertextPayload(encryptedPayload, samplePasscode);
    expect(decryptedResult).toBe(samplePlaintext);
  });

  it("fails decryption when provided an incorrect passcode", async () => {
    const encryptedPayload = await encryptPlaintextPayload(samplePlaintext, samplePasscode);

    await expect(
      decryptCiphertextPayload(encryptedPayload, "WrongPasscode#9999")
    ).rejects.toThrow(/Decryption failed/i);
  });

  it("fails decryption when ciphertext is tampered with", async () => {
    const encryptedPayload = await encryptPlaintextPayload(samplePlaintext, samplePasscode);

    // Corrupt one character in the base64 ciphertext
    const corruptedBase64 =
      encryptedPayload.ciphertextBase64.slice(0, -2) +
      (encryptedPayload.ciphertextBase64.endsWith("A") ? "B" : "A") +
      "=";

    const tamperedPayload = {
      ...encryptedPayload,
      ciphertextBase64: corruptedBase64,
    };

    await expect(
      decryptCiphertextPayload(tamperedPayload, samplePasscode)
    ).rejects.toThrow();
  });

  it("encrypts and decrypts a complete InvoiceEstimateDocument losslessly", async () => {
    const mockDocument: InvoiceEstimateDocument = {
      id: "doc-vault-test-01",
      documentType: "invoice",
      documentStatus: "issued",
      documentNumber: "INV-2026-9090",
      issueDate: "2026-05-01",
      business: {
        businessName: "Lone Star Building Supply Co.",
        addressLines: ["4200 Industrial Parkway"],
        city: "Austin",
        region: "TX",
        postalCode: "78744",
        country: "USA",
        email: "billing@lonestar.com",
        phone: "(512) 555-0199",
        paymentInstructions: "Net 30",
        defaultTaxLabel: "Sales Tax",
        defaultTaxRateBasisPoints: 825,
      },
      client: {
        id: "client-test-01",
        name: "Sarah Connor",
        companyName: "Cyberdyne Renovations",
        addressLines: ["100 Tech Blvd"],
        city: "Austin",
        region: "TX",
        postalCode: "78701",
        country: "USA",
      },
      currency: "USD",
      items: [
        {
          id: "item-1",
          description: "2x4x8 SPF Stud",
          specification: "Kiln dried #2",
          unit: "Piece",
          quantity: 50,
          unitPriceCents: 450,
          taxable: true,
        },
      ],
      taxLabel: "Sales Tax",
      taxRateBasisPoints: 825,
      notes: "Delivery to site entrance.",
      paymentTerms: "Net 30 Days",
      generatedFromBudget: false,
      isDemo: false,
      createdAt: "2026-05-01T10:00:00.000Z",
      updatedAt: "2026-05-01T10:00:00.000Z",
      catalogueVersion: "1.0.0",
    };

    const encryptedDoc = await encryptInvoiceDocument(mockDocument, samplePasscode);
    const decryptedDoc = await decryptInvoiceDocument(encryptedDoc, samplePasscode);

    expect(decryptedDoc.id).toBe(mockDocument.id);
    expect(decryptedDoc.documentNumber).toBe("INV-2026-9090");
    expect(decryptedDoc.client.name).toBe("Sarah Connor");
    expect(decryptedDoc.items).toHaveLength(1);
    expect(decryptedDoc.items[0].unitPriceCents).toBe(450);
  });
});
