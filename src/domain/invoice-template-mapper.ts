import type {
  InvoiceEstimateDocument,
  SupplyLineItem,
} from "./types";

export type InvoiceTemplateSeller = {
  name: string;
  lines: string[];
  phone: string;
  fax: string;
  web: string;
  email: string;
  tax_id: string;
};

export type InvoiceTemplateParty = {
  name: string;
  company: string;
  lines: string[];
  phone: string;
  email: string;
  contact?: string;
};

export type InvoiceTemplateShipping = {
  freight_type: string;
  est_ship_date: string;
  terms: string;
  est_weight_lb: number | null;
  charge_cents: number;
};

export type InvoiceTemplateTax = {
  rate: number;
  shipping_taxable: boolean;
  discount_reduces_base: boolean;
  exempt_cert: string;
};

export type InvoiceTemplateLineItem = {
  sku: string;
  name: string;
  spec: string;
  uom: string;
  qty: number;
  unit_price_cents: number;
  taxable: boolean;
  unit_weight_lb: number;
};

export type InvoiceTemplateTerms = {
  pro_forma: string[];
  invoice: string[];
};

export type InvoiceTemplateBank = {
  name: string;
  beneficiary: string;
  account_last4: string;
};

export type InvoiceTemplateSignature = {
  show: boolean;
  name: string;
  title: string;
  image: string;
};

export type InvoiceTemplatePayload = {
  document_type: "pro_forma" | "invoice";
  invoice_no: string;
  issue_date: string;
  valid_until: string;
  due_date: string;
  customer_id: string;
  po_number: string;
  project: string;
  sales_rep: string;
  payment_terms: string;
  currency: "USD";
  seller: InvoiceTemplateSeller;
  bill_to: InvoiceTemplateParty;
  ship_to: InvoiceTemplateParty;
  shipping: InvoiceTemplateShipping;
  tax: InvoiceTemplateTax;
  discount_cents: number;
  items: InvoiceTemplateLineItem[];
  terms: InvoiceTemplateTerms;
  bank: InvoiceTemplateBank;
  signature: InvoiceTemplateSignature;
  certification: string;
  notes: string;
};

const CONCISE_PRO_FORMA_TERMS: string[] = [
  "Quotation only; prices firm through validity date. Payment terms: {payment_terms}.",
  "Materials remain property of seller until paid in full.",
  "Returns accepted within 15 days in original packaging; special orders non-returnable.",
];

const CONCISE_TAX_INVOICE_TERMS: string[] = [
  "Payment due {payment_terms} from invoice date. Overdue accounts subject to 1.5% monthly finance charge.",
  "Materials remain property of seller until paid in full.",
  "Returns accepted within 15 days in original packaging; restocking fees apply.",
];

function sanitizeSpecification(specText?: string): string {
  if (!specText) return "";
  // Remove redundant "Trade: ..." or "SHEET — Trade: ..." suffixes that clutter line items
  const cleaned = specText
    .replace(/^(SHEET|SQ FT|PIECE|EACH|BAG|BOX|DAY|LF|LINEAR FOOT)\s*—\s*/i, "")
    .replace(/\s*Trade:\s*[A-Za-z]+\s*/i, "")
    .replace(/^—\s*/, "")
    .trim();
  return cleaned;
}

function transformSupplyLineItemToTemplateItem(
  supplyLineItem: SupplyLineItem
): InvoiceTemplateLineItem {
  return {
    sku: supplyLineItem.sku || "—",
    name: supplyLineItem.description,
    spec: sanitizeSpecification(supplyLineItem.specification),
    uom: supplyLineItem.unit || "ea",
    qty: supplyLineItem.quantity,
    unit_price_cents: supplyLineItem.unitPriceCents,
    taxable: supplyLineItem.taxable,
    unit_weight_lb: 0,
  };
}

export function mapDocumentToInvoiceTemplatePayload(
  invoiceDocument: InvoiceEstimateDocument
): InvoiceTemplatePayload {
  const isEstimateDocument = invoiceDocument.documentType === "estimate";

  const contractorAddressLines: string[] = [
    ...invoiceDocument.business.addressLines,
    [
      invoiceDocument.business.city,
      invoiceDocument.business.region,
      invoiceDocument.business.postalCode,
    ]
      .filter(Boolean)
      .join(", "),
    invoiceDocument.business.country,
  ].filter(Boolean);

  const clientAddressLines: string[] = [
    ...invoiceDocument.client.addressLines,
    [
      invoiceDocument.client.city,
      invoiceDocument.client.region,
      invoiceDocument.client.postalCode,
    ]
      .filter(Boolean)
      .join(", "),
    invoiceDocument.client.country || "",
  ].filter(Boolean);

  const templateLineItems: InvoiceTemplateLineItem[] = invoiceDocument.items.map(
    transformSupplyLineItemToTemplateItem
  );

  // Clean formatted Customer ID (e.g. CUST-882 instead of client-1792485362133)
  const rawClientId = invoiceDocument.client.id || "CUST-101";
  const cleanCustomerId = rawClientId.startsWith("client-")
    ? `CUST-${rawClientId.slice(-4)}`
    : rawClientId;

  return {
    document_type: isEstimateDocument ? "pro_forma" : "invoice",
    invoice_no: invoiceDocument.documentNumber,
    issue_date: invoiceDocument.issueDate,
    valid_until: isEstimateDocument
      ? invoiceDocument.dueOrExpiryDate || ""
      : "",
    due_date: !isEstimateDocument
      ? invoiceDocument.dueOrExpiryDate || ""
      : "",
    customer_id: cleanCustomerId,
    po_number: "",
    project: invoiceDocument.client.companyName || "",
    sales_rep: invoiceDocument.business.businessName,
    payment_terms: invoiceDocument.paymentTerms || "Net 30 Days",
    currency: "USD",
    seller: {
      name: invoiceDocument.business.businessName,
      lines: contractorAddressLines,
      phone: invoiceDocument.business.phone,
      fax: "",
      web: "",
      email: invoiceDocument.business.email,
      tax_id: "",
    },
    bill_to: {
      name: invoiceDocument.client.name,
      company: invoiceDocument.client.companyName || "",
      lines: clientAddressLines,
      phone: invoiceDocument.client.phone || "",
      email: invoiceDocument.client.email || "",
      contact: invoiceDocument.client.name,
    },
    ship_to: {
      name: invoiceDocument.client.name,
      company: invoiceDocument.client.companyName || "",
      lines: clientAddressLines,
      phone: invoiceDocument.client.phone || "",
      email: invoiceDocument.client.email || "",
      contact: invoiceDocument.client.name,
    },
    shipping: {
      freight_type: "Standard Freight / Jobsite",
      est_ship_date: invoiceDocument.issueDate,
      terms: "FOB Jobsite",
      est_weight_lb: null,
      charge_cents: 0,
    },
    tax: {
      rate: invoiceDocument.taxRateBasisPoints / 10000,
      shipping_taxable: true,
      discount_reduces_base: true,
      exempt_cert: "",
    },
    discount_cents: 0,
    items: templateLineItems,
    terms: {
      pro_forma: CONCISE_PRO_FORMA_TERMS,
      invoice: CONCISE_TAX_INVOICE_TERMS,
    },
    bank: {
      name: "Commercial Depository Bank",
      beneficiary: invoiceDocument.business.businessName,
      account_last4: "9901",
    },
    signature: {
      show: true,
      name: invoiceDocument.business.businessName,
      title: "Authorized Representative",
      image: "",
    },
    certification:
      "I certify that the information in this document is true and correct.",
    notes: invoiceDocument.notes || "",
  };
}
