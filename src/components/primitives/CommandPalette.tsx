import { useState, useEffect, useRef, useMemo, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  FilePlus,
  Printer,
  FileText,
  Building2,
  PackagePlus,
  X,
  Keyboard,
} from "lucide-react";
import { searchConstructionCatalog } from "@/services/catalog-service";
import { searchLocationSuggestions, type GeographicLocationPreset } from "@/services/location-autocomplete-service";
import { convertCatalogProductToLineItem } from "@/domain/budget-proposal";
import { formatCents } from "@/domain/money";
import type {
  CatalogSupplyProduct,
  DocumentClassificationType,
  ClientCustomerRecord,
  SupplyLineItem,
} from "@/domain/types";
import { useAccessibleMotion } from "@/design-system";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentClassificationType;
  onUpdateDocumentType: (type: DocumentClassificationType) => void;
  onAddSupplyLineItem: (item: SupplyLineItem) => void;
  onUpdateClientRecord: (client: ClientCustomerRecord) => void;
  onStartNewBlankDocument: () => void;
  onTriggerExportPdf: () => void;
}

export const CommandPalette: FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  documentType,
  onUpdateDocumentType,
  onAddSupplyLineItem,
  onUpdateClientRecord,
  onStartNewBlankDocument,
  onTriggerExportPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const activeSpringTransition = useAccessibleMotion("productive");

  // Focus input whenever palette is opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll while palette is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Compute filtered search results across catalog, locations, and system actions
  const matchedCatalogProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return searchConstructionCatalog({ onlyActiveProducts: true }).slice(0, 5);
    }
    return searchConstructionCatalog({ searchQueryText: searchQuery }).slice(0, 6);
  }, [searchQuery]);

  const matchedLocations = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    return searchLocationSuggestions(searchQuery).slice(0, 3);
  }, [searchQuery]);

  const handleSelectCatalogProduct = (product: CatalogSupplyProduct) => {
    const newLineItem = convertCatalogProductToLineItem(product, 1);
    onAddSupplyLineItem(newLineItem);
    onClose();
  };

  const handleSelectLocationPreset = (preset: GeographicLocationPreset) => {
    onUpdateClientRecord({
      id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      name: preset.namedLocationTitle,
      companyName: preset.namedLocationTitle,
      addressLines: preset.streetAddressLine ? [preset.streetAddressLine] : [],
      city: preset.city,
      region: preset.region,
      postalCode: preset.postalCode,
      country: preset.country,
      phone: "",
      email: "",
    });
    onClose();
  };

  const handleToggleDocType = () => {
    const nextType: DocumentClassificationType = documentType === "estimate" ? "invoice" : "estimate";
    onUpdateDocumentType(nextType);
    onClose();
  };

  const handleTriggerExport = () => {
    onClose();
    setTimeout(() => {
      onTriggerExportPdf();
    }, 100);
  };

  const handleStartNewDraft = () => {
    onStartNewBlankDocument();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={activeSpringTransition}
            className="relative z-10 w-full max-w-2xl bg-card text-card-foreground border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Top Search Header Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-muted/40">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
                placeholder="Search catalog supplies, locations, or actions... (Esc to close)"
                className="flex-1 bg-transparent border-0 text-sm focus:outline-none placeholder:text-muted-foreground text-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                Esc
              </kbd>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
              {/* Quick Actions Group */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Quick Actions</span>
                </div>
                <div className="space-y-1">
                  <div
                    onClick={handleStartNewDraft}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FilePlus className="w-4 h-4 text-sky-600" />
                      <span className="font-semibold text-foreground">Create New Draft</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Reset canvas</span>
                  </div>

                  <div
                    onClick={handleToggleDocType}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-foreground">
                        Switch to {documentType === "estimate" ? "Tax Invoice" : "Pro Forma Estimate"}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Toggle classification</span>
                  </div>

                  <div
                    onClick={handleTriggerExport}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Printer className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-foreground">Export 1-Page Vector PDF</span>
                    </div>
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Alt+P
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Geographic Hubs / Clients Group */}
              {matchedLocations.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>US Jobsite &amp; Client Hubs</span>
                  </div>
                  <div className="space-y-1">
                    {matchedLocations.map((locationPreset) => (
                      <div
                        key={`${locationPreset.namedLocationTitle}-${locationPreset.postalCode}`}
                        onClick={() => handleSelectLocationPreset(locationPreset)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Building2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block">
                              {locationPreset.namedLocationTitle}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {locationPreset.streetAddressLine ? `${locationPreset.streetAddressLine}, ` : ""}
                              {locationPreset.city}, {locationPreset.region} {locationPreset.postalCode}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                          {locationPreset.region}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Construction Catalog Supplies Group */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>
                    {searchQuery.trim() ? "Matching Supplies (1-Click Add)" : "Frequently Used Building Supplies"}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {matchedCatalogProducts.length} items
                  </span>
                </div>
                <div className="space-y-1">
                  {matchedCatalogProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectCatalogProduct(product)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <PackagePlus className="w-4 h-4 text-primary flex-shrink-0 group-hover:text-primary transition-colors" />
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground truncate block">
                            {product.productName}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">
                            {product.specification} · {product.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                        <span className="font-mono font-bold text-foreground">
                          {formatCents(product.unitPriceCents)}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Keyboard Hint Bar */}
            <div className="px-4 py-2 bg-muted/60 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground select-none">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Use shortcuts:</span>
                </span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-background border border-border text-[10px] font-mono">
                    Ctrl+K
                  </kbd>{" "}
                  Open Palette
                </span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-background border border-border text-[10px] font-mono">
                    Alt+P
                  </kbd>{" "}
                  Export PDF
                </span>
              </div>
              <span className="hidden sm:inline text-muted-foreground">Click item to insert directly</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
