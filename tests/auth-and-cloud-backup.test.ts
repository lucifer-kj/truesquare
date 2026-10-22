import { describe, it, expect, beforeEach } from "vitest";
import {
  computePinHash,
  getCurrentSession,
  lockCurrentSession,
  unlockSessionWithPin,
  setOperatorPin,
} from "../src/services/auth-service";
import {
  uploadEncryptedDisasterBackup,
  listAvailableCloudBackupSnapshots,
  restoreDocumentFromCloudSnapshot,
} from "../src/services/cloud-backup-service";
import type { InvoiceEstimateDocument } from "../src/domain/types";

describe("Service: Operator Session Authentication & Disaster Backup", () => {
  const createSampleDocument = (): InvoiceEstimateDocument => ({
    id: "doc-backup-test-01",
    documentType: "invoice",
    documentStatus: "issued",
    documentNumber: "INV-2026-BKP-01",
    issueDate: "2026-06-15",
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
      id: "client-bkp-01",
      name: "Marcus Vance",
      companyName: "Ridgeview Custom Homes LLC",
      addressLines: ["7804 Canyon Ridge Trail"],
      city: "Austin",
      region: "TX",
      postalCode: "78731",
      country: "USA",
    },
    currency: "USD",
    items: [
      {
        id: "item-bkp-1",
        description: "Drywall Screws 50lb Pail",
        unit: "Pail",
        quantity: 2,
        unitPriceCents: 4500,
        taxable: true,
      },
    ],
    taxLabel: "Sales Tax",
    taxRateBasisPoints: 825,
    notes: "Site delivery staging bay 2.",
    paymentTerms: "Net 30 Days",
    generatedFromBudget: false,
    isDemo: false,
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-15T10:00:00.000Z",
    catalogueVersion: "1.0.0",
  });

  describe("Operator Session & PIN Security", () => {
    it("computes deterministic SHA-256 hashes for operator PINs", async () => {
      const hash1 = await computePinHash("1234");
      const hash2 = await computePinHash("1234");
      const hashDifferent = await computePinHash("5678");

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashDifferent);
      expect(hash1.length).toBe(64); // 256 bits = 64 hex characters
    });

    it("locks the session and requires valid PIN to unlock", async () => {
      lockCurrentSession();
      expect(getCurrentSession().lockState).toBe("locked");

      // Attempt unlock with wrong PIN
      const wrongPinResult = await unlockSessionWithPin("9999");
      expect(wrongPinResult).toBe(false);
      expect(getCurrentSession().lockState).toBe("locked");

      // Attempt unlock with default demo PIN (1234)
      const validPinResult = await unlockSessionWithPin("1234");
      expect(validPinResult).toBe(true);
      expect(getCurrentSession().lockState).toBe("unlocked");
    });

    it("allows updating operator PIN securely", async () => {
      const updateResult = await setOperatorPin("5555");
      expect(updateResult).toBe(true);

      lockCurrentSession();

      // Old PIN fails
      expect(await unlockSessionWithPin("1234")).toBe(false);
      // New PIN succeeds
      expect(await unlockSessionWithPin("5555")).toBe(true);

      // Reset back to default
      await setOperatorPin("1234");
    });
  });

  describe("Append-Only Cloud Disaster Backup", () => {
    it("creates an encrypted immutable cloud snapshot with SHA-256 checksum", async () => {
      const sampleDoc = createSampleDocument();
      const snapshot = await uploadEncryptedDisasterBackup(sampleDoc);

      expect(snapshot.snapshotId).toContain(sampleDoc.id);
      expect(snapshot.documentNumber).toBe("INV-2026-BKP-01");
      expect(snapshot.checksumSha256.length).toBe(64);
      expect(snapshot.encryptedPayloadBase64.length).toBeGreaterThan(0);

      const availableSnapshots = await listAvailableCloudBackupSnapshots();
      expect(availableSnapshots.some((s) => s.snapshotId === snapshot.snapshotId)).toBe(true);
    });

    it("restores and decrypts a document accurately from a cloud backup snapshot", async () => {
      const sampleDoc = createSampleDocument();
      const snapshot = await uploadEncryptedDisasterBackup(sampleDoc);

      const restoredDoc = await restoreDocumentFromCloudSnapshot(snapshot.snapshotId);
      expect(restoredDoc.id).toBe(sampleDoc.id);
      expect(restoredDoc.documentNumber).toBe(sampleDoc.documentNumber);
      expect(restoredDoc.client.name).toBe("Marcus Vance");
      expect(restoredDoc.items).toHaveLength(1);
      expect(restoredDoc.items[0].unitPriceCents).toBe(4500);
    });
  });
});
