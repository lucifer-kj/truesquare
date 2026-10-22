import type { CatalogSupplyProduct, SupplyLineItem } from "./types";
import { calculateDocumentTotals } from "./calculations";
import { JOB_PRESETS } from "../data/job-presets";

export type BudgetProposalAllocationParams = {
  targetBudgetTotalCents: number;
  jobPresetId: string;
  catalogProducts: CatalogSupplyProduct[];
  taxRateBasisPoints: number;
  allocationRandomSeed?: number;
};

export type BudgetAllocationProposal = {
  suggestedLineItems: SupplyLineItem[];
  targetBudgetTotalCents: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  remainingBudgetCents: number;
  isExactBudgetMatch: boolean;
  allocationRandomSeed: number;
  statusMessage?: string;
};

function createDeterministicPrng(initialSeed: number) {
  let internalState = initialSeed >>> 0;
  return function () {
    internalState = (internalState + 0x6d2b79f5) | 0;
    let intermediate = Math.imul(internalState ^ (internalState >>> 15), 1 | internalState);
    intermediate = (intermediate + Math.imul(intermediate ^ (intermediate >>> 7), 61 | intermediate)) ^ intermediate;
    return ((intermediate ^ (intermediate >>> 14)) >>> 0) / 4294967296;
  };
}

export function convertCatalogProductToLineItem(
  catalogProduct: CatalogSupplyProduct,
  requestedQuantity = 1
): SupplyLineItem {
  return {
    id: `item-${catalogProduct.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: catalogProduct.id,
    description: catalogProduct.productName,
    specification: catalogProduct.specification,
    sku: catalogProduct.sku || undefined,
    unit: catalogProduct.unit,
    quantity: requestedQuantity,
    unitPriceCents: catalogProduct.unitPriceCents,
    taxable: catalogProduct.taxCategory !== "non_taxable",
    sourcePriceCheckedAt: catalogProduct.priceCheckedAt,
    sourceRetailer: catalogProduct.retailer,
    catalogueStatus: catalogProduct.catalogueStatus,
  };
}

export function generateBudgetProposal(
  proposalParams: BudgetProposalAllocationParams
): BudgetAllocationProposal {
  const {
    targetBudgetTotalCents,
    jobPresetId,
    catalogProducts,
    taxRateBasisPoints,
    allocationRandomSeed = 42,
  } = proposalParams;

  if (targetBudgetTotalCents <= 0) {
    return {
      suggestedLineItems: [],
      targetBudgetTotalCents: 0,
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
      remainingBudgetCents: 0,
      isExactBudgetMatch: true,
      allocationRandomSeed,
      statusMessage: "Target budget must be greater than $0.00.",
    };
  }

  const selectedPreset = JOB_PRESETS.find((preset) => preset.id === jobPresetId) || JOB_PRESETS[0];
  const eligibleSupplyProducts = catalogProducts.filter((product) => {
    if (!product.active) return false;
    const categoryMatches = selectedPreset.categories.includes(product.category);
    const jobTypeMatches = product.compatibleJobTypes.some((jobType) =>
      selectedPreset.name.toLowerCase().includes(jobType.toLowerCase())
    );
    const keywordMatches = selectedPreset.searchKeywords.some((keyword) =>
      product.productName.toLowerCase().includes(keyword)
    );
    return categoryMatches || jobTypeMatches || keywordMatches;
  });

  if (eligibleSupplyProducts.length === 0) {
    return {
      suggestedLineItems: [],
      targetBudgetTotalCents,
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
      remainingBudgetCents: targetBudgetTotalCents,
      isExactBudgetMatch: false,
      allocationRandomSeed,
      statusMessage: `No catalog products available for job preset '${selectedPreset.name}'.`,
    };
  }

  const randomGenerator = createDeterministicPrng(allocationRandomSeed);
  const shuffledProducts = [...eligibleSupplyProducts].sort(() => randomGenerator() - 0.5);
  const basketSourceProducts = shuffledProducts.slice(0, Math.min(shuffledProducts.length, 6));

  let candidateLineItems: SupplyLineItem[] = basketSourceProducts.map((product, productIndex) => ({
    id: `gen-${product.id}-${productIndex}`,
    productId: product.id,
    description: product.productName,
    specification: product.specification,
    sku: product.sku || undefined,
    unit: product.unit,
    quantity: product.minQuantity || 1,
    unitPriceCents: product.unitPriceCents,
    taxable: product.taxCategory !== "non_taxable",
    sourcePriceCheckedAt: product.priceCheckedAt,
    sourceRetailer: product.retailer,
    catalogueStatus: product.catalogueStatus,
  }));

  let calculatedTotals = calculateDocumentTotals({
    supplyItems: candidateLineItems,
    taxRateBasisPoints,
    targetBudgetTotalCents,
  });

  if (calculatedTotals.totalCents > targetBudgetTotalCents) {
    const productsSortedByUnitPrice = [...basketSourceProducts].sort(
      (firstProd, secondProd) => firstProd.unitPriceCents - secondProd.unitPriceCents
    );
    candidateLineItems = [];

    for (const singleProduct of productsSortedByUnitPrice) {
      const singleCandidateItem: SupplyLineItem = {
        id: `gen-${singleProduct.id}-entry`,
        productId: singleProduct.id,
        description: singleProduct.productName,
        specification: singleProduct.specification,
        sku: singleProduct.sku || undefined,
        unit: singleProduct.unit,
        quantity: 1,
        unitPriceCents: singleProduct.unitPriceCents,
        taxable: singleProduct.taxCategory !== "non_taxable",
        sourcePriceCheckedAt: singleProduct.priceCheckedAt,
        sourceRetailer: singleProduct.retailer,
        catalogueStatus: singleProduct.catalogueStatus,
      };

      const trialTotals = calculateDocumentTotals({
        supplyItems: [...candidateLineItems, singleCandidateItem],
        taxRateBasisPoints,
        targetBudgetTotalCents,
      });

      if (trialTotals.totalCents <= targetBudgetTotalCents) {
        candidateLineItems.push(singleCandidateItem);
      }
    }

    calculatedTotals = calculateDocumentTotals({
      supplyItems: candidateLineItems,
      taxRateBasisPoints,
      targetBudgetTotalCents,
    });
  } else {
    let budgetCanBeFilledFurther = true;
    let iterationCounter = 0;
    const maxSearchIterations = 500;

    while (budgetCanBeFilledFurther && iterationCounter < maxSearchIterations) {
      budgetCanBeFilledFurther = false;
      iterationCounter++;

      const selectedItemIndex = Math.floor(randomGenerator() * candidateLineItems.length);
      const activeLineItem = candidateLineItems[selectedItemIndex];
      const matchedCatalogProduct = basketSourceProducts.find(
        (product) => product.id === activeLineItem.productId
      );
      const stepIncrement = matchedCatalogProduct?.quantityStep || 1;
      const maxAllowedQuantity = matchedCatalogProduct?.maxQuantity || 500;

      if (activeLineItem.quantity + stepIncrement <= maxAllowedQuantity) {
        activeLineItem.quantity += stepIncrement;

        const prospectiveTotals = calculateDocumentTotals({
          supplyItems: candidateLineItems,
          taxRateBasisPoints,
          targetBudgetTotalCents,
        });

        if (prospectiveTotals.totalCents <= targetBudgetTotalCents) {
          budgetCanBeFilledFurther = true;
        } else {
          activeLineItem.quantity -= stepIncrement;
        }
      }
    }

    calculatedTotals = calculateDocumentTotals({
      supplyItems: candidateLineItems,
      taxRateBasisPoints,
      targetBudgetTotalCents,
    });
  }

  const remainingBudgetAmountCents = targetBudgetTotalCents - calculatedTotals.totalCents;

  return {
    suggestedLineItems: candidateLineItems,
    targetBudgetTotalCents,
    subtotalCents: calculatedTotals.subtotalCents,
    taxCents: calculatedTotals.taxCents,
    totalCents: calculatedTotals.totalCents,
    remainingBudgetCents: remainingBudgetAmountCents,
    isExactBudgetMatch: remainingBudgetAmountCents === 0,
    allocationRandomSeed,
    statusMessage:
      remainingBudgetAmountCents === 0
        ? "Exact budget match achieved."
        : `Budget remaining: $${(remainingBudgetAmountCents / 100).toFixed(2)}. The catalog does not contain an exact combination for this total.`,
  };
}
