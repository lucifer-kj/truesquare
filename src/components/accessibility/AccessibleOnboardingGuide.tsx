import { useState, type FC } from "react";
import { HelpCircle, X, Sparkles, FileText, Printer, CheckCircle } from "lucide-react";

interface AccessibleOnboardingGuideProps {
  onDismissGuide?: () => void;
}

const STORAGE_KEY_ONBOARDING_DISMISSED = "buildbill:v1:onboarding_dismissed";

export const AccessibleOnboardingGuide: FC<AccessibleOnboardingGuideProps> = ({
  onDismissGuide,
}) => {
  const [guideVisibleState, setGuideVisibleState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ONBOARDING_DISMISSED) !== "true";
    } catch {
      return true;
    }
  });

  const handleDismissPermanently = () => {
    setGuideVisibleState(false);
    try {
      localStorage.setItem(STORAGE_KEY_ONBOARDING_DISMISSED, "true");
    } catch {
      // Ignore in private browsing
    }
    onDismissGuide?.();
  };

  if (!guideVisibleState) {
    return null;
  }

  return (
    <section
      role="region"
      aria-label="New User Quick Start Guide and Accessibility Hints"
      className="bg-sky-950/40 text-sky-100 border border-sky-800/80 rounded-xl p-4 shadow-md transition-all relative"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-300">
            Quick Start &amp; Accessibility Guide
          </h2>
        </div>
        <button
          type="button"
          onClick={handleDismissPermanently}
          className="text-sky-400 hover:text-white p-1 rounded-md transition-colors"
          aria-label="Dismiss quick start guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-sky-200 mt-1 mb-3">
        Welcome to BuildBill! This client-side tool creates single-page Pro Forma estimates and tax invoices with instant vector PDF generation and zero data tracking.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-sky-900/40 border border-sky-800/60 rounded-lg p-2.5">
          <div className="flex items-center space-x-1.5 font-bold text-sky-200 mb-1">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>1. Configure Document</span>
          </div>
          <p className="text-[11px] text-sky-300/80 leading-relaxed">
            Toggle between Pro Forma Estimate &amp; Commercial Tax Invoice. Enter your client and use <strong>Smart Location Autocomplete</strong> for 1-click address entry.
          </p>
        </div>

        <div className="bg-sky-900/40 border border-sky-800/60 rounded-lg p-2.5">
          <div className="flex items-center space-x-1.5 font-bold text-sky-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Supplies &amp; Budget</span>
          </div>
          <p className="text-[11px] text-sky-300/80 leading-relaxed">
            Search 112 offline construction supplies, or launch the <strong>Automatic Budget Engine</strong> to compose line items capped under your target budget.
          </p>
        </div>

        <div className="bg-sky-900/40 border border-sky-800/60 rounded-lg p-2.5">
          <div className="flex items-center space-x-1.5 font-bold text-sky-200 mb-1">
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. 1-Page Vector PDF</span>
          </div>
          <p className="text-[11px] text-sky-300/80 leading-relaxed">
            Review the live responsive preview. Click <strong>Export PDF</strong> (or press <kbd className="px-1 py-0.5 bg-sky-950 rounded border border-sky-700 text-[10px] font-mono">Alt+P</kbd>) to save as a calibrated single-page vector document.
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-sky-800/50 flex flex-wrap items-center justify-between text-[11px] text-sky-300">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Screen-reader friendly with high-contrast text and keyboard tab order navigation.</span>
        </div>
        <button
          type="button"
          onClick={handleDismissPermanently}
          className="text-sky-300 hover:text-white underline font-semibold mt-1 sm:mt-0"
        >
          Got it, dismiss guide
        </button>
      </div>
    </section>
  );
};
