import { useState, useRef, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HardHat,
  Search,
  ArrowLeft,
  LayoutDashboard,
  Lock,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Download,
  LogOut,
} from "lucide-react";
import type { DocumentClassificationType } from "@/domain/types";
import { downloadVaultBackupFile } from "@/services/indexeddb-repository";
import { StatusBadge, type DocumentLifecycleStatus } from "@/components/primitives/StatusBadge";
import { Tooltip } from "@/components/primitives/Tooltip";
import { useAccessibleMotion } from "@/design-system";

export interface CommandBarProps {
  documentType: DocumentClassificationType;
  documentNumber: string;
  documentStatus?: DocumentLifecycleStatus;
  persistenceStatus: "idle" | "saving" | "saved" | "error";
  activeView?: "dashboard" | "editor";
  onNavigateToDashboard?: () => void;
  onNavigateToEditor?: () => void;
  onLockSession?: () => void;
  onStartNewBlankDocument: () => void;
  onCreateNewDocument?: (documentType: DocumentClassificationType) => void;
  onUpdateDocumentType?: (documentType: DocumentClassificationType) => void;
  onTriggerExportPdf: () => void;
  onOpenCommandPalette?: () => void;
  userProfile?: { name: string; email: string; isGuest?: boolean } | null;
  onSignOut?: () => void;
}

export const CommandBar: FC<CommandBarProps> = ({
  documentType,
  documentNumber,
  documentStatus = "draft",
  persistenceStatus,
  activeView = "dashboard",
  onNavigateToDashboard,
  onNavigateToEditor,
  onLockSession,
  onStartNewBlankDocument,
  onCreateNewDocument,
  onUpdateDocumentType,
  onTriggerExportPdf,
  onOpenCommandPalette,
  userProfile,
  onSignOut,
}) => {
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState<boolean>(false);
  const actionsDropdownRef = useRef<HTMLDivElement | null>(null);
  const activeSpringTransition = useAccessibleMotion("productive");

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (mouseEvent: MouseEvent) => {
      if (
        actionsDropdownRef.current &&
        !actionsDropdownRef.current.contains(mouseEvent.target as Node)
      ) {
        setIsActionsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleCreateDocument = (type: DocumentClassificationType) => {
    setIsActionsDropdownOpen(false);
    if (onCreateNewDocument) {
      onCreateNewDocument(type);
    } else {
      onStartNewBlankDocument();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 py-2 flex items-center justify-between shadow-2xs select-none">
      {/* Left: Brand Identity & Document Context */}
      <div className="flex items-center space-x-3">
        {/* Hub / Back Navigation */}
        {activeView === "editor" ? (
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border text-xs font-semibold transition-all hover:border-border/80 active:scale-95"
            title="Return to Hub Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold">Hub</span>
          </button>
        ) : (
          <div
            onClick={onNavigateToDashboard}
            className="flex items-center space-x-2 cursor-pointer group"
            title="TrueSquare Hub"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs group-hover:bg-primary/90 transition-colors">
              <HardHat className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-foreground">
                  TrueSquare
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                  Studio
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View Switcher Tabs (Dashboard View) */}
        {activeView === "dashboard" ? (
          <div className="flex items-center space-x-1 pl-2 border-l border-border">
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Hub Dashboard</span>
            </button>
            {onNavigateToEditor && (
              <button
                type="button"
                onClick={onNavigateToEditor}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
              >
                <span>Draft Studio</span>
              </button>
            )}
          </div>
        ) : (
          /* Document Identifier & Type Pill (Editor View) */
          <div className="flex items-center space-x-2 pl-2 border-l border-border">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-muted border border-border text-foreground shadow-2xs">
              {documentNumber}
            </span>

            {/* Interactive Document Type Toggle Pill */}
            {onUpdateDocumentType ? (
              <button
                type="button"
                onClick={() =>
                  onUpdateDocumentType(documentType === "estimate" ? "invoice" : "estimate")
                }
                title={`Click to switch to ${documentType === "estimate" ? "Invoice" : "Estimate"}`}
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md transition-all flex items-center space-x-1 ${
                  documentType === "invoice"
                    ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 hover:bg-sky-100"
                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100"
                }`}
              >
                <span>{documentType === "invoice" ? "Invoice" : "Estimate"}</span>
                <span className="text-[8px] opacity-60">⇄</span>
              </button>
            ) : (
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                  documentType === "invoice"
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {documentType === "invoice" ? "Invoice" : "Estimate"}
              </span>
            )}

            <StatusBadge status={documentStatus} />
          </div>
        )}
      </div>

      {/* Center: Clean Quick Search Pill (Desktop - Editor only to avoid duplicate on Dashboard) */}
      {activeView === "editor" ? (
        <div className="hidden lg:flex items-center">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted border border-border/70 text-xs text-muted-foreground hover:text-foreground transition-all shadow-2xs group hover:border-border"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium">Quick Catalog &amp; Actions</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>
      ) : (
        <div className="hidden lg:flex items-center text-xs text-muted-foreground/80 font-medium">
          <span className="font-mono text-[11px] bg-muted/50 px-2.5 py-1 rounded-md border border-border/60 text-muted-foreground">
            Encrypted Offline Vault · BuildBill Hub
          </span>
        </div>
      )}

      {/* Right: Autosave Status, Drop-box Menu & Primary CTA */}
      <div className="flex items-center space-x-2">
        {/* Persistence Status */}
        {activeView === "editor" && (
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-muted-foreground pr-2 border-r border-border">
            <span
              className={`w-2 h-2 rounded-full ${
                persistenceStatus === "saving" ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              {persistenceStatus === "saving" ? "Saving..." : "Saved"}
            </span>
          </div>
        )}

        {/* Drop-box Actions Menu (Visible in Editor) */}
        {activeView === "editor" && (
          <div className="relative" ref={actionsDropdownRef}>
            <button
              type="button"
              onClick={() => setIsActionsDropdownOpen((prevState) => !prevState)}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg font-medium transition-colors shadow-2xs"
              title="Document Options"
            >
              <span>Actions</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {/* Animated Drop-box Popover */}
            <AnimatePresence>
              {isActionsDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={activeSpringTransition}
                  className="absolute right-0 top-full mt-1.5 w-52 bg-popover text-popover-foreground border border-border rounded-xl shadow-lg p-1.5 z-50 space-y-1"
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

                  <div className="border-t border-border my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsDropdownOpen(false);
                      onOpenCommandPalette?.();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted text-left transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Budget Allocator</span>
                    </div>
                    <kbd className="text-[9px] font-mono opacity-60">Ctrl+K</kbd>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsActionsDropdownOpen(false);
                      await downloadVaultBackupFile();
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted text-left transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span>Export Vault Backup</span>
                  </button>

                  {onLockSession && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        onLockSession();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted text-left transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Vault Session</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Lock Vault Icon Button (Shown on Dashboard) */}
        {activeView === "dashboard" && onLockSession && (
          <Tooltip content="Lock vault session" position="bottom">
            <button
              type="button"
              onClick={onLockSession}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              aria-label="Lock Vault"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}

        {/* User Profile Pill & Sign Out */}
        {userProfile && (
          <div className="flex items-center space-x-1.5 pl-2 border-l border-border">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg border border-border/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-foreground max-w-[110px] truncate" title={userProfile.email}>
                {userProfile.name}
              </span>
              {userProfile.isGuest && (
                <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1 py-0.2 rounded font-mono font-bold">
                  OFFLINE
                </span>
              )}
            </div>
            {onSignOut && (
              <Tooltip content="Sign Out" position="bottom">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
        )}

        {/* Primary Download PDF Button (Shown in Editor) */}
        {activeView === "editor" && (
          <Tooltip content="Direct automatic PDF file download" shortcut="Alt+P" position="bottom">
            <button
              type="button"
              onClick={onTriggerExportPdf}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all shadow-xs active:scale-95"
              aria-label="Direct Download PDF Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
              <span className="hidden md:inline text-[10px] opacity-75 font-mono">Alt+P</span>
            </button>
          </Tooltip>
        )}
      </div>
    </header>
  );
};
