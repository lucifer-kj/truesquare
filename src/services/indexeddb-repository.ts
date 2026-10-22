import type {
  InvoiceEstimateDocument,
  DocumentSummaryRecord,
  ClientDirectoryRecord,
  DashboardKpiMetrics,
  DocumentFilterCriteria,
  DocumentLifecycleStatus,
  VaultExportBackupPackage,
} from "@/domain/types";
import { VaultExportBackupPackageSchema } from "@/domain/schemas";
import { calculateLineTotalCents } from "@/domain/calculations";
import { generateDocumentNumber } from "@/domain/invoice-number";

const DATABASE_NAME = "buildbill_contractor_vault_db";
const DATABASE_VERSION = 1;
const DOCUMENTS_STORE = "invoice_estimate_documents";
const CLIENTS_STORE = "contractor_clients";

// Internal in-memory fallback cache for Node/Vitest test environments where indexedDB is not available
const fallbackInMemoryDocumentsMap = new Map<string, InvoiceEstimateDocument>();
const fallbackInMemoryClientsMap = new Map<string, ClientDirectoryRecord>();

function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openVaultDatabase(): Promise<IDBDatabase> {
  return new Promise((resolvePromise, rejectPromise) => {
    if (!isIndexedDbAvailable()) {
      rejectPromise(new Error("IndexedDB is not available in current runtime environment."));
      return;
    }

    const openDatabaseRequest = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    openDatabaseRequest.onupgradeneeded = (upgradeEvent) => {
      const targetDatabase = (upgradeEvent.target as IDBOpenDBRequest).result;

      // 1. Documents Object Store
      if (!targetDatabase.objectStoreNames.contains(DOCUMENTS_STORE)) {
        const documentsStore = targetDatabase.createObjectStore(DOCUMENTS_STORE, {
          keyPath: "id",
        });
        documentsStore.createIndex("by_number", "documentNumber", { unique: false });
        documentsStore.createIndex("by_type", "documentType", { unique: false });
        documentsStore.createIndex("by_status", "documentStatus", { unique: false });
        documentsStore.createIndex("by_updated", "updatedAt", { unique: false });
      }

      // 2. Clients Object Store
      if (!targetDatabase.objectStoreNames.contains(CLIENTS_STORE)) {
        const clientsStore = targetDatabase.createObjectStore(CLIENTS_STORE, {
          keyPath: "id",
        });
        clientsStore.createIndex("by_name", "name", { unique: false });
        clientsStore.createIndex("by_billed", "totalBilledCents", { unique: false });
      }
    };

    openDatabaseRequest.onsuccess = () => resolvePromise(openDatabaseRequest.result);
    openDatabaseRequest.onerror = () => rejectPromise(openDatabaseRequest.error);
  });
}

function calculateDocumentTotalCents(targetDocument: InvoiceEstimateDocument): number {
  let subtotalCents = 0;
  let taxableSubtotalCents = 0;

  for (const lineItem of targetDocument.items) {
    const lineTotalCents = calculateLineTotalCents(lineItem.quantity, lineItem.unitPriceCents);
    subtotalCents += lineTotalCents;
    if (lineItem.taxable) {
      taxableSubtotalCents += lineTotalCents;
    }
  }

  const taxCents = Math.round((taxableSubtotalCents * targetDocument.taxRateBasisPoints) / 10000);
  return subtotalCents + taxCents;
}

export function convertDocumentToSummary(
  targetDocument: InvoiceEstimateDocument & { deletedAt?: string | null }
): DocumentSummaryRecord {
  return {
    id: targetDocument.id,
    documentType: targetDocument.documentType,
    documentStatus: targetDocument.documentStatus,
    documentNumber: targetDocument.documentNumber,
    clientName: targetDocument.client.name,
    clientCompanyName: targetDocument.client.companyName,
    issueDate: targetDocument.issueDate,
    dueOrExpiryDate: targetDocument.dueOrExpiryDate,
    totalCents: calculateDocumentTotalCents(targetDocument),
    itemCount: targetDocument.items.length,
    createdAt: targetDocument.createdAt,
    updatedAt: targetDocument.updatedAt,
    deletedAt: targetDocument.deletedAt ?? null,
  };
}

/**
 * Persists an invoice or estimate into the repository and updates client aggregations.
 */
export async function saveDocumentToRepository(
  invoiceDocument: InvoiceEstimateDocument
): Promise<void> {
  const documentWithTimestamp: InvoiceEstimateDocument & { deletedAt?: string | null } = {
    ...invoiceDocument,
    updatedAt: new Date().toISOString(),
  };

  if (!isIndexedDbAvailable()) {
    fallbackInMemoryDocumentsMap.set(documentWithTimestamp.id, documentWithTimestamp);
    await syncClientRecordForDocument(documentWithTimestamp);
    return;
  }

  const databaseConnection = await openVaultDatabase();
  return new Promise((resolvePromise, rejectPromise) => {
    const databaseTransaction = databaseConnection.transaction([DOCUMENTS_STORE], "readwrite");
    const documentsStore = databaseTransaction.objectStore(DOCUMENTS_STORE);
    const saveRequest = documentsStore.put(documentWithTimestamp);

    saveRequest.onsuccess = async () => {
      await syncClientRecordForDocument(documentWithTimestamp);
      resolvePromise();
    };
    saveRequest.onerror = () => rejectPromise(saveRequest.error);
  });
}

/**
 * Retrieves a single complete document by identifier.
 */
export async function getDocumentByIdFromRepository(
  targetDocumentIdentifier: string
): Promise<(InvoiceEstimateDocument & { deletedAt?: string | null }) | null> {
  if (!isIndexedDbAvailable()) {
    return fallbackInMemoryDocumentsMap.get(targetDocumentIdentifier) || null;
  }

  const databaseConnection = await openVaultDatabase();
  return new Promise((resolvePromise, rejectPromise) => {
    const databaseTransaction = databaseConnection.transaction([DOCUMENTS_STORE], "readonly");
    const documentsStore = databaseTransaction.objectStore(DOCUMENTS_STORE);
    const getRequest = documentsStore.get(targetDocumentIdentifier);

    getRequest.onsuccess = () => resolvePromise(getRequest.result || null);
    getRequest.onerror = () => rejectPromise(getRequest.error);
  });
}

/**
 * Lists lightweight document summaries filtered by type, status, or search query.
 */
export async function listDocumentSummaries(
  filterCriteria: DocumentFilterCriteria = {}
): Promise<DocumentSummaryRecord[]> {
  const allDocuments = await fetchAllRawDocuments();

  const filteredDocuments = allDocuments.filter((candidateDocument) => {
    const isSoftDeleted = Boolean(candidateDocument.deletedAt);

    // Filter by trash / deleted state
    if (filterCriteria.lifecycleStatus === "trash") {
      if (!isSoftDeleted) return false;
    } else {
      if (isSoftDeleted) return false;
      if (
        filterCriteria.lifecycleStatus &&
        filterCriteria.lifecycleStatus !== "all" &&
        candidateDocument.documentStatus !== filterCriteria.lifecycleStatus
      ) {
        return false;
      }
    }

    // Filter by classification type (invoice vs estimate)
    if (
      filterCriteria.classificationType &&
      filterCriteria.classificationType !== "all" &&
      candidateDocument.documentType !== filterCriteria.classificationType
    ) {
      return false;
    }

    // Filter by text search query
    if (filterCriteria.searchQuery && filterCriteria.searchQuery.trim()) {
      const normalizedQuery = filterCriteria.searchQuery.toLowerCase().trim();
      const matchesNumber = candidateDocument.documentNumber.toLowerCase().includes(normalizedQuery);
      const matchesClientName = candidateDocument.client.name.toLowerCase().includes(normalizedQuery);
      const matchesCompanyName = (candidateDocument.client.companyName || "")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesNotes = candidateDocument.notes.toLowerCase().includes(normalizedQuery);

      if (!matchesNumber && !matchesClientName && !matchesCompanyName && !matchesNotes) {
        return false;
      }
    }

    return true;
  });

  // Sort descending by updated date
  filteredDocuments.sort(
    (firstDoc, secondDoc) =>
      new Date(secondDoc.updatedAt).getTime() - new Date(firstDoc.updatedAt).getTime()
  );

  return filteredDocuments.map(convertDocumentToSummary);
}

/**
 * Soft-deletes a document (moves to local Trash Bin without data loss).
 */
export async function softDeleteDocument(targetDocumentIdentifier: string): Promise<boolean> {
  const existingDocument = await getDocumentByIdFromRepository(targetDocumentIdentifier);
  if (!existingDocument) return false;

  const softDeletedDocument = {
    ...existingDocument,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveDocumentToRepository(softDeletedDocument);
  return true;
}

/**
 * Restores a soft-deleted document from the Trash Bin.
 */
export async function restoreDocumentFromTrash(targetDocumentIdentifier: string): Promise<boolean> {
  const existingDocument = await getDocumentByIdFromRepository(targetDocumentIdentifier);
  if (!existingDocument) return false;

  const restoredDocument = {
    ...existingDocument,
    deletedAt: null,
    updatedAt: new Date().toISOString(),
  };

  await saveDocumentToRepository(restoredDocument);
  return true;
}

/**
 * Permanently purges a document from the repository.
 */
export async function permanentDeleteDocument(targetDocumentIdentifier: string): Promise<boolean> {
  if (!isIndexedDbAvailable()) {
    return fallbackInMemoryDocumentsMap.delete(targetDocumentIdentifier);
  }

  const databaseConnection = await openVaultDatabase();
  return new Promise((resolvePromise, rejectPromise) => {
    const databaseTransaction = databaseConnection.transaction([DOCUMENTS_STORE], "readwrite");
    const documentsStore = databaseTransaction.objectStore(DOCUMENTS_STORE);
    const deleteRequest = documentsStore.delete(targetDocumentIdentifier);

    deleteRequest.onsuccess = () => resolvePromise(true);
    deleteRequest.onerror = () => rejectPromise(deleteRequest.error);
  });
}

/**
 * Clears all documents and client records from the repository (useful for testing and data reset).
 */
export async function clearAllRepositoryData(): Promise<void> {
  fallbackInMemoryDocumentsMap.clear();
  fallbackInMemoryClientsMap.clear();

  if (!isIndexedDbAvailable()) return;

  const databaseConnection = await openVaultDatabase();
  return new Promise((resolvePromise, rejectPromise) => {
    const databaseTransaction = databaseConnection.transaction(
      [DOCUMENTS_STORE, CLIENTS_STORE],
      "readwrite"
    );
    const documentsStore = databaseTransaction.objectStore(DOCUMENTS_STORE);
    const clientsStore = databaseTransaction.objectStore(CLIENTS_STORE);

    documentsStore.clear();
    clientsStore.clear();

    databaseTransaction.oncomplete = () => resolvePromise();
    databaseTransaction.onerror = () => rejectPromise(databaseTransaction.error);
  });
}

/**
 * Updates lifecycle status of an existing document (e.g. marking "paid" or "issued").
 */
export async function updateDocumentStatusInRepository(
  targetDocumentIdentifier: string,
  targetLifecycleStatus: DocumentLifecycleStatus
): Promise<boolean> {
  const existingDocument = await getDocumentByIdFromRepository(targetDocumentIdentifier);
  if (!existingDocument) return false;

  const updatedDocument = {
    ...existingDocument,
    documentStatus: targetLifecycleStatus,
    updatedAt: new Date().toISOString(),
  };

  await saveDocumentToRepository(updatedDocument);
  return true;
}

/**
 * Duplicates an existing document to easily create recurring invoices.
 */
export async function duplicateDocumentInRepository(
  sourceDocumentIdentifier: string
): Promise<InvoiceEstimateDocument | null> {
  const sourceDocument = await getDocumentByIdFromRepository(sourceDocumentIdentifier);
  if (!sourceDocument) return null;

  const currentIsoTimestamp = new Date().toISOString();
  const freshDocumentNumber = `COPY-${sourceDocument.documentNumber.replace(/^COPY-/, "")}`;

  const duplicatedDocument: InvoiceEstimateDocument = {
    ...sourceDocument,
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentNumber: freshDocumentNumber,
    documentStatus: "draft",
    issueDate: new Date().toISOString().slice(0, 10),
    createdAt: currentIsoTimestamp,
    updatedAt: currentIsoTimestamp,
  };

  await saveDocumentToRepository(duplicatedDocument);
  return duplicatedDocument;
}

/**
 * Converts an accepted estimate into an active tax invoice with a sequential INV- number.
 */
export async function convertEstimateToInvoiceInRepository(
  sourceEstimateIdentifier: string
): Promise<InvoiceEstimateDocument | null> {
  const sourceEstimate = await getDocumentByIdFromRepository(sourceEstimateIdentifier);
  if (!sourceEstimate) return null;

  const currentIsoTimestamp = new Date().toISOString();
  const allDocuments = await fetchAllRawDocuments();
  const existingNumbers = allDocuments.map((doc) => doc.documentNumber);
  const freshInvoiceNumber = generateDocumentNumber("invoice", existingNumbers);

  // 1. Mark the original estimate as saved
  const acceptedEstimate: InvoiceEstimateDocument = {
    ...sourceEstimate,
    documentStatus: "saved",
    updatedAt: currentIsoTimestamp,
  };
  await saveDocumentToRepository(acceptedEstimate);

  // 2. Spawn the new invoice
  const currentDate = currentIsoTimestamp.slice(0, 10);
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const convertedInvoice: InvoiceEstimateDocument = {
    ...sourceEstimate,
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentType: "invoice",
    documentStatus: "issued",
    documentNumber: freshInvoiceNumber,
    issueDate: currentDate,
    dueOrExpiryDate: thirtyDaysLater,
    paymentTerms: "Due Upon Receipt",
    notes: sourceEstimate.notes
      ? `${sourceEstimate.notes}\n[Converted from Estimate ${sourceEstimate.documentNumber}]`
      : `Converted from Estimate ${sourceEstimate.documentNumber}`,
    createdAt: currentIsoTimestamp,
    updatedAt: currentIsoTimestamp,
  };

  await saveDocumentToRepository(convertedInvoice);
  return convertedInvoice;
}

/**
 * Computes aggregated financial KPIs across all active non-deleted documents.
 */
export async function calculateDashboardKpiMetrics(): Promise<DashboardKpiMetrics> {
  const allDocuments = await fetchAllRawDocuments();
  const activeDocuments = allDocuments.filter((doc) => !doc.deletedAt);

  let totalInvoicedCents = 0;
  let outstandingReceivableCents = 0;
  let activeEstimatesCents = 0;
  let paidInvoicesCount = 0;
  let activeEstimatesCount = 0;

  for (const activeDocument of activeDocuments) {
    const documentTotalCents = calculateDocumentTotalCents(activeDocument);

    if (activeDocument.documentType === "invoice") {
      if (activeDocument.documentStatus === "paid") {
        totalInvoicedCents += documentTotalCents;
        paidInvoicesCount += 1;
      } else if (
        activeDocument.documentStatus === "issued" ||
        activeDocument.documentStatus === "overdue"
      ) {
        totalInvoicedCents += documentTotalCents;
        outstandingReceivableCents += documentTotalCents;
      }
    } else if (activeDocument.documentType === "estimate") {
      activeEstimatesCents += documentTotalCents;
      activeEstimatesCount += 1;
    }
  }

  const allClients = await listClientsFromRepository();

  return {
    totalInvoicedCents,
    outstandingReceivableCents,
    activeEstimatesCents,
    paidInvoicesCount,
    activeEstimatesCount,
    totalClientsCount: allClients.length,
  };
}

/**
 * Lists all registered clients with total billed sums.
 */
export async function listClientsFromRepository(
  searchQuery?: string
): Promise<ClientDirectoryRecord[]> {
  const allClients = await fetchAllRawClients();

  const filteredClients = allClients.filter((candidateClient) => {
    if (!searchQuery || !searchQuery.trim()) return true;
    const normalizedQuery = searchQuery.toLowerCase().trim();
    return (
      candidateClient.name.toLowerCase().includes(normalizedQuery) ||
      (candidateClient.companyName || "").toLowerCase().includes(normalizedQuery) ||
      (candidateClient.email || "").toLowerCase().includes(normalizedQuery)
    );
  });

  filteredClients.sort((firstClient, secondClient) =>
    secondClient.totalBilledCents - firstClient.totalBilledCents
  );

  return filteredClients;
}

/**
 * Direct save/update of a client customer record.
 */
export async function saveClientToRepository(clientRecord: ClientDirectoryRecord): Promise<void> {
  if (!isIndexedDbAvailable()) {
    fallbackInMemoryClientsMap.set(clientRecord.id, clientRecord);
    return;
  }

  const databaseConnection = await openVaultDatabase();
  return new Promise((resolvePromise, rejectPromise) => {
    const databaseTransaction = databaseConnection.transaction([CLIENTS_STORE], "readwrite");
    const clientsStore = databaseTransaction.objectStore(CLIENTS_STORE);
    const saveRequest = clientsStore.put(clientRecord);

    saveRequest.onsuccess = () => resolvePromise();
    saveRequest.onerror = () => rejectPromise(saveRequest.error);
  });
}

/**
 * Synchronizes client directory rollups whenever a document is saved.
 */
async function syncClientRecordForDocument(
  savedDocument: InvoiceEstimateDocument & { deletedAt?: string | null }
): Promise<void> {
  const clientName = savedDocument.client.name.trim();
  if (!clientName) return;

  const clientId = savedDocument.client.id || `client-${clientName.toLowerCase().replace(/\s+/g, "-")}`;
  const existingClientList = await fetchAllRawClients();
  const existingClient = existingClientList.find((client) => client.id === clientId);

  const allDocuments = await fetchAllRawDocuments();
  const clientDocuments = allDocuments.filter(
    (doc) => (doc.client.id === clientId || doc.client.name.trim().toLowerCase() === clientName.toLowerCase()) && !doc.deletedAt
  );

  let totalBilledCents = 0;
  for (const clientDoc of clientDocuments) {
    if (clientDoc.documentType === "invoice" && (clientDoc.documentStatus === "paid" || clientDoc.documentStatus === "issued")) {
      totalBilledCents += calculateDocumentTotalCents(clientDoc);
    }
  }

  const currentTimestamp = new Date().toISOString();
  const updatedClientRecord: ClientDirectoryRecord = {
    id: clientId,
    name: clientName,
    companyName: savedDocument.client.companyName || existingClient?.companyName || "",
    email: savedDocument.client.email || existingClient?.email || "",
    phone: savedDocument.client.phone || existingClient?.phone || "",
    addressLines: savedDocument.client.addressLines || existingClient?.addressLines || [],
    city: savedDocument.client.city || existingClient?.city || "",
    region: savedDocument.client.region || existingClient?.region || "",
    postalCode: savedDocument.client.postalCode || existingClient?.postalCode || "",
    country: savedDocument.client.country || existingClient?.country || "USA",
    totalBilledCents,
    documentCount: clientDocuments.length,
    lastDocumentDate: savedDocument.issueDate,
    createdAt: existingClient?.createdAt || currentTimestamp,
    updatedAt: currentTimestamp,
  };

  await saveClientToRepository(updatedClientRecord);
}

async function fetchAllRawDocuments(): Promise<(InvoiceEstimateDocument & { deletedAt?: string | null })[]> {
  if (!isIndexedDbAvailable()) {
    return Array.from(fallbackInMemoryDocumentsMap.values());
  }

  const databaseConnection = await openVaultDatabase();
  return new Promise((resolvePromise, rejectPromise) => {
    const databaseTransaction = databaseConnection.transaction([DOCUMENTS_STORE], "readonly");
    const documentsStore = databaseTransaction.objectStore(DOCUMENTS_STORE);
    const getAllRequest = documentsStore.getAll();

    getAllRequest.onsuccess = () => resolvePromise(getAllRequest.result || []);
    getAllRequest.onerror = () => rejectPromise(getAllRequest.error);
  });
}

async function fetchAllRawClients(): Promise<ClientDirectoryRecord[]> {
  if (!isIndexedDbAvailable()) {
    return Array.from(fallbackInMemoryClientsMap.values());
  }

  const databaseConnection = await openVaultDatabase();
  return new Promise((resolvePromise, rejectPromise) => {
    const databaseTransaction = databaseConnection.transaction([CLIENTS_STORE], "readonly");
    const clientsStore = databaseTransaction.objectStore(CLIENTS_STORE);
    const getAllRequest = clientsStore.getAll();

    getAllRequest.onsuccess = () => resolvePromise(getAllRequest.result || []);
    getAllRequest.onerror = () => rejectPromise(getAllRequest.error);
  });
}

export const SAMPLE_DATA_LIFECYCLE_STORAGE_KEY = "truesquare:v1:sample-data-lifecycle";
let fallbackSampleDataLifecycleStatus: "active" | "purged" | "retained" = "active";

export function getSampleDataLifecycleStatus(): "active" | "purged" | "retained" {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return fallbackSampleDataLifecycleStatus;
  }
  try {
    const stored = window.localStorage.getItem(SAMPLE_DATA_LIFECYCLE_STORAGE_KEY);
    if (stored === "purged" || stored === "retained") {
      return stored;
    }
    return "active";
  } catch {
    return fallbackSampleDataLifecycleStatus;
  }
}

export function setSampleDataLifecycleStatus(status: "active" | "purged" | "retained"): void {
  fallbackSampleDataLifecycleStatus = status;
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(SAMPLE_DATA_LIFECYCLE_STORAGE_KEY, status);
    } catch {
      // ignore in constrained contexts
    }
  }
}

export async function hasDemoDocumentsInRepository(): Promise<boolean> {
  const allDocuments = await fetchAllRawDocuments();
  return allDocuments.some((doc) => doc.isDemo === true);
}

export async function purgeDemoDocumentsFromRepository(): Promise<number> {
  const allDocuments = await fetchAllRawDocuments();
  let purgedCount = 0;
  for (const candidateDoc of allDocuments) {
    if (candidateDoc.isDemo) {
      await permanentDeleteDocument(candidateDoc.id);
      purgedCount++;
    }
  }
  setSampleDataLifecycleStatus("purged");
  return purgedCount;
}

/**
 * Seeds sample realistic contractor documents if the vault is currently empty and not previously purged.
 */
export async function seedSampleContractorDocumentsIfEmpty(): Promise<void> {
  const lifecycleStatus = getSampleDataLifecycleStatus();
  if (lifecycleStatus === "purged") {
    // Contractor explicitly purged sample data; do not auto-seed
    return;
  }

  const existingDocuments = await fetchAllRawDocuments();
  if (existingDocuments.length > 0) return;

  await forceSeedSampleContractorDocuments();
}

/**
 * Force seeds sample contractor documents on demand (e.g., from settings or testing).
 */
export async function forceSeedSampleContractorDocuments(): Promise<number> {
  setSampleDataLifecycleStatus("active");
  const currentYear = new Date().getFullYear();
  const sampleDocuments: InvoiceEstimateDocument[] = [
    {
      id: "doc-seed-001",
      documentType: "invoice",
      documentStatus: "paid",
      documentNumber: `INV-${currentYear}-0101`,
      issueDate: `${currentYear}-03-15`,
      dueOrExpiryDate: `${currentYear}-04-15`,
      business: {
        businessName: "Lone Star Building Supply Co.",
        addressLines: ["4200 Industrial Parkway"],
        city: "Austin",
        region: "TX",
        postalCode: "78744",
        country: "USA",
        email: "billing@lonestarcontracting.com",
        phone: "(512) 555-0199",
        paymentInstructions: "ACH or check payable to Lone Star Building Supply Co. Net 30.",
        defaultTaxLabel: "Texas State & Local Sales Tax",
        defaultTaxRateBasisPoints: 825,
      },
      client: {
        id: "client-ridge-homes",
        name: "Marcus Vance",
        companyName: "Ridgeview Custom Homes LLC",
        addressLines: ["7804 Canyon Ridge Trail"],
        city: "Austin",
        region: "TX",
        postalCode: "78731",
        country: "USA",
        email: "marcus@ridgeviewcustom.com",
        phone: "(512) 555-8834",
      },
      currency: "USD",
      items: [
        {
          id: "item-seed-1",
          description: "USG Sheetrock Brand Drywall Panel 1/2-in x 4-ft x 8-ft",
          specification: "1/2 in thick, gypsum core, tapered edges",
          unit: "Sheet",
          quantity: 45,
          unitPriceCents: 1548,
          taxable: true,
        },
        {
          id: "item-seed-2",
          description: "Sheetrock All Purpose Joint Compound 4.5-Gal",
          specification: "Pre-mixed vinyl formulation",
          unit: "Pail",
          quantity: 6,
          unitPriceCents: 2198,
          taxable: true,
        },
      ],
      taxLabel: "Texas Sales Tax",
      taxRateBasisPoints: 825,
      notes: "Commercial delivery unloaded to staging bay 2.",
      paymentTerms: "Net 30 Days",
      generatedFromBudget: false,
      isDemo: true,
      createdAt: `${currentYear}-03-15T09:00:00.000Z`,
      updatedAt: `${currentYear}-03-15T09:00:00.000Z`,
      catalogueVersion: "1.0.0",
    },
    {
      id: "doc-seed-002",
      documentType: "invoice",
      documentStatus: "issued",
      documentNumber: `INV-${currentYear}-0102`,
      issueDate: `${currentYear}-04-01`,
      dueOrExpiryDate: `${currentYear}-05-01`,
      business: {
        businessName: "Lone Star Building Supply Co.",
        addressLines: ["4200 Industrial Parkway"],
        city: "Austin",
        region: "TX",
        postalCode: "78744",
        country: "USA",
        email: "billing@lonestarcontracting.com",
        phone: "(512) 555-0199",
        paymentInstructions: "ACH or check payable to Lone Star Building Supply Co. Net 30.",
        defaultTaxLabel: "Texas State & Local Sales Tax",
        defaultTaxRateBasisPoints: 825,
      },
      client: {
        id: "client-pinnacle-framing",
        name: "Elena Rostova",
        companyName: "Pinnacle Framing & Carpentry",
        addressLines: ["1200 E 4th Street, Suite 300"],
        city: "Austin",
        region: "TX",
        postalCode: "78702",
        country: "USA",
        email: "elena@pinnacleframing.com",
        phone: "(512) 555-4421",
      },
      currency: "USD",
      items: [
        {
          id: "item-seed-3",
          description: "2x4x8 SPF Premium Kiln-Dried Stud",
          specification: "Grade #2 or better, spruce-pine-fir",
          unit: "Piece",
          quantity: 120,
          unitPriceCents: 425,
          taxable: true,
        },
      ],
      taxLabel: "Texas Sales Tax",
      taxRateBasisPoints: 825,
      notes: "Pallet delivery with boom lift drop-off.",
      paymentTerms: "Net 30 Days",
      generatedFromBudget: false,
      isDemo: true,
      createdAt: `${currentYear}-04-01T10:00:00.000Z`,
      updatedAt: `${currentYear}-04-01T10:00:00.000Z`,
      catalogueVersion: "1.0.0",
    },
    {
      id: "doc-seed-003",
      documentType: "estimate",
      documentStatus: "saved",
      documentNumber: `EST-${currentYear}-0045`,
      issueDate: `${currentYear}-04-10`,
      dueOrExpiryDate: `${currentYear}-05-10`,
      business: {
        businessName: "Lone Star Building Supply Co.",
        addressLines: ["4200 Industrial Parkway"],
        city: "Austin",
        region: "TX",
        postalCode: "78744",
        country: "USA",
        email: "billing@lonestarcontracting.com",
        phone: "(512) 555-0199",
        paymentInstructions: "Estimate valid for 30 days.",
        defaultTaxLabel: "Texas State & Local Sales Tax",
        defaultTaxRateBasisPoints: 825,
      },
      client: {
        id: "client-vance-residence",
        name: "David Miller",
        companyName: "Miller Custom Renovations",
        addressLines: ["3301 South Lamar Blvd"],
        city: "Austin",
        region: "TX",
        postalCode: "78704",
        country: "USA",
        email: "david@millerreno.com",
        phone: "(512) 555-9012",
      },
      currency: "USD",
      items: [
        {
          id: "item-seed-4",
          description: "Knauf EcoBatt R-13 Kraft Faced Fiberglass Insulation 15-in x 32-ft",
          specification: "Thermal resistance R-13, kraft vapor retarder",
          unit: "Roll",
          quantity: 18,
          unitPriceCents: 2495,
          taxable: true,
        },
      ],
      taxLabel: "Texas Sales Tax",
      taxRateBasisPoints: 825,
      notes: "Price locked until expiration date.",
      paymentTerms: "Due Upon Acceptance",
      generatedFromBudget: false,
      isDemo: true,
      createdAt: `${currentYear}-04-10T14:00:00.000Z`,
      updatedAt: `${currentYear}-04-10T14:00:00.000Z`,
      catalogueVersion: "1.0.0",
    },
  ];

  for (const sampleDocument of sampleDocuments) {
    await saveDocumentToRepository(sampleDocument);
  }
  return sampleDocuments.length;
}

/**
 * Loads all raw documents currently saved in the repository.
 */
export async function loadAllDocumentsFromRepository(): Promise<InvoiceEstimateDocument[]> {
  return fetchAllRawDocuments();
}

/**
 * Exports the entire vault repository as a portable, standardized backup package.
 */
export async function exportEntireVaultSnapshot(): Promise<VaultExportBackupPackage> {
  const allDocuments = await fetchAllRawDocuments();
  const allClients = await fetchAllRawClients();

  return {
    formatVersion: 1,
    exportedAtIsoString: new Date().toISOString(),
    applicationIdentifier: "TrueSquare",
    documentsCollection: allDocuments,
    clientsCollection: allClients,
  };
}

/**
 * Imports and restores an entire vault backup package into the repository.
 */
export async function importVaultSnapshot(
  backupPackageJsonText: string
): Promise<{
  importedDocumentsCount: number;
  importedClientsCount: number;
  validationSuccess: boolean;
  errorMessage?: string;
}> {
  try {
    const rawParsedJson = JSON.parse(backupPackageJsonText);
    const validatedPackage = VaultExportBackupPackageSchema.parse(rawParsedJson);

    for (const targetDocument of validatedPackage.documentsCollection) {
      await saveDocumentToRepository(targetDocument);
    }

    for (const targetClient of validatedPackage.clientsCollection) {
      await saveClientToRepository(targetClient);
    }

    return {
      importedDocumentsCount: validatedPackage.documentsCollection.length,
      importedClientsCount: validatedPackage.clientsCollection.length,
      validationSuccess: true,
    };
  } catch (parseError) {
    return {
      importedDocumentsCount: 0,
      importedClientsCount: 0,
      validationSuccess: false,
      errorMessage: parseError instanceof Error ? parseError.message : "Invalid vault backup package format.",
    };
  }
}

/**
 * Triggers a native browser file download for the vault snapshot.
 */
export async function downloadVaultBackupFile(): Promise<void> {
  const vaultPackage = await exportEntireVaultSnapshot();
  const backupSerialized = JSON.stringify(vaultPackage, null, 2);
  const blob = new Blob([backupSerialized], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement("a");
  const timestampString = new Date().toISOString().replace(/[:.]/g, "-");
  downloadAnchor.href = downloadUrl;
  downloadAnchor.download = `TrueSquare_Vault_Backup_${timestampString}.bbvault`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(downloadUrl);
}


