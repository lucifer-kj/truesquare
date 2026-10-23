import { useEffect, useRef, useState, type FC } from "react";
import { Printer } from "lucide-react";
import type { InvoiceEstimateDocument } from "@/domain/types";
import { mapDocumentToInvoiceTemplatePayload } from "@/domain/invoice-template-mapper";
import { formatCents } from "@/domain/money";

interface InvoicePreviewFrameProps {
  invoiceDocument: InvoiceEstimateDocument;
  documentTotalCents: number;
  hideToolbar?: boolean;
}

export const InvoicePreviewFrame: FC<InvoicePreviewFrameProps> = ({
  invoiceDocument,
  documentTotalCents,
  hideToolbar = false,
}) => {
  const containerViewportReference = useRef<HTMLDivElement | null>(null);
  const iframeElementReference = useRef<HTMLIFrameElement | null>(null);
  const [autoFitScaleFactor, setAutoFitScaleFactor] = useState<number>(0.85);
  const [iframeLoadedState, setIframeLoadedState] = useState<boolean>(false);

  // Generate standardized document filename for PDF saves
  const cleanDocumentFileName = `${invoiceDocument.documentNumber}_${(
    invoiceDocument.client.companyName ||
    invoiceDocument.client.name ||
    "Contractor_Invoice"
  ).replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  // Keep parent window title synchronized so Chrome Save As PDF defaults to this filename
  useEffect(() => {
    document.title = `${cleanDocumentFileName}.pdf`;
    return () => {
      document.title = "BuildBill — Construction Document Studio";
    };
  }, [cleanDocumentFileName]);

  // Responsive Fit-to-Width ResizeObserver for effortless viewing on laptops and phones
  useEffect(() => {
    const viewportElement = containerViewportReference.current;
    if (!viewportElement) return;

    const updateFitScale = () => {
      const containerWidth = viewportElement.clientWidth;
      if (containerWidth <= 0) return;

      // Available space with 32px padding, letter page width is 816px (8.5in * 96dpi)
      const calculatedScale = Math.max(0.35, Math.min(1.05, (containerWidth - 32) / 816));
      setAutoFitScaleFactor(calculatedScale);
    };

    updateFitScale();
    const resizeObserver = new ResizeObserver(() => {
      updateFitScale();
    });

    resizeObserver.observe(viewportElement);
    return () => resizeObserver.disconnect();
  }, []);

  // Sync invoice document payload with iframe whenever document state changes
  useEffect(() => {
    const targetIframe = iframeElementReference.current;
    if (!targetIframe || !iframeLoadedState) {
      return;
    }

    const templatePayload = mapDocumentToInvoiceTemplatePayload(invoiceDocument);
    const targetOrigin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "*";
    targetIframe.contentWindow?.postMessage(
      {
        type: "SYNC_INVOICE_DATA",
        payload: templatePayload,
      },
      targetOrigin
    );
  }, [invoiceDocument, iframeLoadedState]);

  const handleIframeLoadCompletion = () => {
    setIframeLoadedState(true);
    const targetIframe = iframeElementReference.current;
    if (targetIframe) {
      const templatePayload = mapDocumentToInvoiceTemplatePayload(invoiceDocument);
      const targetOrigin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "*";
      targetIframe.contentWindow?.postMessage(
        {
          type: "SYNC_INVOICE_DATA",
          payload: templatePayload,
        },
        targetOrigin
      );
    }
  };

  const handleTriggerPrintDialog = () => {
    const targetIframe = iframeElementReference.current;
    if (targetIframe?.contentWindow) {
      document.title = `${cleanDocumentFileName}.pdf`;
      targetIframe.contentWindow.document.title = `${cleanDocumentFileName}.pdf`;
      targetIframe.contentWindow.focus();
      targetIframe.contentWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700/80 overflow-hidden shadow-2xl">
      {/* Streamlined Minimalist Toolbar: Subtle scale pill + Primary Export PDF */}
      {!hideToolbar && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950 border-b border-slate-800 text-slate-200">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="font-bold text-xs tracking-wider uppercase text-sky-400 truncate">
              {invoiceDocument.documentType === "estimate"
                ? "Pro Forma Preview"
                : "Tax Invoice Preview"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
              {invoiceDocument.documentNumber}
            </span>
            <span className="text-xs font-semibold text-emerald-400 hidden sm:inline">
              {formatCents(documentTotalCents)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Subtle scale indicator */}
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800/80 text-slate-400 select-none">
              {Math.round(autoFitScaleFactor * 100)}%
            </span>

            {/* Primary Export PDF Button */}
            <button
              type="button"
              onClick={handleTriggerPrintDialog}
              className="flex items-center space-x-1.5 px-3 py-1 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded-md font-bold transition-all shadow-md shadow-sky-950/50"
              title="Export 1-Page PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Frame Viewport Container: Handles unified smooth two-finger and touch scrolling */}
      <div
        ref={containerViewportReference}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex justify-center items-start bg-slate-950/80"
      >
        {/* Outer Sized Wrapper */}
        <div
          style={{
            width: `${Math.round(816 * autoFitScaleFactor)}px`,
            height: `${Math.round(1056 * autoFitScaleFactor)}px`,
            position: "relative",
            flexShrink: 0,
          }}
          className="shadow-2xl rounded-sm transition-all duration-75 ease-out"
        >
          {/* Inner Scaled Container */}
          <div
            style={{
              width: "816px",
              height: "1056px",
              transform: `scale(${autoFitScaleFactor})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <iframe
              ref={iframeElementReference}
              src="/invoice-template-preview.html"
              title="Invoice Document Preview Frame"
              scrolling="no"
              sandbox="allow-scripts allow-modals allow-same-origin"
              className="w-full h-full border-0 bg-white overflow-hidden pointer-events-auto"
              onLoad={handleIframeLoadCompletion}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
