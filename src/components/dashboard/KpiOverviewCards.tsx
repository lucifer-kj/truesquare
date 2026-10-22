import { type FC } from "react";
import { motion } from "motion/react";
import { DollarSign, Clock, FileSpreadsheet, Users } from "lucide-react";
import { formatCents } from "@/domain/money";
import type { DashboardKpiMetrics } from "@/domain/types";
import { useAccessibleMotion } from "@/design-system";
import { KpiCardSkeleton } from "@/components/primitives/SkeletonLoaders";

export interface KpiOverviewCardsProps {
  kpiMetrics: DashboardKpiMetrics;
  isLoading?: boolean;
}

export const KpiOverviewCards: FC<KpiOverviewCardsProps> = ({ kpiMetrics, isLoading = false }) => {
  const activeSpringTransition = useAccessibleMotion("productive");

  const kpiCardDefinitions = [
    {
      title: "Total Invoiced",
      value: formatCents(kpiMetrics.totalInvoicedCents),
      subtitle:
        kpiMetrics.outstandingReceivableCents > 0
          ? `${kpiMetrics.paidInvoicesCount} paid · ${formatCents(kpiMetrics.outstandingReceivableCents)} pending`
          : `${kpiMetrics.paidInvoicesCount} paid · all settled`,
      icon: DollarSign,
      accentBorder: "border-emerald-500/30",
      accentBg: "bg-emerald-500/10",
      accentText: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Outstanding Receivables",
      value: formatCents(kpiMetrics.outstandingReceivableCents),
      subtitle: "Awaiting contractor payment",
      icon: Clock,
      accentBorder: "border-amber-500/30",
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Active Estimates",
      value: formatCents(kpiMetrics.activeEstimatesCents),
      subtitle: `${kpiMetrics.activeEstimatesCount} pending quote${kpiMetrics.activeEstimatesCount === 1 ? "" : "s"}`,
      icon: FileSpreadsheet,
      accentBorder: "border-sky-500/30",
      accentBg: "bg-sky-500/10",
      accentText: "text-sky-600 dark:text-sky-400",
    },
    {
      title: "Total Clients",
      value: kpiMetrics.totalClientsCount.toString(),
      subtitle: "Registered contractor accounts",
      icon: Users,
      accentBorder: "border-indigo-500/30",
      accentBg: "bg-indigo-500/10",
      accentText: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((placeholderIndex) => (
          <KpiCardSkeleton key={placeholderIndex} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {kpiCardDefinitions.map((kpiCard, cardIndex) => {
        const CardIcon = kpiCard.icon;

        return (
          <motion.div
            key={kpiCard.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...activeSpringTransition,
              delay: cardIndex * 0.05,
            }}
            className="p-3.5 sm:p-4 rounded-xl border border-border bg-card shadow-xs hover:border-border/80 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 pb-1">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">
                {kpiCard.title}
              </span>
              <div
                className={`w-7 h-7 rounded-lg ${kpiCard.accentBg} ${kpiCard.accentBorder} border flex items-center justify-center shrink-0`}
              >
                <CardIcon className={`w-3.5 h-3.5 ${kpiCard.accentText}`} />
              </div>
            </div>

            <div className="mt-1">
              <div className="text-lg sm:text-2xl font-extrabold tracking-tight text-foreground font-mono">
                {kpiCard.value}
              </div>
              <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                {kpiCard.subtitle}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
