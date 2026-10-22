import { useState, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import type {
  SupplyLineItem,
  CatalogSupplyProduct,
  BuildingTradeCategory,
} from "@/domain/types";
import {
  searchConstructionCatalog,
  LOCAL_CONSTRUCTION_CATALOG,
} from "@/services/catalog-service";
import {
  convertCatalogProductToLineItem,
  generateBudgetProposal,
} from "@/domain/budget-proposal";
import { JOB_PRESETS } from "@/data/job-presets";
import { formatCents, parseCurrencyToCents } from "@/domain/money";
import { calculateLineTotalCents } from "@/domain/calculations";
import {
  PackagePlus,
  Trash2,
  Search,
  Sparkles,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

interface LineItemsEditorProps {
  supplyLineItems: SupplyLineItem[];
  taxRateBasisPoints: number;
  onAddSupplyLineItem: (newSupplyItem: SupplyLineItem) => void;
  onUpdateSupplyLineItem: (
    supplyItemId: string,
    supplyItemUpdates: Partial<SupplyLineItem>
  ) => void;
  onRemoveSupplyLineItem: (supplyItemId: string) => void;
  onApplyProposedLineItems: (
    proposedLineItems: SupplyLineItem[],
    targetBudgetCents: number
  ) => void;
}

export const LineItemsEditor: FC<LineItemsEditorProps> = ({
  supplyLineItems,
  taxRateBasisPoints,
  onAddSupplyLineItem,
  onUpdateSupplyLineItem,
  onRemoveSupplyLineItem,
  onApplyProposedLineItems,
}) => {
  // Catalog search state
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>("");
  const [selectedTradeCategory, setSelectedTradeCategory] = useState<
    BuildingTradeCategory | "all"
  >("all");
  const [catalogDrawerOpenState, setCatalogDrawerOpenState] = useState<boolean>(false);

  // Budget assistant state
  const [budgetModalOpenState, setBudgetModalOpenState] = useState<boolean>(false);
  const [targetBudgetInputDollars, setTargetBudgetInputDollars] = useState<string>("3500");
  const [selectedJobPresetId, setSelectedJobPresetId] = useState<string>("drywall");

  const matchingCatalogProducts = searchConstructionCatalog({
    searchQueryText: catalogSearchQuery,
    tradeCategoryFilter: selectedTradeCategory,
  }).slice(0, 8);

  const handleSelectCatalogProduct = (catalogProduct: CatalogSupplyProduct) => {
    const freshLineItem = convertCatalogProductToLineItem(catalogProduct, 1);
    onAddSupplyLineItem(freshLineItem);
    setCatalogDrawerOpenState(false);
    setCatalogSearchQuery("");
  };

  const handleAddBlankCustomItem = () => {
    const blankSupplyItem: SupplyLineItem = {
      id: `custom-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: "Custom Construction Supply / Labor",
      specification: "",
      unit: "Piece",
      quantity: 1,
      unitPriceCents: 1000, // $10.00 default
      taxable: true,
    };
    onAddSupplyLineItem(blankSupplyItem);
  };

  const handleExecuteBudgetProposal = () => {
    const targetCents = parseCurrencyToCents(targetBudgetInputDollars);
    if (targetCents <= 0) return;

    const budgetProposal = generateBudgetProposal({
      targetBudgetTotalCents: targetCents,
      jobPresetId: selectedJobPresetId,
      catalogProducts: LOCAL_CONSTRUCTION_CATALOG,
      taxRateBasisPoints,
    });

    if (budgetProposal.suggestedLineItems.length > 0) {
      onApplyProposedLineItems(budgetProposal.suggestedLineItems, targetCents);
      setBudgetModalOpenState(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Line Items Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <PackagePlus className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight">
            Supply Line Items ({supplyLineItems.length})
          </h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
              supplyLineItems.length > 6
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {supplyLineItems.length > 6
              ? `${supplyLineItems.length} items (may break page)`
              : "Single-page (≤6)"}
          </span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Budget Wizard trigger */}
          <button
            type="button"
            onClick={() => setBudgetModalOpenState(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Budget Engine</span>
          </button>

          {/* Catalog search drawer trigger */}
          <button
            type="button"
            onClick={() => setCatalogDrawerOpenState((prevState) => !prevState)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find Catalog Product</span>
          </button>
        </div>
      </div>

      {/* Catalog Dropdown Drawer */}
      {catalogDrawerOpenState && (
        <div className="p-3 bg-muted/70 rounded-lg border border-border space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px] relative">
              <input
                type="text"
                value={catalogSearchQuery}
                onChange={(changeEvent) => setCatalogSearchQuery(changeEvent.target.value)}
                placeholder="Search catalog by name, brand, or SKU..."
                className="w-full text-xs pl-7 pr-3 py-1.5 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2" />
            </div>

            <select
              value={selectedTradeCategory}
              onChange={(changeEvent) =>
                setSelectedTradeCategory(
                  changeEvent.target.value as BuildingTradeCategory | "all"
                )
              }
              aria-label="Filter by Trade Category"
              className="text-xs px-2.5 py-1.5 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Trade Categories</option>
              <option value="drywall">Drywall</option>
              <option value="lumber">Lumber / Framing</option>
              <option value="concrete">Concrete</option>
              <option value="insulation">Insulation</option>
              <option value="roofing">Roofing</option>
              <option value="fasteners">Fasteners &amp; Hardware</option>
              <option value="masonry">Masonry</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {matchingCatalogProducts.map((catalogProduct) => (
              <div
                key={catalogProduct.id}
                onClick={() => handleSelectCatalogProduct(catalogProduct)}
                className="p-2 bg-card hover:bg-accent/40 border border-border rounded-md cursor-pointer transition-colors flex justify-between items-start"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold text-foreground truncate">
                    {catalogProduct.productName}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {catalogProduct.specification || catalogProduct.category}
                  </div>
                  <div className="text-[10px] font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                    {catalogProduct.sku || "Local Catalog"}
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="text-xs font-bold text-foreground">
                    {formatCents(catalogProduct.unitPriceCents)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    per {catalogProduct.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Proposal Modal */}
      {budgetModalOpenState && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-foreground">
                Automatic Budget Allocation Engine
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setBudgetModalOpenState(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Target your project estimate directly. The deterministic allocator will compose realistic supply line items from the local catalogue without exceeding the cap.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Target Budget ($ USD)
              </label>
              <input
                type="number"
                value={targetBudgetInputDollars}
                onChange={(changeEvent) =>
                  setTargetBudgetInputDollars(changeEvent.target.value)
                }
                min="100"
                step="50"
                className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Job Trade Preset
              </label>
              <select
                value={selectedJobPresetId}
                onChange={(changeEvent) => setSelectedJobPresetId(changeEvent.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {JOB_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={handleExecuteBudgetProposal}
              className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-md font-semibold transition-colors shadow-sm"
            >
              Generate &amp; Apply Supplies
            </button>
          </div>
        </div>
      )}

      {/* Line Items Container */}
      {supplyLineItems.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground bg-muted/20">
          <p className="text-xs font-medium">No supply line items added yet.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={handleAddBlankCustomItem}
              className="px-3.5 py-2 text-xs bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors shadow-xs"
            >
              + Add Custom Item
            </button>
            <button
              type="button"
              onClick={() => setCatalogDrawerOpenState(true)}
              className="px-3.5 py-2 text-xs bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-xs"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile Touch Cards View (md:hidden) */}
          <div className="md:hidden space-y-2.5">
            <AnimatePresence mode="popLayout">
              {supplyLineItems.map((supplyLineItem, itemIndex) => {
                const calculatedLineTotal = calculateLineTotalCents(
                  supplyLineItem.quantity,
                  supplyLineItem.unitPriceCents
                );

                return (
                  <motion.div
                    key={supplyLineItem.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="p-3 bg-muted/40 hover:bg-muted/60 border border-border/80 rounded-xl space-y-2.5 transition-colors shadow-xs"
                  >
                  {/* Card Header: Item Index + Description + Delete Button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-muted border border-border text-[10px] font-mono font-bold flex items-center justify-center text-muted-foreground shrink-0">
                        {itemIndex + 1}
                      </span>
                      <input
                        type="text"
                        value={supplyLineItem.description}
                        onChange={(changeEvent) =>
                          onUpdateSupplyLineItem(supplyLineItem.id, {
                            description: changeEvent.target.value,
                          })
                        }
                        autoCapitalize="sentences"
                        autoCorrect="off"
                        spellCheck="false"
                        placeholder="Supply description..."
                        className="w-full font-semibold text-xs bg-transparent border-0 border-b border-border/60 focus:border-primary focus:outline-none text-foreground py-0.5"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveSupplyLineItem(supplyLineItem.id)}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Specification Field */}
                  <div>
                    <input
                      type="text"
                      value={supplyLineItem.specification || ""}
                      onChange={(changeEvent) =>
                        onUpdateSupplyLineItem(supplyLineItem.id, {
                          specification: changeEvent.target.value,
                        })
                      }
                      autoCapitalize="sentences"
                      autoCorrect="off"
                      spellCheck="false"
                      placeholder="Specification / Dimensions (e.g. 1/2-in x 4-ft x 8-ft)"
                      className="w-full text-[11px] text-muted-foreground bg-input/40 border border-border/60 rounded-md px-2.5 py-1 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Numeric Controls Row: Qty Stepper, UOM, Unit Price */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    {/* Quantity Stepper */}
                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center border border-border rounded-lg bg-input overflow-hidden h-8">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSupplyLineItem(supplyLineItem.id, {
                              quantity: Math.max(1, supplyLineItem.quantity - 1),
                            })
                          }
                          className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 text-sm font-bold shrink-0 select-none"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="1"
                          step="1"
                          value={supplyLineItem.quantity}
                          onChange={(changeEvent) => {
                            const parsedQuantity = Math.max(1, Number(changeEvent.target.value));
                            onUpdateSupplyLineItem(supplyLineItem.id, {
                              quantity: parsedQuantity,
                            });
                          }}
                          className="w-full text-center text-xs bg-transparent font-mono font-semibold text-foreground focus:outline-none px-0.5"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSupplyLineItem(supplyLineItem.id, {
                              quantity: supplyLineItem.quantity + 1,
                            })
                          }
                          className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 text-sm font-bold shrink-0 select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Unit of Measure */}
                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={supplyLineItem.unit}
                        onChange={(changeEvent) =>
                          onUpdateSupplyLineItem(supplyLineItem.id, {
                            unit: changeEvent.target.value,
                          })
                        }
                        autoCapitalize="words"
                        autoCorrect="off"
                        placeholder="Piece"
                        className="w-full h-8 text-center text-xs bg-input border border-border rounded-lg px-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={(supplyLineItem.unitPriceCents / 100).toFixed(2)}
                        onChange={(changeEvent) => {
                          const parsedCents = Math.round(Number(changeEvent.target.value) * 100);
                          onUpdateSupplyLineItem(supplyLineItem.id, {
                            unitPriceCents: parsedCents,
                          });
                        }}
                        className="w-full h-8 text-right text-xs bg-input border border-border rounded-lg px-2 text-foreground font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Footer: Tax toggle chip + Line Total */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={supplyLineItem.taxable}
                        onChange={(changeEvent) =>
                          onUpdateSupplyLineItem(supplyLineItem.id, {
                            taxable: changeEvent.target.checked,
                          })
                        }
                        className="rounded border-border text-primary focus:ring-ring w-4 h-4"
                      />
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {supplyLineItem.taxable ? "Taxable" : "Non-taxable"}
                      </span>
                    </label>

                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className="text-[10px] text-muted-foreground">Total:</span>
                      <span className="font-bold text-xs text-foreground">
                        {formatCents(calculatedLineTotal)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

          {/* Desktop High-Density Table View (hidden on mobile, visible md+) */}
          <div className="hidden md:block overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[11px]">
                  <th className="py-2 px-1 w-5 text-center">#</th>
                  <th className="py-2 px-1.5 min-w-[130px]">Item &amp; Specification</th>
                  <th className="py-2 px-1 w-12 text-center">UOM</th>
                  <th className="py-2 px-1 w-12 text-right">Qty</th>
                  <th className="py-2 px-1 w-18 text-right">Price ($)</th>
                  <th className="py-2 px-0.5 w-8 text-center">Tax</th>
                  <th className="py-2 px-1 w-18 text-right">Total</th>
                  <th className="py-2 px-0.5 w-6 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {supplyLineItems.map((supplyLineItem, itemIndex) => {
                    const calculatedLineTotal = calculateLineTotalCents(
                      supplyLineItem.quantity,
                      supplyLineItem.unitPriceCents
                    );

                    return (
                      <motion.tr
                        key={supplyLineItem.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="hover:bg-muted/40 transition-colors"
                      >
                      <td className="py-2 px-1 text-muted-foreground font-mono text-[10px] text-center">
                        {itemIndex + 1}
                      </td>

                      {/* Item Description & Spec */}
                      <td className="py-2 px-1.5 min-w-[130px]">
                        <input
                          type="text"
                          value={supplyLineItem.description}
                          onChange={(changeEvent) =>
                            onUpdateSupplyLineItem(supplyLineItem.id, {
                              description: changeEvent.target.value,
                            })
                          }
                          placeholder="Description"
                          className="w-full font-medium text-xs bg-transparent border-0 border-b border-transparent hover:border-border focus:border-ring focus:outline-none text-foreground"
                        />
                        <input
                          type="text"
                          value={supplyLineItem.specification || ""}
                          onChange={(changeEvent) =>
                            onUpdateSupplyLineItem(supplyLineItem.id, {
                              specification: changeEvent.target.value,
                            })
                          }
                          placeholder="Specification / Dimensions (optional)"
                          className="w-full text-[10px] text-muted-foreground bg-transparent border-0 border-b border-transparent hover:border-border focus:border-ring focus:outline-none"
                        />
                      </td>

                      {/* UOM */}
                      <td className="py-2 px-1 text-center">
                        <input
                          type="text"
                          value={supplyLineItem.unit}
                          onChange={(changeEvent) =>
                            onUpdateSupplyLineItem(supplyLineItem.id, {
                              unit: changeEvent.target.value,
                            })
                          }
                          className="w-11 text-center text-xs bg-input border border-border rounded px-0.5 py-0.5 text-foreground"
                        />
                      </td>

                      {/* Qty */}
                      <td className="py-2 px-1 text-right">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={supplyLineItem.quantity}
                          onChange={(changeEvent) => {
                            const parsedQuantity = Math.max(1, Number(changeEvent.target.value));
                            onUpdateSupplyLineItem(supplyLineItem.id, {
                              quantity: parsedQuantity,
                            });
                          }}
                          className="w-11 text-right text-xs bg-input border border-border rounded px-1 py-0.5 text-foreground font-mono"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="py-2 px-1 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={(supplyLineItem.unitPriceCents / 100).toFixed(2)}
                          onChange={(changeEvent) => {
                            const parsedCents = Math.round(Number(changeEvent.target.value) * 100);
                            onUpdateSupplyLineItem(supplyLineItem.id, {
                              unitPriceCents: parsedCents,
                            });
                          }}
                          className="w-16 text-right text-xs bg-input border border-border rounded px-1 py-0.5 text-foreground font-mono"
                        />
                      </td>

                      {/* Taxable Checkbox */}
                      <td className="py-2 px-0.5 text-center">
                        <input
                          type="checkbox"
                          checked={supplyLineItem.taxable}
                          onChange={(changeEvent) =>
                            onUpdateSupplyLineItem(supplyLineItem.id, {
                              taxable: changeEvent.target.checked,
                            })
                          }
                          className="rounded border-border text-primary focus:ring-ring w-3.5 h-3.5"
                        />
                      </td>

                      {/* Line Total */}
                      <td className="py-2 px-1 text-right font-mono font-semibold text-foreground text-xs whitespace-nowrap">
                        {formatCents(calculatedLineTotal)}
                      </td>

                      {/* Delete Item */}
                      <td className="py-2 px-0.5 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveSupplyLineItem(supplyLineItem.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove Line Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Add Custom Item Button */}
          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleAddBlankCustomItem}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 text-xs bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg font-semibold transition-colors active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 text-primary" />
              <span>Add Custom Supply Item</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
