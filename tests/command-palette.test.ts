import { describe, it, expect } from "vitest";
import { searchConstructionCatalog } from "../src/services/catalog-service";
import { searchLocationSuggestions } from "../src/services/location-autocomplete-service";
import { convertCatalogProductToLineItem } from "../src/domain/budget-proposal";

describe("Command Palette: Search & Auto-Complete Integration", () => {
  it("filters construction catalog products accurately by query string", () => {
    const drywallResults = searchConstructionCatalog({ searchQueryText: "drywall" });
    expect(drywallResults.length).toBeGreaterThan(0);
    expect(
      drywallResults.every(
        (product) =>
          product.productName.toLowerCase().includes("drywall") ||
          product.category === "drywall" ||
          product.specification.toLowerCase().includes("drywall")
      )
    ).toBe(true);
  });

  it("converts selected catalog product into a domain-valid supply line item", () => {
    const products = searchConstructionCatalog({ searchQueryText: "insulation" });
    expect(products.length).toBeGreaterThan(0);

    const firstProduct = products[0];
    const createdLineItem = convertCatalogProductToLineItem(firstProduct, 2);

    expect(createdLineItem.description).toBe(firstProduct.productName);
    expect(createdLineItem.quantity).toBe(2);
    expect(createdLineItem.unitPriceCents).toBe(firstProduct.unitPriceCents);
    expect(Number.isInteger(createdLineItem.unitPriceCents)).toBe(true);
    expect(createdLineItem.unit).toBe(firstProduct.unit);
  });

  it("finds US regional commercial hubs by city or landmark query", () => {
    const austinMatches = searchLocationSuggestions("Braker");
    expect(austinMatches.length).toBeGreaterThan(0);
    expect(austinMatches[0].namedLocationTitle).toContain("Apex Commercial");
    expect(austinMatches[0].city).toBe("Austin");
    expect(austinMatches[0].country).toBe("USA");
  });

  it("limits maximum location suggestions to 6 for clean palette rendering", () => {
    const broadMatches = searchLocationSuggestions("Commercial");
    expect(broadMatches.length).toBeLessThanOrEqual(6);
  });
});
