import { useEffect, useRef, useState, type FC } from "react";
import { Printer, ZoomIn, FileText } from "lucide-react";
import type { InvoiceEstimateDocument } from "@/domain/types";
import { mapDocumentToInvoiceTemplatePayload } from "@/domain/invoice-template-mapper";
import { formatCents } from "@/domain/money";

export interface DocumentCanvasProps {
  invoiceDocument: InvoiceEstimateDocument;
  documentTotalCents: number;
  disableScroll?: boolean;
}

export const DocumentCanvas: FC<DocumentCanvasProps> = ({
  invoiceDocument,
  documentTotalCents,
  disableScroll = false,
}) => {
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [autoFitScaleFactor, setAutoFitScaleFactor] = useState<number>(0.85);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);

  // Standardized print filename: ${documentNumber}_${clientName}.pdf
  const cleanDocumentFileName = `${invoiceDocument.documentNumber}_${(
    invoiceDocument.client.companyName ||
    invoiceDocument.client.name ||
    "Contractor_Document"
  ).replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  // Keep parent window document.title synchronized for Chrome Print dialog
  useEffect(() => {
    document.title = `${cleanDocumentFileName}.pdf`;
    return () => {
      document.title = "BuildBill — Contractor Document Studio";
    };
  }, [cleanDocumentFileName]);

  // Responsive Fit-to-Width ResizeObserver
  useEffect(() => {
    const viewportElement = canvasViewportRef.current;
    if (!viewportElement) return;

    const updateFitScale = () => {
      const containerWidth = viewportElement.clientWidth;
      const containerHeight = viewportElement.clientHeight;
      if (containerWidth <= 0) return;

      if (disableScroll && containerHeight > 0) {
        // Fit both width AND height so the complete page fits with zero scrolling
        const scaleX = (containerWidth - 16) / 816;
        const scaleY = (containerHeight - 16) / 1056;
        const calculatedScale = Math.max(0.25, Math.min(1.02, Math.min(scaleX, scaleY)));
        setAutoFitScaleFactor(calculatedScale);
      } else {
        // Standard width-based fit
        const calculatedScale = Math.max(0.35, Math.min(1.02, (containerWidth - 36) / 816));
        setAutoFitScaleFactor(calculatedScale);
      }
    };

    updateFitScale();
    const resizeObserver = new ResizeObserver(() => {
      updateFitScale();
    });

    resizeObserver.observe(viewportElement);
    return () => resizeObserver.disconnect();
  }, [disableScroll]);

  // PostMessage document payload sync
  useEffect(() => {
    const targetIframe = iframeRef.current;
    if (!targetIframe || !isIframeLoaded) return;

    const templatePayload = mapDocumentToInvoiceTemplatePayload(invoiceDocument);
    targetIframe.contentWindow?.postMessage(
      {
        type: "SYNC_INVOICE_DATA",
        payload: templatePayload,
      },
      "*"
    );
  }, [invoiceDocument, isIframeLoaded]);

  const handleIframeLoaded = () => {
    setIsIframeLoaded(true);
    const targetIframe = iframeRef.current;
    if (targetIframe) {
      const templatePayload = mapDocumentToInvoiceTemplatePayload(invoiceDocument);
      targetIframe.contentWindow?.postMessage(
        {
          type: "SYNC_INVOICE_DATA",
          payload: templatePayload,
        },
        "*"
      );
    }
  };

  const handleTriggerPrint = () => {
    const targetIframe = iframeRef.current;
    if (targetIframe?.contentWindow) {
      document.title = `${cleanDocumentFileName}.pdf`;
      targetIframe.contentWindow.document.title = `${cleanDocumentFileName}.pdf`;
      targetIframe.contentWindow.focus();
      targetIframe.contentWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#eef1f5] dark:bg-slate-950 rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Studio Canvas Control Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card/90 backdrop-blur-md border-b border-border z-10">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight text-foreground truncate">
            {invoiceDocument.documentType === "estimate" ? "Estimate Canvas" : "Invoice Canvas"}
          </span>
          <span className="text-xs font-mono font-bold text-primary hidden md:inline">
            · {formatCents(documentTotalCents)}
          </span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            · Letter (8.5&quot; × 11&quot;)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom / Scale factor pill */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-[11px] font-mono select-none">
            <ZoomIn className="w-3 h-3 text-muted-foreground" />
            <span>{Math.round(autoFitScaleFactor * 100)}%</span>
          </div>

          {/* Secondary Quick Print Button */}
          <button
            type="button"
            onClick={handleTriggerPrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-foreground border border-border/80 rounded-lg font-medium transition-all shadow-2xs hover:border-border"
            title="Print or Export Vector PDF (Alt+P)"
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Print Preview</span>
          </button>
        </div>
      </div>

      {/* Desk Surface Viewport with Centered Paper Elevation */}
      <div
        ref={canvasViewportRef}
        className={`flex-1 p-2 sm:p-5 flex justify-center ${
          disableScroll ? "overflow-hidden items-center" : "overflow-y-auto overflow-x-hidden items-start"
        }`}
        style={{
          minHeight: "0px",
          background: "radial-gradient(#d1d5db 0.75px, transparent 0.75px)",
          backgroundSize: "16px 16px",
          backgroundColor: "#eef1f5",
        }}
      >
        {/* Outer Sized Wrapper so transform scale accurately reserves DOM layout space */}
        <div
          className="relative transition-transform duration-100 ease-out flex-shrink-0 rounded-[2px]"
          style={{
            width: `${Math.round(816 * autoFitScaleFactor)}px`,
            height: `${Math.round(1056 * autoFitScaleFactor)}px`,
            boxShadow:
              "0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(15, 39, 68, 0.08), 0 16px 36px rgba(15, 39, 68, 0.04)",
          }}
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
              ref={iframeRef}
              src="/invoice-template-preview.html"
              title="Invoice Document Preview Canvas"
              onLoad={handleIframeLoaded}
              scrolling="no"
              className="w-full h-full border-0 rounded-[2px] bg-white block pointer-events-auto"
              style={{
                overflow: "hidden",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
