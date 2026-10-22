import { type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Printer,
  Copy,
  Trash2,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
  Plus,
  Sparkles,
  FileCheck2,
} from "lucide-react";
import { formatCents } from "@/domain/money";
import type {
  DocumentSummaryRecord,
  DocumentFilterCriteria,
  DocumentLifecycleStatus,
} from "@/domain/types";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { useAccessibleMotion } from "@/design-system";
import { DocumentRowSkeleton, DocumentCardSkeleton } from "@/components/primitives/SkeletonLoaders";

export interface DocumentRegistryProps {
  documentSummaries: DocumentSummaryRecord[];
  activeFilterCriteria: DocumentFilterCriteria;
  onFilterChange: (updatedFilterCriteria: DocumentFilterCriteria) => void;
  onOpenDocument: (documentIdentifier: string) => void;
  onExportPdfDirect: (documentIdentifier: string) => void;
  onDuplicateDocument: (documentIdentifier: string) => void;
  onUpdateDocumentStatus: (
    documentIdentifier: string,
    targetLifecycleStatus: DocumentLifecycleStatus
  ) => void;
  onSoftDeleteDocument: (documentIdentifier: string) => void;
  onRestoreDocument: (documentIdentifier: string) => void;
  onCreateNewDocument: (documentType: "estimate" | "invoice") => void;
  onRestoreSampleDocuments?: () => void;
  onConvertEstimateToInvoice?: (documentIdentifier: string) => void;
  isLoading?: boolean;
}

export const DocumentRegistry: FC<DocumentRegistryProps> = ({
  documentSummaries,
  activeFilterCriteria,
  onFilterChange,
  onOpenDocument,
  onExportPdfDirect,
  onDuplicateDocument,
  onUpdateDocumentStatus,
  onSoftDeleteDocument,
  onRestoreDocument,
  onCreateNewDocument,
  onRestoreSampleDocuments,
  onConvertEstimateToInvoice,
  isLoading = false,
}) => {
  const activeSpringTransition = useAccessibleMotion("productive");
  const isTrashViewActive = activeFilterCriteria.lifecycleStatus === "trash";

  const navigationFilterTabs = [
    { label: "All", classificationType: "all", lifecycleStatus: "all" },
    { label: "Invoices", classificationType: "invoice", lifecycleStatus: "all" },
    { label: "Estimates", classificationType: "estimate", lifecycleStatus: "all" },
    { label: "Paid", classificationType: "invoice", lifecycleStatus: "paid" },
    { label: "Drafts", classificationType: "all", lifecycleStatus: "draft" },
    { label: "Trash", classificationType: "all", lifecycleStatus: "trash" },
  ] as const;

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Search Bar & Multi-Filter Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={activeFilterCriteria.searchQuery || ""}
            onChange={(changeEvent) =>
              onFilterChange({
                ...activeFilterCriteria,
                searchQuery: changeEvent.target.value,
              })
            }
            placeholder="Search by doc #, client, company, notes..."
            className="w-full text-xs pl-8 pr-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2.5" />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {navigationFilterTabs.map((filterTab) => {
            const isTabActive =
              activeFilterCriteria.classificationType === filterTab.classificationType &&
              activeFilterCriteria.lifecycleStatus === filterTab.lifecycleStatus;

            return (
              <button
                key={filterTab.label}
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...activeFilterCriteria,
                    classificationType: filterTab.classificationType,
                    lifecycleStatus: filterTab.lifecycleStatus,
                  })
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  isTabActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {filterTab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3 py-2">
          {/* Mobile Card Skeletons */}
          <div className="md:hidden space-y-2.5">
            {[1, 2, 3].map((placeholderIndex) => (
              <DocumentCardSkeleton key={placeholderIndex} />
            ))}
          </div>

          {/* Desktop Table Skeletons */}
          <div className="hidden md:block rounded-xl border border-border bg-card/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-3">Client Customer</th>
                  <th className="py-2.5 px-2">Issue Date</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((placeholderIndex) => (
                  <DocumentRowSkeleton key={placeholderIndex} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : documentSummaries.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground bg-muted/10 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border mx-auto flex items-center justify-center text-muted-foreground">
            {isTrashViewActive ? <Trash2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {isTrashViewActive ? "Trash Bin is Empty" : "No documents found"}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {isTrashViewActive
                ? "Deleted invoices and estimates will appear here for safe recovery."
                : "Create a new contractor estimate or tax invoice to start billing clients."}
            </p>
          </div>

          {!isTrashViewActive && (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onCreateNewDocument("estimate")}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-secondary/90 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Estimate</span>
              </button>
              <button
                type="button"
                onClick={() => onCreateNewDocument("invoice")}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </button>
            </div>
          )}

          {!isTrashViewActive && onRestoreSampleDocuments && (
            <div className="pt-2 border-t border-border/40 mt-3 max-w-xs mx-auto">
              <button
                type="button"
                onClick={onRestoreSampleDocuments}
                className="inline-flex items-center space-x-1.5 text-xs text-muted-foreground hover:text-amber-500 font-medium transition-colors"
                title="Populate realistic sample estimates and invoices for testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Load Sample Demo Documents</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile Card Feed View (md:hidden) */}
          <div className="md:hidden space-y-2.5">
            <AnimatePresence mode="popLayout">
              {documentSummaries.map((documentSummary) => {
                const isEstimate = documentSummary.documentType === "estimate";

                return (
                  <motion.div
                    key={documentSummary.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={activeSpringTransition}
                    className="p-3.5 rounded-xl border border-border bg-card/60 hover:bg-muted/30 transition-colors space-y-2.5 shadow-xs"
                  >
                    {/* Top Row: Doc #, Type & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isEstimate
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {isEstimate ? (
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-xs text-foreground block truncate">
                            {documentSummary.documentNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                            {documentSummary.documentType}
                          </span>
                        </div>
                      </div>

                      <StatusBadge status={documentSummary.documentStatus} />
                    </div>

                    {/* Middle Row: Client & Date */}
                    <div className="flex items-baseline justify-between text-xs pt-1">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-foreground truncate">
                          {documentSummary.clientName}
                        </div>
                        {documentSummary.clientCompanyName && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {documentSummary.clientCompanyName}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-extrabold text-sm text-foreground">
                          {formatCents(documentSummary.totalCents)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {documentSummary.issueDate}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Quick Action Toolbar */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1">
                      <div className="flex items-center space-x-1">
                        {!isTrashViewActive ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenDocument(documentSummary.id)}
                              className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center space-x-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onExportPdfDirect(documentSummary.id)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                              title="Export PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDuplicateDocument(documentSummary.id)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {documentSummary.documentType === "invoice" &&
                              documentSummary.documentStatus !== "paid" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateDocumentStatus(documentSummary.id, "paid")
                                  }
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
                                  title="Mark as Paid"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                            {documentSummary.documentType === "estimate" && onConvertEstimateToInvoice && (
                              <button
                                type="button"
                                onClick={() => onConvertEstimateToInvoice(documentSummary.id)}
                                className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-lg flex items-center space-x-1"
                                title="Convert Estimate to Invoice & Bill"
                              >
                                <FileCheck2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">Bill</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRestoreDocument(documentSummary.id)}
                            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs font-bold flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>

                      {!isTrashViewActive && (
                        <button
                          type="button"
                          onClick={() => onSoftDeleteDocument(documentSummary.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Desktop High-Density Table View (hidden on mobile, visible md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 px-2">Document #</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Client Customer</th>
                  <th className="py-2.5 px-2">Issue Date</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documentSummaries.map((documentSummary) => {
                  const isEstimate = documentSummary.documentType === "estimate";

                  return (
                    <tr
                      key={documentSummary.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Document Number */}
                      <td className="py-3 px-2 font-mono font-bold text-foreground">
                        <button
                          type="button"
                          onClick={() => onOpenDocument(documentSummary.id)}
                          className="hover:underline text-primary"
                        >
                          {documentSummary.documentNumber}
                        </button>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isEstimate
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isEstimate ? (
                            <FileSpreadsheet className="w-3 h-3" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          <span>{documentSummary.documentType}</span>
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-2">
                        <StatusBadge status={documentSummary.documentStatus} />
                      </td>

                      {/* Client Customer */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-foreground">
                          {documentSummary.clientName}
                        </div>
                        {documentSummary.clientCompanyName && (
                          <div className="text-[10px] text-muted-foreground">
                            {documentSummary.clientCompanyName}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-2 text-muted-foreground font-mono">
                        {documentSummary.issueDate}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-foreground">
                        {formatCents(documentSummary.totalCents)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-90 group-hover:opacity-100">
                          {!isTrashViewActive ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenDocument(documentSummary.id)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                title="Open & Edit"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onExportPdfDirect(documentSummary.id)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                title="Export PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDuplicateDocument(documentSummary.id)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                title="Duplicate Document"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {documentSummary.documentType === "estimate" && onConvertEstimateToInvoice && (
                                <button
                                  type="button"
                                  onClick={() => onConvertEstimateToInvoice(documentSummary.id)}
                                  className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-md transition-colors"
                                  title="Convert to Active Invoice (Bill Client)"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {documentSummary.documentType === "invoice" &&
                                documentSummary.documentStatus !== "paid" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateDocumentStatus(documentSummary.id, "paid")
                                    }
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-md transition-colors"
                                    title="Mark as Paid"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}

                              <button
                                type="button"
                                onClick={() => onSoftDeleteDocument(documentSummary.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRestoreDocument(documentSummary.id)}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-md text-xs font-bold flex items-center space-x-1"
                              title="Restore Document"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
