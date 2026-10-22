import { useState, useRef, useEffect, type FC, type TouchEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Layers,
  Eye,
  ArrowRight,
  ArrowLeft,
  Download,
  Search,
  Lock,
  MoreHorizontal,
  FileSpreadsheet,
} from "lucide-react";
import { DocumentMetaForm } from "@/components/editor/DocumentMetaForm";
import { ContractorProfileForm } from "@/components/editor/ContractorProfileForm";
import { ClientCustomerForm } from "@/components/editor/ClientCustomerForm";
import { LineItemsEditor } from "@/components/editor/LineItemsEditor";
import { TermsAndNotesForm } from "@/components/editor/TermsAndNotesForm";
import { DocumentCanvas } from "@/components/invoice/DocumentCanvas";
import { useAccessibleMotion, directionalSlideVariants } from "@/design-system";
import { formatCents } from "@/domain/money";
import type {
  InvoiceEstimateDocument,
  ContractorBusinessProfile,
  CalculatedDocumentTotals,
  ClientCustomerRecord,
  DocumentClassificationType,
  SupplyLineItem,
} from "@/domain/types";

export interface MobileFieldToolProps {
  activeDocument: InvoiceEstimateDocument;
  contractorProfile: ContractorBusinessProfile;
  calculatedTotals: CalculatedDocumentTotals;
  persistenceStatus: "idle" | "saving" | "saved" | "error";
  onNavigateToDashboard?: () => void;
  onLockSession?: () => void;
  onUpdateContractorProfile: (profile: ContractorBusinessProfile) => void;
  onUpdateClientRecord: (client: ClientCustomerRecord) => void;
  onUpdateDocumentType: (type: DocumentClassificationType) => void;
  onUpdateDates: (issueDate: string, dueOrExpiryDate?: string) => void;
  onAddSupplyLineItem: (item: SupplyLineItem) => void;
  onUpdateSupplyLineItem: (id: string, updates: Partial<SupplyLineItem>) => void;
  onRemoveSupplyLineItem: (id: string) => void;
  onUpdateTaxSettings: (taxLabel: string, taxRateBasisPoints: number) => void;
  onUpdateNotesAndTerms: (notes: string, paymentTerms: string) => void;
  onApplyProposedLineItems: (proposedItems: SupplyLineItem[], targetBudgetCents: number) => void;
  onTriggerExportPdf: () => void;
  onStartNewBlankDocument?: () => void;
  onCreateNewDocument?: (documentType: DocumentClassificationType) => void;
  onOpenCommandPalette?: () => void;
}

export const MobileFieldTool: FC<MobileFieldToolProps> = ({
  activeDocument,
  contractorProfile,
  calculatedTotals,
  persistenceStatus,
  onNavigateToDashboard,
  onLockSession,
  onUpdateContractorProfile,
  onUpdateClientRecord,
  onUpdateDocumentType,
  onUpdateDates,
  onAddSupplyLineItem,
  onUpdateSupplyLineItem,
  onRemoveSupplyLineItem,
  onUpdateTaxSettings,
  onUpdateNotesAndTerms,
  onApplyProposedLineItems,
  onTriggerExportPdf,
  onStartNewBlankDocument,
  onCreateNewDocument,
  onOpenCommandPalette,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const activeSpringTransition = useAccessibleMotion("expressive");

  // Touch Swipe Gesture Tracking
  const touchStartCoordX = useRef<number | null>(null);
  const touchStartCoordY = useRef<number | null>(null);

  useEffect(() => {
    const handleOutsideClick = (mouseEvent: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(mouseEvent.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleTouchStart = (touchEvent: TouchEvent<HTMLDivElement>) => {
    touchStartCoordX.current = touchEvent.touches[0].clientX;
    touchStartCoordY.current = touchEvent.touches[0].clientY;
  };

  const handleTouchEnd = (touchEvent: TouchEvent<HTMLDivElement>) => {
    if (touchStartCoordX.current === null || touchStartCoordY.current === null) return;

    const deltaX = touchEvent.changedTouches[0].clientX - touchStartCoordX.current;
    const deltaY = touchEvent.changedTouches[0].clientY - touchStartCoordY.current;

    // Trigger horizontal swipe transitions only if horizontal outweighs vertical scroll
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && activeStepIndex < 2) {
        navigateToStep(activeStepIndex + 1);
      } else if (deltaX > 0 && activeStepIndex > 0) {
        navigateToStep(activeStepIndex - 1);
      }
    }

    touchStartCoordX.current = null;
    touchStartCoordY.current = null;
  };

  const navigateToStep = (targetStepIndex: number) => {
    setSlideDirection(targetStepIndex > activeStepIndex ? 1 : -1);
    setActiveStepIndex(targetStepIndex);
  };

  const handleCreateDocument = (type: DocumentClassificationType) => {
    setIsMoreMenuOpen(false);
    if (onCreateNewDocument) {
      onCreateNewDocument(type);
    } else if (onStartNewBlankDocument) {
      onStartNewBlankDocument();
    }
  };

  const mobileNavTabs = [
    { label: "Details", icon: FileText, badge: null },
    {
      label: "Supplies",
      icon: Layers,
      badge: activeDocument.items.length > 0 ? activeDocument.items.length : null,
    },
    { label: "Preview", icon: Eye, badge: null },
  ];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex-1 flex flex-col min-h-0 bg-background text-foreground"
    >
      {/* Streamlined Mobile Top App Bar (No Clutter, 3 Balanced Zones) */}
      <header className="sticky top-0 z-30 h-13 bg-card/95 backdrop-blur-md border-b border-border px-3 flex items-center justify-between select-none shrink-0 shadow-xs">
        {/* Left: Back to Hub + Document Reference */}
        <div className="flex items-center space-x-1.5 min-w-0">
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="flex items-center space-x-1 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Return to Hub Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-semibold">Hub</span>
            </button>
          )}

          <div className="h-3.5 w-px bg-border mx-0.5" />

          <div className="flex items-center space-x-1 min-w-0">
            <span className="font-mono font-bold text-xs text-foreground truncate">
              {activeDocument.documentNumber}
            </span>
            <span
              className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                activeDocument.documentType === "invoice"
                  ? "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {activeDocument.documentType === "invoice" ? "INV" : "EST"}
            </span>
          </div>
        </div>

        {/* Center: Step Progress Pill */}
        <div className="flex items-center space-x-1 bg-muted/80 border border-border px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
          <span className="text-primary font-bold">{activeStepIndex + 1}/3</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">
            {activeStepIndex === 0 ? "Details" : activeStepIndex === 1 ? "Supplies" : "Preview"}
          </span>
        </div>

        {/* Right: Autosave Status & Quick More Actions */}
        <div className="flex items-center space-x-1">
          {/* Subtle persistence status dot */}
          <span
            className={`w-2 h-2 rounded-full ${
              persistenceStatus === "saving" ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
            }`}
            title={persistenceStatus === "saving" ? "Autosaving..." : "Saved Locally"}
          />

          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
              title="Search Catalog (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Action Popover Button */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prevState) => !prevState)}
              className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
              title="More Actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Popover Sheet */}
            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={activeSpringTransition}
                  className="absolute right-0 top-full mt-1.5 w-48 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-1.5 z-50 space-y-1"
                >
                  <button
                    type="button"
                    onClick={() => handleCreateDocument("estimate")}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted text-left transition-colors font-medium text-foreground"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                    <span>New Blank Estimate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateDocument("invoice")}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted text-left transition-colors font-medium text-foreground"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-500" />
                    <span>New Blank Invoice</span>
                  </button>

                  {onLockSession && (
                    <>
                      <div className="border-t border-border my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          onLockSession();
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted text-left transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Lock Vault Session</span>
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Content Viewport: Scrollable for Forms (Steps 0 & 1), Zero-Scroll Locked for Canvas Preview (Step 2) */}
      <div
        className={`flex-1 ${
          activeStepIndex === 2
            ? "overflow-hidden p-2 pb-14"
            : "overflow-y-auto overflow-x-hidden p-3.5 pb-20 scrollbar-thin"
        }`}
      >
        <AnimatePresence custom={slideDirection} mode="wait">
          {/* Step 0: Document Details, Client Customer & Contractor Profile */}
          {activeStepIndex === 0 && (
            <motion.div
              key="mobile-step-0-parties"
              custom={slideDirection}
              variants={directionalSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={activeSpringTransition}
              className="space-y-4"
            >
              <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <DocumentMetaForm
                  documentType={activeDocument.documentType}
                  documentNumber={activeDocument.documentNumber}
                  issueDate={activeDocument.issueDate}
                  dueOrExpiryDate={activeDocument.dueOrExpiryDate}
                  paymentTerms={activeDocument.paymentTerms}
                  onUpdateDocumentType={onUpdateDocumentType}
                  onUpdateDates={onUpdateDates}
                  onUpdatePaymentTerms={(paymentTerms) =>
                    onUpdateNotesAndTerms(activeDocument.notes, paymentTerms)
                  }
                />
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <ClientCustomerForm
                  clientCustomerRecord={activeDocument.client}
                  onUpdateClientRecord={onUpdateClientRecord}
                />
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <ContractorProfileForm
                  contractorProfile={contractorProfile}
                  onUpdateContractorProfile={onUpdateContractorProfile}
                />
              </div>

              {/* In-Flow Continuation Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigateToStep(1)}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold active:scale-[0.98] transition-all shadow-md"
                >
                  <span>Next: Add Supplies &amp; Pricing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Supply Line Items, Catalog & Remittance Terms */}
          {activeStepIndex === 1 && (
            <motion.div
              key="mobile-step-1-supplies"
              custom={slideDirection}
              variants={directionalSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={activeSpringTransition}
              className="space-y-4"
            >
              <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <LineItemsEditor
                  supplyLineItems={activeDocument.items}
                  taxRateBasisPoints={activeDocument.taxRateBasisPoints}
                  onAddSupplyLineItem={onAddSupplyLineItem}
                  onUpdateSupplyLineItem={onUpdateSupplyLineItem}
                  onRemoveSupplyLineItem={onRemoveSupplyLineItem}
                  onApplyProposedLineItems={onApplyProposedLineItems}
                />
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <TermsAndNotesForm
                  taxLabel={activeDocument.taxLabel}
                  taxRateBasisPoints={activeDocument.taxRateBasisPoints}
                  notes={activeDocument.notes}
                  paymentTerms={activeDocument.paymentTerms}
                  calculatedDocumentTotals={calculatedTotals}
                  onUpdateTaxSettings={onUpdateTaxSettings}
                  onUpdateNotesAndTerms={onUpdateNotesAndTerms}
                />
              </div>

              {/* In-Flow Continuation Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigateToStep(2)}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold active:scale-[0.98] transition-all shadow-md"
                >
                  <span>Review &amp; Preview Document</span>
                  <span className="font-mono text-[11px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                    {formatCents(calculatedTotals.totalCents)}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: High-Fidelity PDF Canvas Preview (Zero-Scroll Full Fit) */}
          {activeStepIndex === 2 && (
            <motion.div
              key="mobile-step-2-preview"
              custom={slideDirection}
              variants={directionalSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={activeSpringTransition}
              className="h-full flex flex-col overflow-hidden"
            >
              <DocumentCanvas
                invoiceDocument={activeDocument}
                documentTotalCents={calculatedTotals.totalCents}
                disableScroll={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slim Thumb-Zone Bottom App Dock (Single-tier, no giant overlapping button) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl px-3 py-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex items-center justify-around select-none">
        {activeStepIndex < 2 ? (
          mobileNavTabs.map((navTab, tabIndex) => {
            const TabIcon = navTab.icon;
            const isTabActive = activeStepIndex === tabIndex;

            return (
              <button
                key={navTab.label}
                type="button"
                onClick={() => navigateToStep(tabIndex)}
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
                  isTabActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                }`}
                style={{ minHeight: "44px" }}
              >
                <div className="relative">
                  <TabIcon className="w-4 h-4" />
                  {navTab.badge !== null && (
                    <span className="absolute -top-1 -right-2.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-mono font-bold flex items-center justify-center">
                      {navTab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{navTab.label}</span>
                {isTabActive && (
                  <motion.div
                    layoutId="mobile-active-tab-indicator"
                    className="absolute bottom-0 w-6 h-0.5 bg-primary rounded-full"
                    transition={activeSpringTransition}
                  />
                )}
              </button>
            );
          })
        ) : (
          /* Step 2 (Preview): Prominent Full Export PDF Action + Step Return */
          <div className="w-full flex items-center space-x-2 py-0.5">
            <button
              type="button"
              onClick={() => navigateToStep(1)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-semibold active:scale-95 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Supplies</span>
            </button>

            <button
              type="button"
              onClick={onTriggerExportPdf}
              className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold active:scale-[0.98] transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download 1-Page PDF</span>
            </button>
          </div>
        )}
      </nav>
    </div>
  );
};
