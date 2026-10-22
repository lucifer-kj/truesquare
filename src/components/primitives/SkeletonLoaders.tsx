import { type FC } from "react";

/**
 * Shimmer Table Row Skeleton for DocumentRegistry (Desktop view).
 */
export const DocumentRowSkeleton: FC = () => {
  return (
    <tr className="border-b border-border/60 animate-pulse">
      {/* Document Number & Type */}
      <td className="py-3.5 px-3">
        <div className="flex items-center space-x-2">
          <div className="w-20 h-4 rounded-md bg-muted/70 animate-shimmer" />
          <div className="w-14 h-4 rounded-md bg-muted/50 animate-shimmer" />
        </div>
      </td>

      {/* Status Badge */}
      <td className="py-3.5 px-2">
        <div className="w-16 h-5 rounded-full bg-muted/60 animate-shimmer" />
      </td>

      {/* Client Customer */}
      <td className="py-3.5 px-3">
        <div className="space-y-1.5">
          <div className="w-32 h-4 rounded-md bg-muted/70 animate-shimmer" />
          <div className="w-24 h-3 rounded-md bg-muted/40 animate-shimmer" />
        </div>
      </td>

      {/* Date */}
      <td className="py-3.5 px-2">
        <div className="w-20 h-3.5 rounded-md bg-muted/50 animate-shimmer" />
      </td>

      {/* Total Amount */}
      <td className="py-3.5 px-3 text-right">
        <div className="w-20 h-4 rounded-md bg-muted/80 ml-auto animate-shimmer" />
      </td>

      {/* Quick Actions */}
      <td className="py-3.5 px-2 text-right">
        <div className="flex items-center justify-end space-x-1.5">
          <div className="w-7 h-7 rounded-lg bg-muted/50 animate-shimmer" />
          <div className="w-7 h-7 rounded-lg bg-muted/50 animate-shimmer" />
          <div className="w-7 h-7 rounded-lg bg-muted/50 animate-shimmer" />
        </div>
      </td>
    </tr>
  );
};

/**
 * Shimmer Card Skeleton for DocumentRegistry (Mobile view).
 */
export const DocumentCardSkeleton: FC = () => {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-card/40 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-muted/70 animate-shimmer" />
          <div className="space-y-1">
            <div className="w-24 h-3.5 rounded bg-muted/70 animate-shimmer" />
            <div className="w-14 h-2.5 rounded bg-muted/40 animate-shimmer" />
          </div>
        </div>
        <div className="w-16 h-5 rounded-full bg-muted/60 animate-shimmer" />
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <div className="space-y-1">
          <div className="w-28 h-3.5 rounded bg-muted/70 animate-shimmer" />
          <div className="w-20 h-2.5 rounded bg-muted/40 animate-shimmer" />
        </div>
        <div className="text-right space-y-1">
          <div className="w-16 h-4 rounded bg-muted/80 ml-auto animate-shimmer" />
          <div className="w-14 h-2.5 rounded bg-muted/40 ml-auto animate-shimmer" />
        </div>
      </div>

      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1">
        <div className="w-16 h-6 rounded-lg bg-muted/60 animate-shimmer" />
        <div className="flex space-x-1">
          <div className="w-7 h-7 rounded-lg bg-muted/50 animate-shimmer" />
          <div className="w-7 h-7 rounded-lg bg-muted/50 animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

/**
 * Shimmer KPI Card Skeleton for KpiOverviewCards.
 */
export const KpiCardSkeleton: FC = () => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card/60 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-24 h-3.5 rounded-md bg-muted/60 animate-shimmer" />
        <div className="w-8 h-8 rounded-xl bg-muted/50 animate-shimmer" />
      </div>
      <div className="w-32 h-7 rounded-lg bg-muted/80 animate-shimmer" />
      <div className="w-28 h-3 rounded-md bg-muted/40 animate-shimmer" />
    </div>
  );
};

/**
 * Shimmer Canvas Skeleton for DocumentCanvas (Vector PDF preview pane).
 */
export const DocumentCanvasSkeleton: FC = () => {
  return (
    <div className="w-full max-w-[816px] aspect-[8.5/11] bg-card border border-border/80 rounded-xl shadow-2xl p-8 sm:p-12 flex flex-col justify-between space-y-6 animate-pulse select-none">
      {/* Top Header */}
      <div className="flex items-start justify-between border-b border-border/60 pb-8">
        <div className="space-y-3">
          <div className="w-36 h-6 rounded-lg bg-muted/80 animate-shimmer" />
          <div className="w-48 h-3.5 rounded bg-muted/50 animate-shimmer" />
          <div className="w-40 h-3.5 rounded bg-muted/40 animate-shimmer" />
        </div>
        <div className="text-right space-y-3">
          <div className="w-28 h-7 rounded-lg bg-muted/70 ml-auto animate-shimmer" />
          <div className="w-24 h-3.5 rounded bg-muted/50 ml-auto animate-shimmer" />
        </div>
      </div>

      {/* Line Items Table Skeleton */}
      <div className="flex-1 space-y-4 pt-4">
        <div className="w-full h-8 rounded-lg bg-muted/60 animate-shimmer" />
        {[1, 2, 3, 4].map((rowIndex) => (
          <div key={rowIndex} className="flex items-center justify-between py-2 border-b border-border/40">
            <div className="w-1/2 space-y-1.5">
              <div className="w-44 h-4 rounded bg-muted/70 animate-shimmer" />
              <div className="w-32 h-3 rounded bg-muted/40 animate-shimmer" />
            </div>
            <div className="w-16 h-4 rounded bg-muted/50 animate-shimmer" />
            <div className="w-20 h-4 rounded bg-muted/60 animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Bottom Totals & Terms */}
      <div className="border-t border-border/60 pt-6 flex items-end justify-between">
        <div className="w-1/2 space-y-2">
          <div className="w-24 h-3.5 rounded bg-muted/60 animate-shimmer" />
          <div className="w-64 h-3 rounded bg-muted/40 animate-shimmer" />
          <div className="w-48 h-3 rounded bg-muted/40 animate-shimmer" />
        </div>
        <div className="w-44 space-y-2">
          <div className="flex justify-between">
            <div className="w-16 h-3 rounded bg-muted/50 animate-shimmer" />
            <div className="w-14 h-3 rounded bg-muted/50 animate-shimmer" />
          </div>
          <div className="flex justify-between">
            <div className="w-16 h-3 rounded bg-muted/50 animate-shimmer" />
            <div className="w-14 h-3 rounded bg-muted/50 animate-shimmer" />
          </div>
          <div className="flex justify-between pt-2 border-t border-border/60">
            <div className="w-16 h-5 rounded bg-muted/80 animate-shimmer" />
            <div className="w-20 h-5 rounded bg-muted/80 animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};
