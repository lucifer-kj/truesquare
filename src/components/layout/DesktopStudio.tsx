import { useState, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  UserCheck,
  Layers,
  Building2,
  LayoutGrid,
  CheckCircle2,
} from "lucide-react";
import { DocumentMetaForm } from "@/components/editor/DocumentMetaForm";
import { ContractorProfileForm } from "@/components/editor/ContractorProfileForm";
import { ClientCustomerForm } from "@/components/editor/ClientCustomerForm";
import { LineItemsEditor } from "@/components/editor/LineItemsEditor";
import { TermsAndNotesForm } from "@/components/editor/TermsAndNotesForm";
import { DocumentCanvas } from "@/components/invoice/DocumentCanvas";
import { StatusBar } from "./StatusBar";
import { useAccessibleMotion } from "@/design-system";
import type {
  InvoiceEstimateDocument,
  ContractorBusinessProfile,
  CalculatedDocumentTotals,
  ClientCustomerRecord,
  DocumentClassificationType,
  SupplyLineItem,
} from "@/domain/types";
import { formatCents } from "@/domain/money";

export interface DesktopStudioProps {
  activeDocument: InvoiceEstimateDocument;
  contractorProfile: ContractorBusinessProfile;
  calculatedTotals: CalculatedDocumentTotals;
  persistenceStatus: "idle" | "saving" | "saved" | "error";
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
}

export type StudioEditorTab = "supplies" | "client" | "settings" | "contractor" | "all";

export const DesktopStudio: FC<DesktopStudioProps> = ({
  activeDocument,
  contractorProfile,
  calculatedTotals,
  persistenceStatus,
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
}) => {
  const [activeTab, setActiveTab] = useState<StudioEditorTab>("supplies");
  const activeSpringTransition = useAccessibleMotion("productive");

  const isClientFilled = Boolean(activeDocument.client.name || activeDocument.client.companyName);
  const isItemsFilled = activeDocument.items.length > 0;

  const tabs: Array<{
    id: StudioEditorTab;
    label: string;
    icon: typeof Layers;
    badge?: string | number;
    isComplete?: boolean;
  }> = [
    {
      id: "supplies",
      label: "Supplies",
      icon: Layers,
      badge: activeDocument.items.length,
      isComplete: isItemsFilled,
    },
    {
      id: "client",
      label: "Client",
      icon: UserCheck,
      isComplete: isClientFilled,
    },
    {
      id: "settings",
      label: "Settings",
      icon: FileText,
      isComplete: Boolean(activeDocument.documentNumber && activeDocument.issueDate),
    },
    {
      id: "contractor",
      label: "Business & Tax",
      icon: Building2,
      isComplete: Boolean(contractorProfile.businessName && contractorProfile.phone),
    },
    {
      id: "all",
      label: "All",
      icon: LayoutGrid,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden justify-between">
      {/* 2-Pane Desktop Studio Layout */}
      <div className="flex-1 max-w-[1780px] w-full mx-auto px-5 py-3 grid grid-cols-12 gap-5 min-h-0 overflow-hidden">
        {/* Left Pane: Studio Editor Panel with Tab Navigation */}
        <div className="col-span-6 xl:col-span-5 flex flex-col min-h-0 h-full overflow-hidden space-y-3">
          {/* Quick Context Summary Banner */}
          <div className="p-3 bg-card border border-border rounded-xl shadow-2xs flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="font-mono font-bold text-foreground">
                {activeDocument.documentNumber}
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                {activeDocument.documentType}
              </span>
              <span className="text-muted-foreground truncate hidden sm:inline">
                · {activeDocument.client.companyName || activeDocument.client.name || "No Client Assigned"}
              </span>
            </div>
            <div className="text-right font-mono font-bold text-primary shrink-0 pl-2">
              {formatCents(calculatedTotals.totalCents)}
            </div>
          </div>

          {/* Segmented Tab Navigation Bar with Animated Pill Slider */}
          <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border/80 text-xs font-semibold select-none shrink-0 gap-1 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {/* Framer Motion Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="active-studio-tab-indicator"
                      transition={activeSpringTransition}
                      className="absolute inset-0 bg-background rounded-lg shadow-xs border border-border/60"
                    />
                  )}

                  <span className="relative z-10 flex items-center space-x-1.5">
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                        {tab.badge}
                      </span>
                    )}
                    {tab.isComplete && tab.badge === undefined && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Tab Viewport (Single-layer card with smooth scroll & animations) */}
          <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl shadow-xs p-4 sm:p-5 overflow-y-auto scrollbar-thin">
            <AnimatePresence mode="wait">
              {activeTab === "supplies" && (
                <motion.div
                  key="tab-supplies"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={activeSpringTransition}
                >
                  <LineItemsEditor
                    supplyLineItems={activeDocument.items}
                    taxRateBasisPoints={activeDocument.taxRateBasisPoints}
                    onAddSupplyLineItem={onAddSupplyLineItem}
                    onUpdateSupplyLineItem={onUpdateSupplyLineItem}
                    onRemoveSupplyLineItem={onRemoveSupplyLineItem}
                    onApplyProposedLineItems={onApplyProposedLineItems}
                  />
                </motion.div>
              )}

              {activeTab === "client" && (
                <motion.div
                  key="tab-client"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={activeSpringTransition}
                >
                  <ClientCustomerForm
                    clientCustomerRecord={activeDocument.client}
                    onUpdateClientRecord={onUpdateClientRecord}
                  />
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="tab-settings"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={activeSpringTransition}
                >
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
                </motion.div>
              )}

              {activeTab === "contractor" && (
                <motion.div
                  key="tab-contractor"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={activeSpringTransition}
                  className="space-y-6"
                >
                  <ContractorProfileForm
                    contractorProfile={contractorProfile}
                    onUpdateContractorProfile={onUpdateContractorProfile}
                  />

                  <div className="border-t border-border/80 pt-4">
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
                </motion.div>
              )}

              {activeTab === "all" && (
                <motion.div
                  key="tab-all"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={activeSpringTransition}
                  className="space-y-6"
                >
                  {/* Supplies */}
                  <div>
                    <LineItemsEditor
                      supplyLineItems={activeDocument.items}
                      taxRateBasisPoints={activeDocument.taxRateBasisPoints}
                      onAddSupplyLineItem={onAddSupplyLineItem}
                      onUpdateSupplyLineItem={onUpdateSupplyLineItem}
                      onRemoveSupplyLineItem={onRemoveSupplyLineItem}
                      onApplyProposedLineItems={onApplyProposedLineItems}
                    />
                  </div>

                  {/* Client & Destination */}
                  <div className="border-t border-border/80 pt-5">
                    <ClientCustomerForm
                      clientCustomerRecord={activeDocument.client}
                      onUpdateClientRecord={onUpdateClientRecord}
                    />
                  </div>

                  {/* Document Settings */}
                  <div className="border-t border-border/80 pt-5">
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

                  {/* Contractor Profile & Terms */}
                  <div className="border-t border-border/80 pt-5 space-y-5">
                    <ContractorProfileForm
                      contractorProfile={contractorProfile}
                      onUpdateContractorProfile={onUpdateContractorProfile}
                    />
                    <div className="border-t border-border/60 pt-4">
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Pane: Studio Document Canvas with Live Paper Effect */}
        <div className="col-span-6 xl:col-span-7 h-full min-h-0 overflow-hidden">
          <DocumentCanvas
            invoiceDocument={activeDocument}
            documentTotalCents={calculatedTotals.totalCents}
          />
        </div>
      </div>

      {/* Persistent Desktop Status Bar */}
      <StatusBar
        documentNumber={activeDocument.documentNumber}
        itemCount={activeDocument.items.length}
        calculatedTotals={calculatedTotals}
        taxRateBasisPoints={activeDocument.taxRateBasisPoints}
        persistenceStatus={persistenceStatus}
      />
    </div>
  );
};
