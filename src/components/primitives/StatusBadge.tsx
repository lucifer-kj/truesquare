import { type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileEdit, Send, CheckCircle2, AlertCircle, BookmarkCheck } from "lucide-react";
import { useAccessibleMotion } from "@/design-system";
import type { DocumentLifecycleStatus } from "@/domain/types";
import { Tooltip } from "./Tooltip";

export type { DocumentLifecycleStatus };

export interface StatusBadgeProps {
  status: DocumentLifecycleStatus;
  className?: string;
}

const STATUS_DESCRIPTIONS: Record<DocumentLifecycleStatus, string> = {
  draft: "Editable workspace draft (not yet sent)",
  saved: "Archived in local encrypted vault",
  issued: "Delivered to client; awaiting payment",
  paid: "Payment reconciled in full",
  overdue: "Past due date; requires follow-up",
};

const STATUS_CONFIGS: Record<
  DocumentLifecycleStatus,
  { label: string; bgClass: string; textClass: string; icon: typeof FileEdit }
> = {
  draft: {
    label: "Draft",
    bgClass: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    textClass: "text-slate-700 dark:text-slate-300",
    icon: FileEdit,
  },
  saved: {
    label: "Saved",
    bgClass: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    textClass: "text-slate-700 dark:text-slate-300",
    icon: BookmarkCheck,
  },
  issued: {
    label: "Issued",
    bgClass: "bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800",
    textClass: "text-sky-700 dark:text-sky-300",
    icon: Send,
  },
  paid: {
    label: "Paid",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
    textClass: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  overdue: {
    label: "Overdue",
    bgClass: "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
    textClass: "text-rose-700 dark:text-rose-300",
    icon: AlertCircle,
  },
};

export const StatusBadge: FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const currentConfig = STATUS_CONFIGS[status] || STATUS_CONFIGS.draft;
  const StatusIcon = currentConfig.icon;
  const activeSpringTransition = useAccessibleMotion("micro");

  return (
    <Tooltip content={STATUS_DESCRIPTIONS[status] || "Document Status"} position="top">
      <span
        className={`relative inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border overflow-hidden select-none cursor-help ${currentConfig.bgClass} ${currentConfig.textClass} ${className}`}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={status}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={activeSpringTransition}
            className="flex items-center gap-1"
          >
            <StatusIcon className="w-3 h-3 flex-shrink-0" />
            <span>{currentConfig.label}</span>
          </motion.span>
        </AnimatePresence>
      </span>
    </Tooltip>
  );
};
