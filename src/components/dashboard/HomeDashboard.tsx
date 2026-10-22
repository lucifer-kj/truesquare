import { useState, useEffect, type FC, type ChangeEvent } from "react";
import { Plus, FileSpreadsheet, Users, ShieldCheck, Download, Upload, CheckCircle2, Sparkles, Trash2 } from "lucide-react";
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
  seedSampleContractorDocumentsIfEmpty,
  downloadVaultBackupFile,
  importVaultSnapshot,
  hasDemoDocumentsInRepository,
  purgeDemoDocumentsFromRepository,
  forceSeedSampleContractorDocuments,
  setSampleDataLifecycleStatus,
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
  const [hasDemoDocuments, setHasDemoDocuments] = useState<boolean>(false);

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
      // Seed initial sample documents if clean
      await seedSampleContractorDocumentsIfEmpty();

      const [loadedSummaries, loadedClients, loadedKpis, demoStatus] = await Promise.all([
        listDocumentSummaries(filterCriteria),
        listClientsFromRepository(clientSearchQuery),
        calculateDashboardKpiMetrics(),
        hasDemoDocumentsInRepository(),
      ]);

      setDocumentSummaries(loadedSummaries);
      setClientRecords(loadedClients);
      setKpiMetrics(loadedKpis);
      setHasDemoDocuments(demoStatus);
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

  const handlePurgeSampleData = async () => {
    const purgedCount = await purgeDemoDocumentsFromRepository();
    setBackupNotification(
      `Cleared ${purgedCount} sample demo documents. TrueSquare Studio is now in a pristine, clean state.`
    );
    await refreshDashboardData();
    setTimeout(() => setBackupNotification(null), 5000);
  };

  const handleDismissSampleBanner = () => {
    setSampleDataLifecycleStatus("retained");
    setHasDemoDocuments(false);
  };

  const handleRestoreSampleDocuments = async () => {
    await forceSeedSampleContractorDocuments();
    setBackupNotification("Restored 3 sample demo documents for exploration.");
    await refreshDashboardData();
    setTimeout(() => setBackupNotification(null), 5000);
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full"
      style={{ paddingBottom: "calc(6.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Sample Demo Workspace Banner */}
      {hasDemoDocuments && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div>
              <span className="font-bold text-amber-500">Sample Demo Workspace Active</span>
              <span className="text-zinc-400 dark:text-zinc-400 ml-1.5 hidden sm:inline">
                (3 preloaded sample records for Miller Renovations &amp; Vance Residence).
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePurgeSampleData}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all shadow-2xs active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Sample Data &amp; Start Fresh</span>
            </button>
            <button
              type="button"
              onClick={handleDismissSampleBanner}
              className="px-2.5 py-1.5 rounded-xl hover:bg-amber-500/15 text-amber-500/80 hover:text-amber-500 font-semibold transition-colors"
            >
              Keep Demos
            </button>
          </div>
        </div>
      )}

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
            onRestoreSampleDocuments={handleRestoreSampleDocuments}
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
