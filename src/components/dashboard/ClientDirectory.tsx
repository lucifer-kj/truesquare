import { type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Search, Phone, Mail, MapPin, Plus, FileText } from "lucide-react";
import { formatCents } from "@/domain/money";
import type { ClientDirectoryRecord } from "@/domain/types";
import { useAccessibleMotion } from "@/design-system";

export interface ClientDirectoryProps {
  clientRecords: ClientDirectoryRecord[];
  searchQuery: string;
  onSearchQueryChange: (updatedQueryText: string) => void;
  onCreateDocumentForClient: (
    clientRecord: ClientDirectoryRecord,
    documentType: "estimate" | "invoice"
  ) => void;
  isLoading?: boolean;
}

export const ClientDirectory: FC<ClientDirectoryProps> = ({
  clientRecords,
  searchQuery,
  onSearchQueryChange,
  onCreateDocumentForClient,
  isLoading = false,
}) => {
  const activeSpringTransition = useAccessibleMotion("productive");

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Client Directory</h3>
            <p className="text-[11px] text-muted-foreground">
              {clientRecords.length} contractor account{clientRecords.length === 1 ? "" : "s"} on file
            </p>
          </div>
        </div>

        <div className="relative min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(changeEvent) => onSearchQueryChange(changeEvent.target.value)}
            placeholder="Search clients by name, company, email..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 py-2">
          {[1, 2, 3].map((placeholderIndex) => (
            <div
              key={placeholderIndex}
              className="h-28 rounded-xl border border-border bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : clientRecords.length === 0 ? (
        /* Empty State */
        <div className="p-8 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground bg-muted/10 space-y-3">
          <Users className="w-8 h-8 text-muted-foreground mx-auto" />
          <div>
            <h4 className="text-xs font-bold text-foreground">No Clients Found</h4>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto mt-1">
              Clients are automatically registered when you draft and save estimates or invoices.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() =>
                onCreateDocumentForClient(
                  {
                    id: `client-${Date.now()}`,
                    name: "New Client",
                    companyName: "",
                    email: "",
                    phone: "",
                    addressLines: [],
                    city: "",
                    region: "",
                    postalCode: "",
                    country: "USA",
                    totalBilledCents: 0,
                    documentCount: 0,
                    lastDocumentDate: new Date().toISOString().split("T")[0],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  "estimate"
                )
              }
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draft Estimate for New Client</span>
            </button>
          </div>
        </div>
      ) : (
        /* Client Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {clientRecords.map((clientRecord) => (
              <motion.div
                key={clientRecord.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={activeSpringTransition}
                className="p-3.5 rounded-xl border border-border bg-card/60 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-foreground truncate">
                        {clientRecord.name}
                      </h4>
                      {clientRecord.companyName && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {clientRecord.companyName}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-foreground">
                        {formatCents(clientRecord.totalBilledCents)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        {clientRecord.documentCount} job{clientRecord.documentCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                    {clientRecord.phone && (
                      <div className="flex items-center space-x-1.5 truncate">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span className="truncate">{clientRecord.phone}</span>
                      </div>
                    )}
                    {clientRecord.email && (
                      <div className="flex items-center space-x-1.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{clientRecord.email}</span>
                      </div>
                    )}
                    {clientRecord.city && (
                      <div className="flex items-center space-x-1.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {clientRecord.city}
                          {clientRecord.region ? `, ${clientRecord.region}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: 1-Click Document Creation */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {clientRecord.lastDocumentDate
                      ? `Last: ${clientRecord.lastDocumentDate}`
                      : "New Client"}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onCreateDocumentForClient(clientRecord, "estimate")}
                      className="px-2 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                      title="New Estimate for this client"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Estimate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onCreateDocumentForClient(clientRecord, "invoice")}
                      className="px-2 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-[11px] font-semibold flex items-center space-x-1 transition-colors shadow-xs"
                      title="New Invoice for this client"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Invoice</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
