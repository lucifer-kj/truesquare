import React, { Component, type ReactNode } from "react";
import { HardHat, RotateCw, Home, DownloadCloud, AlertTriangle } from "lucide-react";
import { downloadVaultBackupFile } from "../../services/indexeddb-repository";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasEncounteredCrash: boolean;
  sanitizedErrorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasEncounteredCrash: false,
      sanitizedErrorMessage: "",
    };
  }

  public static getDerivedStateFromError(encounteredError: Error): ErrorBoundaryState {
    return {
      hasEncounteredCrash: true,
      sanitizedErrorMessage: encounteredError.message || "An unexpected rendering fault occurred.",
    };
  }

  public componentDidCatch(encounteredError: Error, errorMetadata: React.ErrorInfo): void {
    // In strict adherence to Rule 8 (Zero Telemetry), logs are retained strictly in local browser console
    console.error("[TrueSquare ErrorBoundary]", encounteredError, errorMetadata);
  }

  private handleReloadStudio = (): void => {
    window.location.reload();
  };

  private handleReturnToHub = (): void => {
    window.location.href = window.location.origin;
  };

  private handleEmergencyExport = async (): Promise<void> => {
    try {
      await downloadVaultBackupFile();
    } catch (exportError) {
      console.error("[BuildBill ErrorBoundary] Emergency export failed:", exportError);
    }
  };

  public render(): ReactNode {
    if (this.state.hasEncounteredCrash) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 selection:bg-amber-500 selection:text-zinc-950">
          <div className="w-full max-w-xl bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-500 shadow-inner">
              <HardHat className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Studio Safety Shield Triggered</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-2">
              The Workspace Encountered an Unexpected State
            </h1>

            <p className="text-sm text-zinc-400 mb-6 max-w-md leading-relaxed">
              Don't worry — your invoice documents, client contacts, and catalogue estimates remain safely secured in your browser's encrypted local repository.
            </p>

            {/* Sanitized Fault Display */}
            <div className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 mb-6 text-left">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                Diagnostic Indicator
              </div>
              <div className="text-xs font-mono text-amber-400/90 break-words">
                {this.state.sanitizedErrorMessage}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReloadStudio}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]"
              >
                <RotateCw className="w-4 h-4" />
                <span>Reload Studio</span>
              </button>

              <button
                type="button"
                onClick={this.handleReturnToHub}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition-all active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                <span>Return to Hub</span>
              </button>
            </div>

            {/* Emergency Vault Backup */}
            <div className="mt-6 pt-6 border-t border-zinc-800/80 w-full flex items-center justify-between text-left">
              <div className="text-xs text-zinc-500">
                <span className="font-medium text-zinc-400">Need your records?</span> Download offline backup snapshot now.
              </div>
              <button
                type="button"
                onClick={this.handleEmergencyExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-colors"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-amber-500" />
                <span>Export Backup</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
