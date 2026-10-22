import { useState, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HardHat,
  Plus,
  Search,
  Lock,
  FileSpreadsheet,
  FileText,
  Users,
} from "lucide-react";
import { CommandBar } from "./CommandBar";
import { DesktopStudio } from "./DesktopStudio";
import { MobileFieldTool } from "./MobileFieldTool";
import { AppSplashScreen } from "./AppSplashScreen";
import { HomeDashboard } from "@/components/dashboard/HomeDashboard";
import { CommandPalette } from "@/components/primitives/CommandPalette";
import { PasscodeLockModal } from "@/components/auth/PasscodeLockModal";
import { useDocumentDraft } from "@/hooks/useDocumentDraft";
import { getDocumentByIdFromRepository } from "@/services/indexeddb-repository";
import {
  getCurrentSession,
  lockCurrentSession,
  subscribeToSessionChanges,
} from "@/services/auth-service";
import { uploadEncryptedDisasterBackup } from "@/services/cloud-backup-service";
import { useAccessibleMotion } from "@/design-system";
import type { ClientDirectoryRecord } from "@/domain/types";

export const AppShell: FC = () => {
  const {
    activeDocument,
    contractorProfile,
    calculatedTotals,
    persistenceStatus,
    updateContractorProfile,
    updateClientRecord,
    updateDocumentType,
    updateDates,
    addSupplyLineItem,
    updateSupplyLineItem,
    removeSupplyLineItem,
    updateTaxSettings,
    updateNotesAndTerms,
    applyProposedLineItems,
    startNewBlankDocument,
    loadArchivedDocumentIntoDraft,
  } = useDocumentDraft();

  // Active view: Defaults to "dashboard" as per architectural baseline
  const [activeView, setActiveView] = useState<"dashboard" | "editor">("dashboard");
  const [dashboardSectionTab, setDashboardSectionTab] = useState<"documents" | "clients">("documents");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isMobileCreateMenuOpen, setIsMobileCreateMenuOpen] = useState<boolean>(false);
  const [isInitialBootSplashVisible, setIsInitialBootSplashVisible] = useState<boolean>(true);
  const [sessionState, setSessionState] = useState(getCurrentSession);
  const activeSpringTransition = useAccessibleMotion("productive");

  // Initial boot splash timeout (fades out after cold boot initialization)
  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setIsInitialBootSplashVisible(false);
    }, 450);
    return () => clearTimeout(bootTimer);
  }, []);

  // Subscribe to operator session locking & state transitions
  useEffect(() => {
    return subscribeToSessionChanges((updatedState) => {
      setSessionState(updatedState);
    });
  }, []);

  // Global print shortcut: Alt+P (triggers backup snapshot simultaneously)
  const handleTriggerPrint = () => {
    uploadEncryptedDisasterBackup(activeDocument).catch((backupError) => {
      console.warn("Disaster backup snapshot failed:", backupError);
    });

    const iframe = document.querySelector("iframe");
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (keyEvent: KeyboardEvent) => {
      // Toggle Command Palette: Ctrl+K or Cmd+K
      if ((keyEvent.ctrlKey || keyEvent.metaKey) && keyEvent.key.toLowerCase() === "k") {
        keyEvent.preventDefault();
        setIsCommandPaletteOpen((prevIsOpen) => !prevIsOpen);
        return;
      }

      // Close on Escape if palette is open
      if (keyEvent.key === "Escape" && isCommandPaletteOpen) {
        keyEvent.preventDefault();
        setIsCommandPaletteOpen(false);
        return;
      }

      // Export Print: Alt+P
      if (keyEvent.altKey && keyEvent.key.toLowerCase() === "p") {
        keyEvent.preventDefault();
        handleTriggerPrint();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isCommandPaletteOpen]);

  const handleOpenDocument = async (documentIdentifier: string) => {
    const targetDocument = await getDocumentByIdFromRepository(documentIdentifier);
    if (targetDocument) {
      loadArchivedDocumentIntoDraft(targetDocument);
      setActiveView("editor");
    }
  };

  const handleCreateNewDocument = (documentType: "estimate" | "invoice") => {
    startNewBlankDocument(documentType);
    setActiveView("editor");
  };

  const handleCreateDocumentForClient = (
    clientRecord: ClientDirectoryRecord,
    documentType: "estimate" | "invoice"
  ) => {
    startNewBlankDocument(documentType);
    updateClientRecord({
      id: clientRecord.id,
      name: clientRecord.name,
      companyName: clientRecord.companyName,
      email: clientRecord.email,
      phone: clientRecord.phone,
      addressLines: clientRecord.addressLines,
      city: clientRecord.city,
      region: clientRecord.region,
      postalCode: clientRecord.postalCode,
      country: clientRecord.country,
    });
    setActiveView("editor");
  };

  const handleExportPdfDirect = async (documentIdentifier: string) => {
    const targetDocument = await getDocumentByIdFromRepository(documentIdentifier);
    if (targetDocument) {
      uploadEncryptedDisasterBackup(targetDocument).catch(() => {});
      loadArchivedDocumentIntoDraft(targetDocument);
      setActiveView("editor");
      setTimeout(() => {
        handleTriggerPrint();
      }, 400);
    }
  };

  return (
    <div
      className={`min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-accent selection:text-accent-foreground ${
        activeView === "editor" ? "lg:h-screen lg:overflow-hidden" : ""
      }`}
    >
      {/* Universal Enterprise Command Bar — Desktop Studio Only (>= 1024px) */}
      <div className="hidden lg:block">
        <CommandBar
          documentType={activeDocument.documentType}
          documentNumber={activeDocument.documentNumber}
          documentStatus={activeDocument.documentStatus || "draft"}
          persistenceStatus={persistenceStatus}
          activeView={activeView}
          onNavigateToDashboard={() => setActiveView("dashboard")}
          onNavigateToEditor={() => setActiveView("editor")}
          onLockSession={lockCurrentSession}
          onStartNewBlankDocument={() => handleCreateNewDocument("estimate")}
          onCreateNewDocument={handleCreateNewDocument}
          onUpdateDocumentType={updateDocumentType}
          onTriggerExportPdf={handleTriggerPrint}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
      </div>

      {/* Mobile Top App Bar (When on Dashboard, < 1024px) */}
      {activeView === "dashboard" && (
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-card/95 backdrop-blur-md border-b border-border px-3.5 flex items-center justify-between select-none shrink-0 shadow-xs">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xs tracking-tight text-foreground">
                  TrueSquare Hub
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Encrypted Vault" />
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                Contractor Studio
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              title="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={lockCurrentSession}
              className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              title="Lock Vault"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* Main View Router with Fluid Transitions */}
      <AnimatePresence mode="wait">
        {activeView === "dashboard" ? (
          /* 1. Home Dashboard View */
          <motion.div
            key="view-dashboard"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={activeSpringTransition}
            className="flex-1 flex flex-col min-h-0 pb-28 lg:pb-0"
          >
            <HomeDashboard
              activeSectionTab={dashboardSectionTab}
              onSectionTabChange={setDashboardSectionTab}
              onOpenDocument={handleOpenDocument}
              onCreateNewDocument={handleCreateNewDocument}
              onCreateDocumentForClient={handleCreateDocumentForClient}
              onExportPdfDirect={handleExportPdfDirect}
            />
          </motion.div>
        ) : (
          /* 2. Document Editor View (Desktop Studio >= 1024px or Mobile Field Tool < 1024px) */
          <motion.div
            key="view-editor"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={activeSpringTransition}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Desktop Studio Layout (>= 1024px) */}
            <div className="hidden lg:flex flex-1 flex-col min-h-0">
              <DesktopStudio
                activeDocument={activeDocument}
                contractorProfile={contractorProfile}
                calculatedTotals={calculatedTotals}
                persistenceStatus={persistenceStatus}
                onUpdateContractorProfile={updateContractorProfile}
                onUpdateClientRecord={updateClientRecord}
                onUpdateDocumentType={updateDocumentType}
                onUpdateDates={updateDates}
                onAddSupplyLineItem={addSupplyLineItem}
                onUpdateSupplyLineItem={updateSupplyLineItem}
                onRemoveSupplyLineItem={removeSupplyLineItem}
                onUpdateTaxSettings={updateTaxSettings}
                onUpdateNotesAndTerms={updateNotesAndTerms}
                onApplyProposedLineItems={applyProposedLineItems}
              />
            </div>

            {/* Mobile Field Tool Layout (< 1024px) */}
            <div className="lg:hidden flex-1 flex flex-col min-h-0">
              <MobileFieldTool
                activeDocument={activeDocument}
                contractorProfile={contractorProfile}
                calculatedTotals={calculatedTotals}
                persistenceStatus={persistenceStatus}
                onNavigateToDashboard={() => setActiveView("dashboard")}
                onLockSession={lockCurrentSession}
                onUpdateContractorProfile={updateContractorProfile}
                onUpdateClientRecord={updateClientRecord}
                onUpdateDocumentType={updateDocumentType}
                onUpdateDates={updateDates}
                onAddSupplyLineItem={addSupplyLineItem}
                onUpdateSupplyLineItem={updateSupplyLineItem}
                onRemoveSupplyLineItem={removeSupplyLineItem}
                onUpdateTaxSettings={updateTaxSettings}
                onUpdateNotesAndTerms={updateNotesAndTerms}
                onApplyProposedLineItems={applyProposedLineItems}
                onTriggerExportPdf={handleTriggerPrint}
                onStartNewBlankDocument={() => handleCreateNewDocument("estimate")}
                onCreateNewDocument={handleCreateNewDocument}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Dock (When in Dashboard, < 1024px) */}
      {activeView === "dashboard" && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl px-3 py-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex items-center justify-around select-none">
          {/* Tab 1: Documents Registry */}
          <button
            type="button"
            onClick={() => setDashboardSectionTab("documents")}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              dashboardSectionTab === "documents"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Documents</span>
          </button>

          {/* Center Action: + New Action with Animated Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMobileCreateMenuOpen((prevState) => !prevState)}
              className="w-11 h-11 -mt-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
              title="Create New Document"
            >
              <Plus
                className={`w-5 h-5 transition-transform duration-200 ${
                  isMobileCreateMenuOpen ? "rotate-45" : ""
                }`}
              />
            </button>

            {/* Quick Create Sheet Popover */}
            <AnimatePresence>
              {isMobileCreateMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={activeSpringTransition}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-popover text-popover-foreground border border-border rounded-2xl shadow-2xl p-1.5 z-50 space-y-1"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileCreateMenuOpen(false);
                      handleCreateNewDocument("estimate");
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs rounded-xl hover:bg-muted text-left transition-colors font-medium text-foreground"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                    <span>New Estimate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileCreateMenuOpen(false);
                      handleCreateNewDocument("invoice");
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs rounded-xl hover:bg-muted text-left transition-colors font-medium text-foreground"
                  >
                    <FileText className="w-4 h-4 text-sky-500" />
                    <span>New Invoice</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tab 2: Client Directory */}
          <button
            type="button"
            onClick={() => setDashboardSectionTab("clients")}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              dashboardSectionTab === "clients"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Clients</span>
          </button>

          {/* Tab 3: Active Draft Editor */}
          <button
            type="button"
            onClick={() => setActiveView("editor")}
            className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-muted-foreground hover:text-foreground font-medium transition-all relative"
            title="Go to active draft editor"
          >
            <div className="relative">
              <FileText className="w-4 h-4" />
              {activeDocument.items.length > 0 && (
                <span className="absolute -top-1 -right-2.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-mono font-bold flex items-center justify-center">
                  {activeDocument.items.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Draft</span>
          </button>
        </nav>
      )}

      {/* Operator Passcode Lock Modal (Active when vault is locked) */}
      <PasscodeLockModal
        isOpen={sessionState.lockState === "locked"}
        activeOperator={sessionState.activeOperator}
        onUnlockSuccess={() => {}}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        documentType={activeDocument.documentType}
        onUpdateDocumentType={updateDocumentType}
        onAddSupplyLineItem={addSupplyLineItem}
        onUpdateClientRecord={updateClientRecord}
        onStartNewBlankDocument={() => handleCreateNewDocument("estimate")}
        onTriggerExportPdf={handleTriggerPrint}
      />

      {/* TrueSquare Initial Cold Boot Splash Screen */}
      <AnimatePresence>
        {isInitialBootSplashVisible && (
          <AppSplashScreen isLoading={isInitialBootSplashVisible} />
        )}
      </AnimatePresence>
    </div>
  );
};
