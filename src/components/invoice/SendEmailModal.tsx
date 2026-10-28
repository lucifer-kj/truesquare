import { useState, type FC, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Send,
  X,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import type { InvoiceEstimateDocument } from "@/domain/types";
import { formatCents } from "@/domain/money";
import { calculateDocumentTotals } from "@/domain/calculations";
import { generateInvoicePdfBlob } from "@/services/pdf-download-service";
import { useAccessibleMotion } from "@/design-system";

export interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceDocument: InvoiceEstimateDocument;
}

export const SendEmailModal: FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  invoiceDocument,
}) => {
  const activeSpringTransition = useAccessibleMotion("expressive");

  const isInvoice = invoiceDocument.documentType === "invoice";
  const totals = calculateDocumentTotals({
    supplyItems: invoiceDocument.items,
    taxRateBasisPoints: invoiceDocument.taxRateBasisPoints || 0,
  });

  const clientName = invoiceDocument.client.name || "Client";
  const contractorName = invoiceDocument.business.businessName || "Contractor Services";
  const docTypeLabel = isInvoice ? "Invoice" : "Estimate";
  const docNumber = invoiceDocument.documentNumber || (isInvoice ? "INV-0001" : "EST-0001");
  const formattedTotal = formatCents(totals.totalCents);

  // Pre-typed subject line
  const defaultSubject = `${docTypeLabel} #${docNumber} from ${contractorName}`;

  // Pre-typed email message body
  const defaultBody = `Hello ${clientName},

Please find attached ${docTypeLabel.toLowerCase()} #${docNumber} for recent project services and building supplies from ${contractorName}.

Summary:
- Document: ${docTypeLabel} #${docNumber}
- Amount Due: ${formattedTotal}
- Issue Date: ${invoiceDocument.issueDate || new Date().toISOString().split("T")[0]}
${invoiceDocument.paymentTerms ? `- Terms: ${invoiceDocument.paymentTerms}\n` : ""}
If you have any questions or require revisions, please do not hesitate to contact us.

Thank you for your business!

Best regards,
${contractorName}
${invoiceDocument.business.phone ? `Phone: ${invoiceDocument.business.phone}\n` : ""}${invoiceDocument.business.email ? `Email: ${invoiceDocument.business.email}` : ""}`;

  const [recipientEmail, setRecipientEmail] = useState<string>(
    invoiceDocument.client.email || ""
  );
  const [emailSubject, setEmailSubject] = useState<string>(defaultSubject);
  const [emailBody, setEmailBody] = useState<string>(defaultBody);
  const [includePdfAttachment, setIncludePdfAttachment] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [copiedMailto, setCopiedMailto] = useState<boolean>(false);

  // Clean filename for PDF attachment
  const cleanFileName = `${docNumber}_${(
    invoiceDocument.client.companyName ||
    invoiceDocument.client.name ||
    "Contractor_Document"
  ).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

  const handleSendEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!recipientEmail.trim()) {
      setStatusMessage("Please specify a recipient email address.");
      setSendStatus("error");
      return;
    }

    setIsSending(true);
    setSendStatus("idle");
    setStatusMessage("");

    try {
      let pdfBase64: string | undefined = undefined;

      if (includePdfAttachment) {
        // Compile binary PDF Blob directly in the browser
        const pdfBlob = await generateInvoicePdfBlob(invoiceDocument);
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binaryString = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binaryString += String.fromCharCode(bytes[i]);
        }
        pdfBase64 = btoa(binaryString);
      }

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          recipientName: clientName,
          senderEmail: invoiceDocument.business.email || undefined,
          senderName: contractorName,
          subject: emailSubject,
          messageBody: emailBody,
          documentNumber: docNumber,
          documentType: invoiceDocument.documentType,
          pdfBase64,
          pdfFileName: cleanFileName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSendStatus("success");
        if (result.provider === "pending_configuration") {
          setStatusMessage(
            "Email dispatched! (Endpoint ready; configure your mail API keys in environment variables for live delivery)."
          );
        } else {
          setStatusMessage("Email sent successfully with PDF attachment!");
        }
      } else {
        setSendStatus("error");
        setStatusMessage(result.error || "Failed to dispatch email. Please check your network.");
      }
    } catch (networkError) {
      console.warn("Email API error:", networkError);
      setSendStatus("error");
      setStatusMessage("Could not connect to the email server. You can also open your mail client below.");
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenSystemMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailBody);
    setCopiedMailto(true);
    setTimeout(() => setCopiedMailto(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={activeSpringTransition}
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Send {docTypeLabel} via Email</h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {docNumber} • {formattedTotal}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSendEmail} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status Banners */}
          <AnimatePresence>
            {sendStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs flex items-start space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{statusMessage}</span>
              </motion.div>
            )}

            {sendStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs flex items-start space-x-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{statusMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recipient Email Field */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Recipient Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. client@example.com"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Message Body Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">
                Message Body
              </label>
              <button
                type="button"
                onClick={handleCopyBody}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center space-x-1"
              >
                {copiedMailto ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Attachment Badge */}
          <div className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded-xl">
            <div className="flex items-center space-x-2">
              <Paperclip className="w-4 h-4 text-primary shrink-0" />
              <div className="text-xs font-medium text-foreground truncate max-w-[280px]">
                {cleanFileName}
              </div>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePdfAttachment}
                onChange={(e) => setIncludePdfAttachment(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">Attach PDF</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleOpenSystemMailClient}
              className="text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline transition-colors"
            >
              Open in Mail App (mailto)
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isSending}
                className="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
