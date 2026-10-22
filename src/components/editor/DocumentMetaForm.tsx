import type { FC } from "react";
import type { DocumentClassificationType } from "@/domain/types";
import { FileText } from "lucide-react";

interface DocumentMetaFormProps {
  documentType: DocumentClassificationType;
  documentNumber: string;
  issueDate: string;
  dueOrExpiryDate?: string;
  paymentTerms: string;
  onUpdateDocumentType: (classificationType: DocumentClassificationType) => void;
  onUpdateDates: (issueDateIsoString: string, dueOrExpiryDateIsoString?: string) => void;
  onUpdatePaymentTerms: (paymentTermsDescription: string) => void;
}

export const DocumentMetaForm: FC<DocumentMetaFormProps> = ({
  documentType,
  documentNumber,
  issueDate,
  dueOrExpiryDate = "",
  paymentTerms,
  onUpdateDocumentType,
  onUpdateDates,
  onUpdatePaymentTerms,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold tracking-tight text-foreground">
            Document Settings &amp; Terms
          </h4>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border font-medium">
          {documentNumber}
        </span>
      </div>

      {/* Document Type Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => onUpdateDocumentType("estimate")}
          className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
            documentType === "estimate"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pro Forma Estimate
        </button>
        <button
          type="button"
          onClick={() => onUpdateDocumentType("invoice")}
          className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
            documentType === "invoice"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Commercial Tax Invoice
        </button>
      </div>

      {/* Date Fields & Terms */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Issue Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={issueDate}
              onChange={(changeEvent) =>
                onUpdateDates(changeEvent.target.value, dueOrExpiryDate)
              }
              className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            {documentType === "estimate" ? "Valid Until" : "Due Date"}
          </label>
          <div className="relative">
            <input
              type="date"
              value={dueOrExpiryDate}
              onChange={(changeEvent) =>
                onUpdateDates(issueDate, changeEvent.target.value)
              }
              className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Payment Terms
          </label>
          <input
            type="text"
            value={paymentTerms}
            onChange={(changeEvent) => onUpdatePaymentTerms(changeEvent.target.value)}
            placeholder="e.g. Net 30, Due on Receipt"
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
      </div>
    </div>
  );
};
