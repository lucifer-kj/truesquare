import { useState, useEffect, type FC, type ChangeEvent } from "react";
import { Plus, FileSpreadsheet, Users, ShieldCheck, Download, Upload, CheckCircle2 } from "lucide-react";
import { KpiOverviewCards } from "./KpiOverviewCards";
import { DocumentRegistry } from "./DocumentRegistry";
import { ClientDirectory } from "./ClientDirectory";
import {
  listDocumentSummaries,
  listClientsFromRepository,
  calculateDashboardKpiMetrics,
  softDeleteDocument,
  restoreDocumentFromTrash,
  duplicateDocumentInRepository,
  updateDocumentStatusInRepository,
  downloadVaultBackupFile,
  importVaultSnapshot,
  convertEstimateToInvoiceInRepository,
} from "@/services/indexeddb-repository";
import type {
  DocumentSummaryRecord,
  ClientDirectoryRecord,
  DashboardKpiMetrics,
  DocumentFilterCriteria,
  DocumentLifecycleStatus,
} from "@/domain/types";

export interface HomeDashboardProps {
  onOpenDocument: (documentIdentifier: string) => void;
  onCreateNewDocument: (documentType: "estimate" | "invoice") => void;
  onCreateDocumentForClient: (
    clientRecord: ClientDirectoryRecord,
    documentType: "estimate" | "invoice"
  ) => void;
  onExportPdfDirect: (documentIdentifier: string) => void;
  activeSectionTab?: "documents" | "clients";
  onSectionTabChange?: (tab: "documents" | "clients") => void;
}

export const HomeDashboard: FC<HomeDashboardProps> = ({
  onOpenDocument,
  onCreateNewDocument,
  onCreateDocumentForClient,
  onExportPdfDirect,
  activeSectionTab,
  onSectionTabChange,
}) => {
  const [internalSectionTab, setInternalSectionTab] = useState<"documents" | "clients">("documents");
  const activeDashboardTab = activeSectionTab !== undefined ? activeSectionTab : internalSectionTab;

  const handleTabSelection = (targetTab: "documents" | "clients") => {
    if (onSectionTabChange) {
      onSectionTabChange(targetTab);
    } else {
      setInternalSectionTab(targetTab);
    }
  };

  const [filterCriteria, setFilterCriteria] = useState<DocumentFilterCriteria>({
    classificationType: "all",
    lifecycleStatus: "all",
    searchQuery: "",
  });
  const [clientSearchQuery, setClientSearchQuery] = useState<string>("");
  const [backupNotification, setBackupNotification] = useState<string | null>(null);

  const [documentSummaries, setDocumentSummaries] = useState<DocumentSummaryRecord[]>([]);
  const [clientRecords, setClientRecords] = useState<ClientDirectoryRecord[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<DashboardKpiMetrics>({
    totalInvoicedCents: 0,
    outstandingReceivableCents: 0,
    activeEstimatesCents: 0,
    paidInvoicesCount: 0,
    activeEstimatesCount: 0,
    totalClientsCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshDashboardData = async () => {
    try {
      const [loadedSummaries, loadedClients, loadedKpis] = await Promise.all([
        listDocumentSummaries(filterCriteria),
        listClientsFromRepository(clientSearchQuery),
        calculateDashboardKpiMetrics(),
      ]);

      setDocumentSummaries(loadedSummaries);
      setClientRecords(loadedClients);
      setKpiMetrics(loadedKpis);
    } catch (loadError) {
      console.warn("Unable to load repository documents:", loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboardData();
  }, [filterCriteria, clientSearchQuery]);

  const handleSoftDelete = async (documentIdentifier: string) => {
    await softDeleteDocument(documentIdentifier);
    await refreshDashboardData();
  };

  const handleRestore = async (documentIdentifier: string) => {
    await restoreDocumentFromTrash(documentIdentifier);
    await refreshDashboardData();
  };

  const handleDuplicate = async (documentIdentifier: string) => {
    const duplicatedDocument = await duplicateDocumentInRepository(documentIdentifier);
    if (duplicatedDocument) {
      await refreshDashboardData();
      onOpenDocument(duplicatedDocument.id);
    }
  };

  const handleUpdateStatus = async (
    documentIdentifier: string,
    targetStatus: DocumentLifecycleStatus
  ) => {
    await updateDocumentStatusInRepository(documentIdentifier, targetStatus);
    await refreshDashboardData();
  };

  const handleConvertEstimateToInvoice = async (estimateIdentifier: string) => {
    const convertedInvoice = await convertEstimateToInvoiceInRepository(estimateIdentifier);
    if (convertedInvoice) {
      setBackupNotification(`Generated Invoice ${convertedInvoice.documentNumber} from accepted estimate.`);
      await refreshDashboardData();
      onOpenDocument(convertedInvoice.id);
    }
  };

  const handleExportVault = async () => {
    try {
      await downloadVaultBackupFile();
      setBackupNotification("Vault backup package exported successfully.");
      setTimeout(() => setBackupNotification(null), 4000);
    } catch (vaultExportError) {
      setBackupNotification("Failed to export vault backup.");
      setTimeout(() => setBackupNotification(null), 4000);
    }
  };

  const handleImportVaultFile = async (importEvent: ChangeEvent<HTMLInputElement>) => {
    const candidateFile = importEvent.target.files?.[0];
    if (!candidateFile) return;

    try {
      const fileContentText = await candidateFile.text();
      const importOutcome = await importVaultSnapshot(fileContentText);
      if (importOutcome.validationSuccess) {
        setBackupNotification(
          `Vault restored: ${importOutcome.importedDocumentsCount} documents and ${importOutcome.importedClientsCount} clients loaded.`
        );
        await refreshDashboardData();
      } else {
        setBackupNotification(importOutcome.errorMessage || "Failed to restore vault backup.");
      }
    } catch (fileReadError) {
      setBackupNotification("Unable to process the selected backup file.");
    } finally {
      importEvent.target.value = "";
      setTimeout(() => setBackupNotification(null), 6000);
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full"
      style={{ paddingBottom: "calc(6.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Backup Notification Toast */}
      {backupNotification && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{backupNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setBackupNotification(null)}
            className="text-xs text-amber-500/70 hover:text-amber-500 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Contractor Studio Hub
            </h1>
            <span
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold"
              title="All client data encrypted locally"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Encrypted Vault</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your construction estimates, tax invoices, and client customer accounts.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Vault Portability Actions */}
          <button
            type="button"
            onClick={handleExportVault}
            title="Download full encrypted offline vault (.bbvault)"
            className="hidden sm:inline-flex items-center space-x-1 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Export Vault</span>
          </button>

          <label
            title="Import vault backup package (.bbvault or .json)"
            className="hidden sm:inline-flex items-center space-x-1 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-2xs active:scale-[0.98]"
          >
            <Upload className="w-3.5 h-3.5 text-sky-500" />
            <span>Import Vault</span>
            <input
              type="file"
              accept=".bbvault,.json"
              onChange={handleImportVaultFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => onCreateNewDocument("estimate")}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Estimate</span>
          </button>

          <button
            type="button"
            onClick={() => onCreateNewDocument("invoice")}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <KpiOverviewCards kpiMetrics={kpiMetrics} isLoading={isLoading} />

      {/* Main Section Navigation Tabs: Invoices & Estimates vs Client Directory */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-border pb-1">
          <button
            type="button"
            onClick={() => handleTabSelection("documents")}
            className={`flex items-center space-x-1.5 pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeDashboardTab === "documents"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Invoices &amp; Estimates</span>
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-muted text-[10px] font-mono">
              {documentSummaries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSelection("clients")}
            className={`flex items-center space-x-1.5 pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeDashboardTab === "clients"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Client Directory</span>
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-muted text-[10px] font-mono">
              {clientRecords.length}
            </span>
          </button>
        </div>

        {/* Tab Viewport */}
        {activeDashboardTab === "documents" ? (
          <DocumentRegistry
            documentSummaries={documentSummaries}
            activeFilterCriteria={filterCriteria}
            onFilterChange={setFilterCriteria}
            onOpenDocument={onOpenDocument}
            onExportPdfDirect={onExportPdfDirect}
            onDuplicateDocument={handleDuplicate}
            onUpdateDocumentStatus={handleUpdateStatus}
            onSoftDeleteDocument={handleSoftDelete}
            onRestoreDocument={handleRestore}
            onCreateNewDocument={onCreateNewDocument}
            onConvertEstimateToInvoice={handleConvertEstimateToInvoice}
            isLoading={isLoading}
          />
        ) : (
          <ClientDirectory
            clientRecords={clientRecords}
            searchQuery={clientSearchQuery}
            onSearchQueryChange={setClientSearchQuery}
            onCreateDocumentForClient={onCreateDocumentForClient}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
