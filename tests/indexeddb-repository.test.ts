import { describe, it, expect, beforeEach } from "vitest";
import {
  saveDocumentToRepository,
  getDocumentByIdFromRepository,
  listDocumentSummaries,
  softDeleteDocument,
  restoreDocumentFromTrash,
  permanentDeleteDocument,
  clearAllRepositoryData,
  duplicateDocumentInRepository,
  updateDocumentStatusInRepository,
  listClientsFromRepository,
  calculateDashboardKpiMetrics,
  exportEntireVaultSnapshot,
  importVaultSnapshot,
  purgeDemoDocumentsFromRepository,
  hasDemoDocumentsInRepository,
  forceSeedSampleContractorDocuments,
  seedSampleContractorDocumentsIfEmpty,
  setSampleDataLifecycleStatus,
  convertEstimateToInvoiceInRepository,
} from "../src/services/indexeddb-repository";
import type { InvoiceEstimateDocument } from "../src/domain/types";

describe("Service: IndexedDB Repository & Document Vault", () => {
  const createMockDocument = (
    id: string,
    number: string,
    type: "invoice" | "estimate",
    status: "draft" | "saved" | "issued" | "paid" | "overdue",
    clientName: string,
    itemPriceCents: number,
    quantity = 10
  ): InvoiceEstimateDocument => ({
    id,
    documentType: type,
    documentStatus: status,
    documentNumber: number,
    issueDate: "2026-04-15",
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
      defaultTaxRateBasisPoints: 1000, // 10% for easy math
    },
    client: {
      id: `client-${clientName.toLowerCase().replace(/\s+/g, "-")}`,
      name: clientName,
      companyName: `${clientName} LLC`,
      addressLines: ["123 Construction Rd"],
      city: "Austin",
      region: "TX",
      postalCode: "78701",
      country: "USA",
      email: `${clientName.toLowerCase().replace(/\s+/g, ".")}@test.com`,
    },
    currency: "USD",
    items: [
      {
        id: `item-${id}-1`,
        description: "Drywall Screws 5lb Box",
        unit: "Box",
        quantity,
        unitPriceCents: itemPriceCents,
        taxable: true,
      },
    ],
    taxLabel: "Sales Tax",
    taxRateBasisPoints: 1000,
    notes: "Project notes",
    paymentTerms: "Net 30",
    generatedFromBudget: false,
    isDemo: false,
    createdAt: "2026-04-15T12:00:00.000Z",
    updatedAt: "2026-04-15T12:00:00.000Z",
    catalogueVersion: "1.0.0",
  });

  beforeEach(async () => {
    // Clear out repository documents and clients before each test
    await clearAllRepositoryData();
  });

  it("saves and retrieves an invoice document successfully", async () => {
    const testDoc = createMockDocument("doc-01", "INV-2026-0001", "invoice", "draft", "Apex Framing", 5000);
    await saveDocumentToRepository(testDoc);

    const retrievedDoc = await getDocumentByIdFromRepository("doc-01");
    expect(retrievedDoc).not.toBeNull();
    expect(retrievedDoc?.documentNumber).toBe("INV-2026-0001");
    expect(retrievedDoc?.client.name).toBe("Apex Framing");
  });

  it("filters documents by classification type and status correctly", async () => {
    await saveDocumentToRepository(createMockDocument("inv-01", "INV-1", "invoice", "paid", "Client A", 1000));
    await saveDocumentToRepository(createMockDocument("inv-02", "INV-2", "invoice", "issued", "Client B", 2000));
    await saveDocumentToRepository(createMockDocument("est-01", "EST-1", "estimate", "saved", "Client C", 3000));

    // Filter by type: invoice
    const invoicesOnly = await listDocumentSummaries({ classificationType: "invoice" });
    expect(invoicesOnly).toHaveLength(2);

    // Filter by type: estimate
    const estimatesOnly = await listDocumentSummaries({ classificationType: "estimate" });
    expect(estimatesOnly).toHaveLength(1);

    // Filter by status: paid
    const paidOnly = await listDocumentSummaries({ lifecycleStatus: "paid" });
    expect(paidOnly).toHaveLength(1);
    expect(paidOnly[0].documentNumber).toBe("INV-1");
  });

  it("handles soft-delete and restore from trash cleanly", async () => {
    const docToDelete = createMockDocument("doc-trash", "INV-TRASH", "invoice", "draft", "Client Trash", 1500);
    await saveDocumentToRepository(docToDelete);

    // Soft delete
    const softDeleted = await softDeleteDocument("doc-trash");
    expect(softDeleted).toBe(true);

    // Active documents list should NOT contain the deleted document
    const activeDocs = await listDocumentSummaries();
    expect(activeDocs.some((d) => d.id === "doc-trash")).toBe(false);

    // Trash list SHOULD contain the deleted document
    const trashDocs = await listDocumentSummaries({ lifecycleStatus: "trash" });
    expect(trashDocs.some((d) => d.id === "doc-trash")).toBe(true);

    // Restore from trash
    const restored = await restoreDocumentFromTrash("doc-trash");
    expect(restored).toBe(true);

    // Now active again
    const activeAfterRestore = await listDocumentSummaries();
    expect(activeAfterRestore.some((d) => d.id === "doc-trash")).toBe(true);
  });

  it("duplicates an existing document into a new draft with fresh document number", async () => {
    const originalDoc = createMockDocument("orig-01", "INV-2026-777", "invoice", "paid", "Client Dupe", 3500);
    await saveDocumentToRepository(originalDoc);

    const duplicatedDoc = await duplicateDocumentInRepository("orig-01");
    expect(duplicatedDoc).not.toBeNull();
    expect(duplicatedDoc?.id).not.toBe("orig-01");
    expect(duplicatedDoc?.documentNumber).toBe("COPY-INV-2026-777");
    expect(duplicatedDoc?.documentStatus).toBe("draft");
    expect(duplicatedDoc?.items).toHaveLength(1);
  });

  it("updates lifecycle status directly in repository", async () => {
    const testDoc = createMockDocument("status-test", "INV-ST-1", "invoice", "issued", "Client Status", 4000);
    await saveDocumentToRepository(testDoc);

    const updated = await updateDocumentStatusInRepository("status-test", "paid");
    expect(updated).toBe(true);

    const updatedDoc = await getDocumentByIdFromRepository("status-test");
    expect(updatedDoc?.documentStatus).toBe("paid");
  });

  it("aggregates client directory billing volume automatically", async () => {
    // 2 paid invoices for the same client: 10 qty * 2000 cents ($200) + 10% tax ($20) = $220 each
    await saveDocumentToRepository(createMockDocument("cli-inv-1", "INV-C-1", "invoice", "paid", "Texas Masonry", 2000, 10));
    await saveDocumentToRepository(createMockDocument("cli-inv-2", "INV-C-2", "invoice", "paid", "Texas Masonry", 2000, 10));

    const clients = await listClientsFromRepository("Texas Masonry");
    expect(clients).toHaveLength(1);
    expect(clients[0].name).toBe("Texas Masonry");
    expect(clients[0].documentCount).toBe(2);
    // Subtotal: 2000 * 10 = 20000 cents ($200.00). Tax: 2000 cents ($20.00). Total: 22000 cents per doc.
    // 2 docs = 44000 cents ($440.00)
    expect(clients[0].totalBilledCents).toBe(44000);
  });

  it("calculates accurate dashboard KPI metrics across all documents", async () => {
    // 1 Paid invoice: subtotal $100 + $10 tax = $110 (11000 cents)
    await saveDocumentToRepository(createMockDocument("kpi-inv-paid", "INV-P", "invoice", "paid", "Client Paid", 1000, 10));
    // 1 Issued (unpaid) invoice: subtotal $200 + $20 tax = $220 (22000 cents)
    await saveDocumentToRepository(createMockDocument("kpi-inv-issued", "INV-I", "invoice", "issued", "Client Issued", 2000, 10));
    // 1 Active estimate: subtotal $300 + $30 tax = $330 (33000 cents)
    await saveDocumentToRepository(createMockDocument("kpi-est", "EST-1", "estimate", "saved", "Client Est", 3000, 10));

    const kpiMetrics = await calculateDashboardKpiMetrics();

    // Total Invoiced = Paid ($110) + Issued ($220) = $330 (33000 cents)
    expect(kpiMetrics.totalInvoicedCents).toBe(33000);
    // Outstanding Receivable = Issued ($220) = 22000 cents
    expect(kpiMetrics.outstandingReceivableCents).toBe(22000);
    // Active Estimates = $330 (33000 cents)
    expect(kpiMetrics.activeEstimatesCents).toBe(33000);
    expect(kpiMetrics.paidInvoicesCount).toBe(1);
    expect(kpiMetrics.activeEstimatesCount).toBe(1);
    expect(kpiMetrics.totalClientsCount).toBe(3);
  });

  it("exports and imports an entire vault backup snapshot losslessly", async () => {
    // Seed 1 invoice and 1 estimate
    const sampleInvoice = createMockDocument("vault-doc-1", "INV-V-1", "invoice", "paid", "Client Alpha", 1500, 5);
    const sampleEstimate = createMockDocument("vault-doc-2", "EST-V-2", "estimate", "saved", "Client Beta", 3500, 2);
    await saveDocumentToRepository(sampleInvoice);
    await saveDocumentToRepository(sampleEstimate);

    // Export entire vault
    const vaultSnapshot = await exportEntireVaultSnapshot();
    expect(vaultSnapshot.formatVersion).toBe(1);
    expect(vaultSnapshot.applicationIdentifier).toBe("TrueSquare");
    expect(vaultSnapshot.documentsCollection).toHaveLength(2);
    expect(vaultSnapshot.clientsCollection).toHaveLength(2);

    // Clear repository to test restoration
    await clearAllRepositoryData();
    const docsAfterClear = await listDocumentSummaries();
    expect(docsAfterClear).toHaveLength(0);

    // Import from JSON snapshot
    const serializedSnapshot = JSON.stringify(vaultSnapshot);
    const importResult = await importVaultSnapshot(serializedSnapshot);
    expect(importResult.validationSuccess).toBe(true);
    expect(importResult.importedDocumentsCount).toBe(2);
    expect(importResult.importedClientsCount).toBe(2);

    // Test backward compatibility: importing legacy BuildBill snapshot
    const legacySnapshot = {
      ...vaultSnapshot,
      applicationIdentifier: "BuildBill",
    };
    const legacyImportResult = await importVaultSnapshot(JSON.stringify(legacySnapshot));
    expect(legacyImportResult.validationSuccess).toBe(true);

    // Verify restored records
    const restoredDocs = await listDocumentSummaries();
    expect(restoredDocs).toHaveLength(2);
    const restoredDoc1 = await getDocumentByIdFromRepository("vault-doc-1");
    expect(restoredDoc1?.documentNumber).toBe("INV-V-1");
  });

  it("safely rejects corrupt or invalid vault backup snapshots without throwing", async () => {
    const corruptSnapshotJson = JSON.stringify({
      formatVersion: 1,
      applicationIdentifier: "WrongApp",
      documentsCollection: "not an array",
    });

    const importResult = await importVaultSnapshot(corruptSnapshotJson);
    expect(importResult.validationSuccess).toBe(false);
    expect(importResult.importedDocumentsCount).toBe(0);
    expect(importResult.errorMessage).toBeDefined();
  });

  it("ensures demo data is completely disabled and clean slate is maintained", async () => {
    // Clean-slate verification: no demo documents are ever seeded into repository
    const seededCount = await forceSeedSampleContractorDocuments();
    expect(seededCount).toBe(0);

    const hasDemos = await hasDemoDocumentsInRepository();
    expect(hasDemos).toBe(false);

    // Empty repository will not seed demo documents
    await clearAllRepositoryData();
    await seedSampleContractorDocumentsIfEmpty();
    const docsAfterAutoSeed = await listDocumentSummaries();
    expect(docsAfterAutoSeed).toHaveLength(0);

    // Add 1 real document
    const realDocument = createMockDocument("real-doc-1", "INV-REAL-1", "invoice", "paid", "Real Client", 5000, 1);
    await saveDocumentToRepository(realDocument);

    const summaries = await listDocumentSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].id).toBe("real-doc-1");
  });

  it("converts an estimate to an active tax invoice with sequential INV- number and saves both", async () => {
    const originalEstimate = createMockDocument("est-convert-1", "EST-2026-0005", "estimate", "saved", "Client Conversion Test", 2500, 4);
    await saveDocumentToRepository(originalEstimate);

    const convertedInvoice = await convertEstimateToInvoiceInRepository("est-convert-1");
    expect(convertedInvoice).not.toBeNull();
    expect(convertedInvoice?.documentType).toBe("invoice");
    expect(convertedInvoice?.documentStatus).toBe("issued");
    expect(convertedInvoice?.documentNumber).toMatch(/^INV-2026-/);
    expect(convertedInvoice?.paymentTerms).toBe("Due Upon Receipt");

    // Total should match: 4 * 2500 = 10000 cents
    expect(convertedInvoice?.items[0].unitPriceCents).toBe(2500);
    expect(convertedInvoice?.items[0].quantity).toBe(4);

    // Both documents should exist in the repository
    const allSummaries = await listDocumentSummaries();
    expect(allSummaries).toHaveLength(2);

    const updatedEstimate = await getDocumentByIdFromRepository("est-convert-1");
    expect(updatedEstimate?.documentStatus).toBe("saved");
  });
});


