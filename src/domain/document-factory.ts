import type {
  ContractorBusinessProfile,
  ClientCustomerRecord,
  DocumentClassificationType,
  InvoiceEstimateDocument,
} from "./types";
import { generateDocumentNumber } from "./invoice-number";

export function createDefaultContractorBusinessProfile(): ContractorBusinessProfile {
  return {
    businessName: "Acme Building & Supplies LLC",
    addressLines: ["100 Contractor Way", "Suite 200"],
    city: "Austin",
    region: "TX",
    postalCode: "78701",
    country: "USA",
    email: "billing@acmebuilding.com",
    phone: "(512) 555-0199",
    paymentInstructions: "Payment due within 30 days. Remit payment to First National Bank, Routing: 111000025, Acct: 987654321.",
    defaultTaxLabel: "Sales Tax",
    defaultTaxRateBasisPoints: 825, // 8.25% default
  };
}

export function createDefaultClientCustomerRecord(): ClientCustomerRecord {
  const shortNumericSuffix = Math.floor(100 + Math.random() * 900);
  return {
    id: `CUST-${shortNumericSuffix}`,
    name: "",
    companyName: "",
    addressLines: [],
    city: "",
    region: "",
    postalCode: "",
    country: "USA",
    email: "",
    phone: "",
  };
}

export function getTodayIsoDate(): string {
  const currentDate = new Date();
  const yearString = currentDate.getFullYear();
  const monthString = String(currentDate.getMonth() + 1).padStart(2, "0");
  const dayString = String(currentDate.getDate()).padStart(2, "0");
  return `${yearString}-${monthString}-${dayString}`;
}

export function createNewDocumentDraft(draftCreationParams: {
  documentType: DocumentClassificationType;
  contractorProfile: ContractorBusinessProfile;
  existingDocumentNumbers?: string[];
  initialClientRecord?: ClientCustomerRecord;
}): InvoiceEstimateDocument {
  const {
    documentType,
    contractorProfile,
    existingDocumentNumbers = [],
    initialClientRecord,
  } = draftCreationParams;

  const currentTimestampIso = new Date().toISOString();
  const todayDateString = getTodayIsoDate();

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentType,
    documentStatus: "draft",
    documentNumber: generateDocumentNumber(documentType, existingDocumentNumbers),
    issueDate: todayDateString,
    dueOrExpiryDate: undefined,
    business: { ...contractorProfile },
    client: initialClientRecord ? { ...initialClientRecord } : createDefaultClientCustomerRecord(),
    currency: "USD",
    items: [],
    taxLabel: contractorProfile.defaultTaxLabel || "Sales Tax",
    taxRateBasisPoints: contractorProfile.defaultTaxRateBasisPoints || 0,
    notes: "All supplies are subject to standard contractor warranty and verified supplier terms.",
    paymentTerms: documentType === "invoice" ? "Net 30 Days" : "Estimate valid for 30 days from issue date.",
    targetTotalCents: undefined,
    generatedFromBudget: false,
    isDemo: false,
    createdAt: currentTimestampIso,
    updatedAt: currentTimestampIso,
    catalogueVersion: "1.0.0",
  };
}
