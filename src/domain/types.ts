export type BuildingTradeCategory =
  | "concrete"
  | "masonry"
  | "lumber"
  | "steel"
  | "drywall"
  | "roofing"
  | "insulation"
  | "fasteners"
  | "tools"
  | "other";

export type CatalogueFreshnessStatus = "verified" | "demo" | "stale";
export type ProductTaxCategory = "taxable" | "non_taxable" | "review";

export type CatalogSupplyProduct = {
  id: string;
  brand: string | null;
  productName: string;
  specification: string;
  sku: string | null;
  category: BuildingTradeCategory;
  compatibleJobTypes: string[];
  unit: string;
  quantityStep: number;
  unitPriceCents: number; // Stored in integer cents
  currency: "USD";
  retailer: string;
  sourceUrl: string;
  market: string;
  priceCheckedAt: string; // ISO date YYYY-MM-DD
  catalogueStatus: CatalogueFreshnessStatus;
  taxCategory: ProductTaxCategory;
  minQuantity: number;
  maxQuantity: number;
  active: boolean;
};

export type ContractorBusinessProfile = {
  businessName: string;
  addressLines: string[];
  city: string;
  region: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  paymentInstructions: string;
  defaultTaxLabel: string;
  defaultTaxRateBasisPoints: number; // e.g. 825 for 8.25%
};

export type ClientCustomerRecord = {
  id: string;
  name: string;
  companyName?: string;
  addressLines: string[];
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
};

export type SupplyLineItem = {
  id: string;
  productId?: string;
  description: string;
  specification?: string;
  sku?: string;
  unit: string;
  quantity: number;
  unitPriceCents: number;
  taxable: boolean;
  sourcePriceCheckedAt?: string;
  sourceRetailer?: string;
  catalogueStatus?: CatalogueFreshnessStatus;
};

export type DocumentClassificationType = "estimate" | "invoice";
export type DocumentLifecycleStatus = "draft" | "saved" | "issued" | "paid" | "overdue";

export type DocumentSummaryRecord = {
  id: string;
  documentType: DocumentClassificationType;
  documentStatus: DocumentLifecycleStatus;
  documentNumber: string;
  clientName: string;
  clientCompanyName?: string;
  issueDate: string;
  dueOrExpiryDate?: string;
  totalCents: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type DashboardKpiMetrics = {
  totalInvoicedCents: number;
  outstandingReceivableCents: number;
  activeEstimatesCents: number;
  paidInvoicesCount: number;
  activeEstimatesCount: number;
  totalClientsCount: number;
};

export type ClientDirectoryRecord = {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  addressLines: string[];
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  totalBilledCents: number;
  documentCount: number;
  lastDocumentDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type VaultEncryptionPayload = {
  ciphertextBase64: string;
  initializationVectorBase64: string;
  saltBase64: string;
  algorithm: "AES-GCM-256";
  version: 1;
};

export type VaultExportBackupPackage = {
  formatVersion: 1;
  exportedAtIsoString: string;
  applicationIdentifier: "TrueSquare" | "BuildBill";
  documentsCollection: InvoiceEstimateDocument[];
  clientsCollection: ClientDirectoryRecord[];
};

export type DocumentFilterCriteria = {
  searchQuery?: string;
  classificationType?: DocumentClassificationType | "all";
  lifecycleStatus?: DocumentLifecycleStatus | "trash" | "all";
};

export type InvoiceEstimateDocument = {
  id: string;
  documentType: DocumentClassificationType;
  documentStatus: DocumentLifecycleStatus;
  documentNumber: string;
  issueDate: string; // ISO YYYY-MM-DD
  dueOrExpiryDate?: string;
  business: ContractorBusinessProfile;
  client: ClientCustomerRecord;
  currency: "USD";
  items: SupplyLineItem[];
  taxLabel: string;
  taxRateBasisPoints: number; // e.g. 825 for 8.25%
  notes: string;
  paymentTerms: string;
  targetTotalCents?: number; // for estimates
  generatedFromBudget: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  catalogueVersion: string;
};

export type CalculatedDocumentTotals = {
  subtotalCents: number;
  taxableSubtotalCents: number;
  taxCents: number;
  totalCents: number;
  remainingBudgetCents?: number;
};
