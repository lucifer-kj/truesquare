import { describe, it, expect } from "vitest";
import { generateBudgetProposal } from "../src/domain/budget-proposal";
import {
  LOCAL_CONSTRUCTION_CATALOG,
  searchConstructionCatalog,
  isCataloguePriceStale,
} from "../src/services/catalog-service";

describe("Domain: Budget Proposal Engine", () => {
  it("produces identical proposals with the same seed (pure determinism)", () => {
    const params = {
      targetBudgetTotalCents: 50000, // $500.00
      jobPresetId: "drywall",
      catalogProducts: LOCAL_CONSTRUCTION_CATALOG,
      taxRateBasisPoints: 825, // 8.25%
      allocationRandomSeed: 12345,
    };

    const firstProposal = generateBudgetProposal(params);
    const secondProposal = generateBudgetProposal(params);

    expect(firstProposal.totalCents).toBe(secondProposal.totalCents);
    expect(firstProposal.suggestedLineItems.length).toBe(secondProposal.suggestedLineItems.length);
    expect(firstProposal.remainingBudgetCents).toBe(secondProposal.remainingBudgetCents);
    expect(firstProposal.suggestedLineItems.map((item) => ({ desc: item.description, qty: item.quantity }))).toEqual(
      secondProposal.suggestedLineItems.map((item) => ({ desc: item.description, qty: item.quantity }))
    );
  });

  it("never exceeds the target total budget", () => {
    const budgetTargets = [2500, 10000, 50000, 250000, 1000000];

    for (const singleTarget of budgetTargets) {
      const generatedProposal = generateBudgetProposal({
        targetBudgetTotalCents: singleTarget,
        jobPresetId: "framing",
        catalogProducts: LOCAL_CONSTRUCTION_CATALOG,
        taxRateBasisPoints: 825,
        allocationRandomSeed: 42,
      });

      expect(generatedProposal.totalCents).toBeLessThanOrEqual(singleTarget);
      expect(generatedProposal.remainingBudgetCents).toBeGreaterThanOrEqual(0);
      expect(generatedProposal.totalCents + generatedProposal.remainingBudgetCents).toBe(singleTarget);
    }
  });

  it("returns honest remainder and never adds fake products", () => {
    const generatedProposal = generateBudgetProposal({
      targetBudgetTotalCents: 12345,
      jobPresetId: "drywall",
      catalogProducts: LOCAL_CONSTRUCTION_CATALOG,
      taxRateBasisPoints: 500,
      allocationRandomSeed: 99,
    });

    expect(generatedProposal.totalCents).toBeLessThanOrEqual(12345);
    expect(generatedProposal.suggestedLineItems.every((item) => item.productId && item.description)).toBe(true);

    for (const lineItem of generatedProposal.suggestedLineItems) {
      const foundInCatalog = LOCAL_CONSTRUCTION_CATALOG.some((prod) => prod.id === lineItem.productId);
      expect(foundInCatalog).toBe(true);
    }
  });

  it("handles very low budget gracefully", () => {
    const generatedProposal = generateBudgetProposal({
      targetBudgetTotalCents: 500,
      jobPresetId: "concrete",
      catalogProducts: LOCAL_CONSTRUCTION_CATALOG,
      taxRateBasisPoints: 0,
      allocationRandomSeed: 1,
    });

    expect(generatedProposal.totalCents).toBeLessThanOrEqual(500);
    expect(generatedProposal.remainingBudgetCents).toBeGreaterThanOrEqual(0);
  });
});

describe("Service: Construction Catalog Search & Freshness", () => {
  it("searches products by keyword across multiple fields", () => {
    const drywallResults = searchConstructionCatalog({ searchQueryText: "drywall" });
    expect(drywallResults.length).toBeGreaterThan(0);
    expect(
      drywallResults.every((prod) => prod.category === "drywall" || prod.productName.toLowerCase().includes("drywall"))
    ).toBe(true);

    const cementResults = searchConstructionCatalog({ searchQueryText: "cement" });
    expect(cementResults.length).toBeGreaterThan(0);
  });

  it("filters products by category accurately", () => {
    const roofingItems = searchConstructionCatalog({ tradeCategoryFilter: "roofing" });
    expect(roofingItems.length).toBeGreaterThan(0);
    expect(roofingItems.every((prod) => prod.category === "roofing")).toBe(true);
  });

  it("detects stale vs fresh price check timestamps", () => {
    expect(isCataloguePriceStale("2020-01-01", 30)).toBe(true);
    const tomorrowDateString = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    expect(isCataloguePriceStale(tomorrowDateString, 30)).toBe(false);
  });
});
