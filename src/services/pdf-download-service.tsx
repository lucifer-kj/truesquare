import React from "react";
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { InvoiceEstimateDocument } from "@/domain/types";
import { formatCents } from "@/domain/money";
import { calculateDocumentTotals } from "@/domain/calculations";
import { CAVEAT_FONT_DATA_URI } from "@/domain/signature-font-data";

// Register offline, self-contained cursive signature font
Font.register({
  family: "ContractorSignature",
  src: CAVEAT_FONT_DATA_URI,
});

// PDF Vector Document Stylesheet
const pdfStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#f59e0b",
    paddingBottom: 16,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 8.5,
    color: "#475569",
    lineHeight: 1.35,
  },
  documentMetaBlock: {
    alignItems: "flex-end",
  },
  documentTypeBadge: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#f59e0b",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  documentNumberText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 3,
  },
  metaDetailText: {
    fontSize: 8.5,
    color: "#64748b",
    lineHeight: 1.3,
  },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  partyColumn: {
    width: "48%",
  },
  partyHeading: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  partyText: {
    fontSize: 8.5,
    color: "#475569",
    lineHeight: 1.3,
  },
  table: {
    width: "100%",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colIndex: { width: "6%" },
  colDesc: { width: "50%" },
  colQty: { width: "12%", textAlign: "right" },
  colRate: { width: "16%", textAlign: "right" },
  colTotal: { width: "16%", textAlign: "right" },
  itemDescription: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#1e293b",
  },
  itemSpec: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 1,
  },
  itemText: {
    fontSize: 8.5,
    color: "#334155",
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  notesBox: {
    width: "55%",
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  notesHeading: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: "#475569",
    lineHeight: 1.35,
  },
  totalsBox: {
    width: "40%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 8.5,
    color: "#64748b",
  },
  totalsValue: {
    fontSize: 8.5,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: "#0f172a",
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#f59e0b",
  },
  footerSection: {
    marginTop: "auto",
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerText: {
    fontSize: 7.5,
    color: "#94a3b8",
    lineHeight: 1.3,
  },
  signatureLine: {
    width: 170,
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 4,
    alignItems: "center",
  },
  signatureHandwritten: {
    fontFamily: "ContractorSignature",
    fontSize: 22,
    color: "#0f2744",
    textAlign: "center",
    marginBottom: 2,
  },
  signatureSignatory: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 1,
    textAlign: "center",
  },
  signatureText: {
    fontSize: 7,
    color: "#64748b",
    textAlign: "center",
  },
});

interface InvoicePdfDocumentProps {
  invoiceDocument: InvoiceEstimateDocument;
}

export const InvoicePdfDocument: React.FC<InvoicePdfDocumentProps> = ({
  invoiceDocument,
}) => {
  const totals = calculateDocumentTotals({
    supplyItems: invoiceDocument.items,
    taxRateBasisPoints: invoiceDocument.taxRateBasisPoints || 0,
  });

  const isInvoice = invoiceDocument.documentType === "invoice";

  return (
    <Document title={`${invoiceDocument.documentNumber} - TrueSquare`}>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Header Block */}
        <View style={pdfStyles.headerRow}>
          <View>
            <Text style={pdfStyles.brandTitle}>
              {invoiceDocument.business.businessName || "TrueSquare Contractor"}
            </Text>
            {invoiceDocument.business.addressLines.map((line, index) => (
              <Text key={index} style={pdfStyles.companyDetails}>
                {line}
              </Text>
            ))}
            <Text style={pdfStyles.companyDetails}>
              {[
                invoiceDocument.business.city,
                invoiceDocument.business.region,
                invoiceDocument.business.postalCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
            {invoiceDocument.business.phone && (
              <Text style={pdfStyles.companyDetails}>Phone: {invoiceDocument.business.phone}</Text>
            )}
            {invoiceDocument.business.email && (
              <Text style={pdfStyles.companyDetails}>Email: {invoiceDocument.business.email}</Text>
            )}
          </View>

          <View style={pdfStyles.documentMetaBlock}>
            <Text style={pdfStyles.documentTypeBadge}>
              {isInvoice ? "Tax Invoice" : "Contractor Estimate"}
            </Text>
            <Text style={pdfStyles.documentNumberText}>
              #{invoiceDocument.documentNumber}
            </Text>
            <Text style={pdfStyles.metaDetailText}>
              Issue Date: {invoiceDocument.issueDate}
            </Text>
            {invoiceDocument.dueOrExpiryDate && (
              <Text style={pdfStyles.metaDetailText}>
                {isInvoice ? "Payment Due:" : "Valid Until:"} {invoiceDocument.dueOrExpiryDate}
              </Text>
            )}
            {invoiceDocument.paymentTerms && (
              <Text style={pdfStyles.metaDetailText}>
                Terms: {invoiceDocument.paymentTerms}
              </Text>
            )}
          </View>
        </View>

        {/* Client & Remittance Info */}
        <View style={pdfStyles.partiesRow}>
          <View style={pdfStyles.partyColumn}>
            <Text style={pdfStyles.partyHeading}>Prepared For (Client)</Text>
            <Text style={pdfStyles.partyName}>
              {invoiceDocument.client.companyName || invoiceDocument.client.name || "Client Name"}
            </Text>
            {invoiceDocument.client.companyName && invoiceDocument.client.name && (
              <Text style={pdfStyles.partyText}>Attn: {invoiceDocument.client.name}</Text>
            )}
            {invoiceDocument.client.addressLines.map((line, index) => (
              <Text key={index} style={pdfStyles.partyText}>
                {line}
              </Text>
            ))}
            <Text style={pdfStyles.partyText}>
              {[
                invoiceDocument.client.city,
                invoiceDocument.client.region,
                invoiceDocument.client.postalCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
            {invoiceDocument.client.phone && (
              <Text style={pdfStyles.partyText}>Tel: {invoiceDocument.client.phone}</Text>
            )}
          </View>

          <View style={pdfStyles.partyColumn}>
            <Text style={pdfStyles.partyHeading}>Remittance & Payment Instructions</Text>
            <Text style={pdfStyles.partyText}>
              {invoiceDocument.business.paymentInstructions ||
                "Payment accepted via ACH, Wire, Check, or Credit Card. Please remit by the due date indicated."}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colIndex]}>#</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDesc]}>Description & Scope</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colQty]}>Qty / Unit</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colRate]}>Rate</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colTotal]}>Amount</Text>
          </View>

          {invoiceDocument.items.map((item, index) => {
            const lineTotal = Math.round(item.quantity * item.unitPriceCents);
            return (
              <View
                key={item.id || index}
                style={[
                  pdfStyles.tableRow,
                  index % 2 === 1 ? pdfStyles.tableRowAlt : {},
                ]}
              >
                <Text style={[pdfStyles.itemText, pdfStyles.colIndex]}>{index + 1}</Text>
                <View style={pdfStyles.colDesc}>
                  <Text style={pdfStyles.itemDescription}>{item.description}</Text>
                  {item.specification ? (
                    <Text style={pdfStyles.itemSpec}>{item.specification}</Text>
                  ) : null}
                </View>
                <Text style={[pdfStyles.itemText, pdfStyles.colQty]}>
                  {item.quantity} {item.unit || "ea"}
                </Text>
                <Text style={[pdfStyles.itemText, pdfStyles.colRate]}>
                  {formatCents(item.unitPriceCents)}
                </Text>
                <Text style={[pdfStyles.itemText, pdfStyles.colTotal]}>
                  {formatCents(lineTotal)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals & Notes Section */}
        <View style={pdfStyles.totalsSection}>
          <View style={pdfStyles.notesBox}>
            <Text style={pdfStyles.notesHeading}>Project Notes & Scope Terms</Text>
            <Text style={pdfStyles.notesText}>
              {invoiceDocument.notes ||
                "All work completed according to municipal building codes and trade standards. Thank you for your business!"}
            </Text>
          </View>

          <View style={pdfStyles.totalsBox}>
            <View style={pdfStyles.totalsRow}>
              <Text style={pdfStyles.totalsLabel}>Subtotal:</Text>
              <Text style={pdfStyles.totalsValue}>{formatCents(totals.subtotalCents)}</Text>
            </View>

            {totals.taxCents > 0 && (
              <View style={pdfStyles.totalsRow}>
                <Text style={pdfStyles.totalsLabel}>
                  {invoiceDocument.taxLabel || "Sales Tax"} ({(invoiceDocument.taxRateBasisPoints / 100).toFixed(2)}%):
                </Text>
                <Text style={pdfStyles.totalsValue}>{formatCents(totals.taxCents)}</Text>
              </View>
            )}

            <View style={pdfStyles.grandTotalRow}>
              <Text style={pdfStyles.grandTotalLabel}>
                {isInvoice ? "Total Due:" : "Estimated Total:"}
              </Text>
              <Text style={pdfStyles.grandTotalValue}>{formatCents(totals.totalCents)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Pinned Footer with Signature Lines */}
        <View style={pdfStyles.footerSection}>
          <View>
            <Text style={pdfStyles.footerText}>
              Generated via TrueSquare Construction Document Studio • E2EE Encrypted Vault
            </Text>
            <Text style={pdfStyles.footerText}>
              Document ID: {invoiceDocument.id}
            </Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text style={pdfStyles.signatureHandwritten}>
              {invoiceDocument.business.businessName || "Authorized Signatory"}
            </Text>
            <View style={pdfStyles.signatureLine}>
              <Text style={pdfStyles.signatureSignatory}>
                {invoiceDocument.business.businessName || "Authorized Representative"}
              </Text>
              <Text style={pdfStyles.signatureText}>Authorized Contractor Signature</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generates an authentic binary PDF Blob from a domain invoice/estimate document.
 */
export async function generateInvoicePdfBlob(
  invoiceDocument: InvoiceEstimateDocument
): Promise<Blob> {
  const documentElement = React.createElement(InvoicePdfDocument, {
    invoiceDocument,
  }) as unknown as Parameters<typeof pdf>[0];
  return await pdf(documentElement).toBlob();
}

/**
 * Compiles and immediately downloads an authentic vector PDF binary directly to the browser.
 * Bypasses the OS print dialog completely — the file packages and lands straight in the user's downloads folder.
 */
export async function downloadInvoicePdfDirectly(
  invoiceDocument: InvoiceEstimateDocument
): Promise<void> {
  const sanitizedDocNumber = (invoiceDocument.documentNumber || "INV-0000").replace(/[^a-zA-Z0-9_-]/g, "_");
  const sanitizedClientName = (
    invoiceDocument.client.companyName ||
    invoiceDocument.client.name ||
    "Contractor_Invoice"
  ).replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanDocumentFileName = `${sanitizedDocNumber}_${sanitizedClientName}`;

  // 1. Generate real vector PDF binary blob
  const pdfBlob = await generateInvoicePdfBlob(invoiceDocument);

  // 2. Programmatically dispatch automatic browser file download
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = downloadUrl;
  downloadAnchor.download = `${cleanDocumentFileName}.pdf`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);

  // 3. Clean up blob URL memory
  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 2000);
}
