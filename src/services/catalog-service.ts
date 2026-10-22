import rawCatalogJson from "../data/catalog.local.json";
import rawCatalogMetaJson from "../data/catalogue-meta.json";
import type { CatalogSupplyProduct, BuildingTradeCategory } from "../domain/types";
import { JOB_PRESETS } from "../data/job-presets";

export type ConstructionCatalogMetadata = {
  version: string;
  totalProducts: number;
  source: string;
  catalogueBuiltAt: string;
  currency: string;
  market: string;
};

export const LOCAL_CONSTRUCTION_CATALOG: CatalogSupplyProduct[] = rawCatalogJson as CatalogSupplyProduct[];
export const CATALOG_SOURCE_METADATA: ConstructionCatalogMetadata = rawCatalogMetaJson as ConstructionCatalogMetadata;

export function isCataloguePriceStale(priceCheckedDateIso: string, maximumAllowedAgeDays = 60): boolean {
  if (!priceCheckedDateIso) return true;
  const priceCheckedTimestamp = new Date(priceCheckedDateIso).getTime();
  const currentTimestamp = Date.now();
  const calculatedAgeDays = (currentTimestamp - priceCheckedTimestamp) / (1000 * 60 * 60 * 24);
  return calculatedAgeDays > maximumAllowedAgeDays;
}

export function searchConstructionCatalog(searchFilterCriteria: {
  searchQueryText?: string;
  tradeCategoryFilter?: BuildingTradeCategory | "all";
  jobPresetIdentifier?: string;
  onlyActiveProducts?: boolean;
}): CatalogSupplyProduct[] {
  const {
    searchQueryText = "",
    tradeCategoryFilter = "all",
    jobPresetIdentifier,
    onlyActiveProducts = true,
  } = searchFilterCriteria;

  let filteredSupplyProducts = LOCAL_CONSTRUCTION_CATALOG;

  if (onlyActiveProducts) {
    filteredSupplyProducts = filteredSupplyProducts.filter((product) => product.active);
  }

  if (tradeCategoryFilter && tradeCategoryFilter !== "all") {
    filteredSupplyProducts = filteredSupplyProducts.filter(
      (product) => product.category === tradeCategoryFilter
    );
  }

  if (jobPresetIdentifier) {
    const targetJobPreset = JOB_PRESETS.find((preset) => preset.id === jobPresetIdentifier);
    if (targetJobPreset) {
      filteredSupplyProducts = filteredSupplyProducts.filter((product) => {
        const categoryMatches = targetJobPreset.categories.includes(product.category);
        const nameMatchesKeyword = targetJobPreset.searchKeywords.some((keyword) =>
          product.productName.toLowerCase().includes(keyword)
        );
        const jobTypeMatches = product.compatibleJobTypes.some((jobType) =>
          targetJobPreset.name.toLowerCase().includes(jobType.toLowerCase())
        );
        return categoryMatches || nameMatchesKeyword || jobTypeMatches;
      });
    }
  }

  const normalizedQueryText = searchQueryText.trim().toLowerCase();
  if (normalizedQueryText) {
    const searchTokens = normalizedQueryText.split(/\s+/);
    filteredSupplyProducts = filteredSupplyProducts.filter((product) => {
      const consolidatedSearchTarget = [
        product.productName,
        product.brand || "",
        product.sku || "",
        product.specification,
        product.category,
      ]
        .join(" ")
        .toLowerCase();

      return searchTokens.every((token) => consolidatedSearchTarget.includes(token));
    });
  }

  return filteredSupplyProducts;
}
