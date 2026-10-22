import { z } from "zod";

export const ContractorBusinessProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  addressLines: z.array(z.string()).default([]),
  city: z.string().default(""),
  region: z.string().default(""),
  postalCode: z.string().default(""),
  country: z.string().default("USA"),
  email: z.string().email("Invalid email").or(z.literal("")).default(""),
  phone: z.string().default(""),
  paymentInstructions: z.string().default(""),
  defaultTaxLabel: z.string().default("Sales Tax"),
  defaultTaxRateBasisPoints: z.number().int().min(0).max(5000).default(0),
});

export const ClientCustomerRecordSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  companyName: z.string().optional(),
  addressLines: z.array(z.string()).default([]),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().optional(),
});

export const SupplyLineItemSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  specification: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPriceCents: z.number().int().min(0, "Unit price must be non-negative"),
  taxable: z.boolean().default(true),
  sourcePriceCheckedAt: z.string().optional(),
  sourceRetailer: z.string().optional(),
  catalogueStatus: z.enum(["verified", "demo", "stale"]).default("verified"),
});

export const InvoiceEstimateDocumentSchema = z.object({
  id: z.string(),
  documentType: z.enum(["estimate", "invoice"]),
  documentStatus: z.enum(["draft", "saved", "issued", "paid", "overdue"]).default("draft"),
  documentNumber: z.string().min(1, "Document number is required"),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Issue date must be YYYY-MM-DD"),
  dueOrExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  business: ContractorBusinessProfileSchema,
  client: ClientCustomerRecordSchema,
  currency: z.literal("USD").default("USD"),
  items: z.array(SupplyLineItemSchema),
  taxLabel: z.string().default("Sales Tax"),
  taxRateBasisPoints: z.number().int().min(0).max(5000).default(0),
  notes: z.string().default(""),
  paymentTerms: z.string().default(""),
  targetTotalCents: z.number().int().positive().optional(),
  generatedFromBudget: z.boolean().default(false),
  isDemo: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  catalogueVersion: z.string().default("1.0.0"),
});

export type DocumentExportValidationResult = {
  isValid: boolean;
  blockingValidationErrors: string[];
  advisoryValidationWarnings: string[];
};

export function validateDocumentForExport(
  documentToValidate: z.infer<typeof InvoiceEstimateDocumentSchema>
): DocumentExportValidationResult {
  const blockingValidationErrors: string[] = [];
  const advisoryValidationWarnings: string[] = [];

  if (!documentToValidate.documentType) {
    blockingValidationErrors.push("Document type is required.");
  }
  if (!documentToValidate.business.businessName.trim()) {
    blockingValidationErrors.push("Contractor business name is required.");
  }
  if (!documentToValidate.client.name.trim()) {
    blockingValidationErrors.push("Client customer name is required.");
  }
  if (!documentToValidate.issueDate || !/^\d{4}-\d{2}-\d{2}$/.test(documentToValidate.issueDate)) {
    blockingValidationErrors.push("Valid document issue date is required.");
  }

  if (!documentToValidate.items || documentToValidate.items.length === 0) {
    blockingValidationErrors.push("At least one supply line item is required to generate a document.");
  } else {
    documentToValidate.items.forEach((supplyItem, lineIndex) => {
      const displayLineNumber = lineIndex + 1;
      if (!supplyItem.description.trim()) {
        blockingValidationErrors.push(`Line #${displayLineNumber}: Description is missing.`);
      }
      if (supplyItem.quantity <= 0) {
        blockingValidationErrors.push(`Line #${displayLineNumber}: Quantity must be greater than 0.`);
      }
      if (supplyItem.unitPriceCents < 0) {
        blockingValidationErrors.push(`Line #${displayLineNumber}: Unit price cannot be negative.`);
      }
      if (supplyItem.unitPriceCents === 0) {
        advisoryValidationWarnings.push(`Line #${displayLineNumber}: Unit price is $0.00.`);
      }
      if (supplyItem.catalogueStatus === "demo") {
        advisoryValidationWarnings.push(`Line #${displayLineNumber}: Contains unverified demo pricing.`);
      }
      if (supplyItem.catalogueStatus === "stale") {
        advisoryValidationWarnings.push(`Line #${displayLineNumber}: Price snapshot may be stale.`);
      }
    });
  }

  if (documentToValidate.taxRateBasisPoints < 0 || documentToValidate.taxRateBasisPoints > 5000) {
    blockingValidationErrors.push("Tax rate must be between 0% and 50%.");
  }

  if (!documentToValidate.client.email?.trim()) {
    advisoryValidationWarnings.push("Client customer email is missing.");
  }

  return {
    isValid: blockingValidationErrors.length === 0,
    blockingValidationErrors,
    advisoryValidationWarnings,
  };
}

export const DocumentSummaryRecordSchema = z.object({
  id: z.string(),
  documentType: z.enum(["estimate", "invoice"]),
  documentStatus: z.enum(["draft", "saved", "issued", "paid", "overdue"]),
  documentNumber: z.string(),
  clientName: z.string(),
  clientCompanyName: z.string().optional(),
  issueDate: z.string(),
  dueOrExpiryDate: z.string().optional(),
  totalCents: z.number().int().min(0),
  itemCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export const ClientDirectoryRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  companyName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  addressLines: z.array(z.string()).default([]),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  totalBilledCents: z.number().int().min(0),
  documentCount: z.number().int().min(0),
  lastDocumentDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DashboardKpiMetricsSchema = z.object({
  totalInvoicedCents: z.number().int().min(0),
  outstandingReceivableCents: z.number().int().min(0),
  activeEstimatesCents: z.number().int().min(0),
  paidInvoicesCount: z.number().int().min(0),
  activeEstimatesCount: z.number().int().min(0),
  totalClientsCount: z.number().int().min(0),
});

export const VaultEncryptionPayloadSchema = z.object({
  ciphertextBase64: z.string(),
  initializationVectorBase64: z.string(),
  saltBase64: z.string(),
  algorithm: z.literal("AES-GCM-256"),
  version: z.literal(1),
});

export const VaultExportBackupPackageSchema = z.object({
  formatVersion: z.literal(1),
  exportedAtIsoString: z.string(),
  applicationIdentifier: z.enum(["TrueSquare", "BuildBill"]),
  documentsCollection: z.array(InvoiceEstimateDocumentSchema),
  clientsCollection: z.array(ClientDirectoryRecordSchema),
});
