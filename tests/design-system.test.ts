import { describe, it, expect } from "vitest";
import {
  springMotionTokens,
  typographyScaleTokens,
  spacingCadenceTokens,
  semanticColorPalette,
  directionalSlideVariants,
} from "../src/design-system";

describe("Design System: Enterprise Motion & Theme Tokens", () => {
  it("provides calibrated spring motion tokens for all ergonomics tiers", () => {
    expect(springMotionTokens.micro.stiffness).toBe(400);
    expect(springMotionTokens.micro.damping).toBe(30);

    expect(springMotionTokens.productive.stiffness).toBe(300);
    expect(springMotionTokens.productive.damping).toBe(25);

    expect(springMotionTokens.expressive.stiffness).toBe(220);
    expect(springMotionTokens.expressive.damping).toBe(26);

    expect(springMotionTokens.instant.duration).toBe(0);
  });

  it("calculates directional slide variants with correct offset geometry", () => {
    const forwardSlide = directionalSlideVariants.enter(1);
    const backwardSlide = directionalSlideVariants.enter(-1);

    expect(forwardSlide.x).toBeGreaterThan(0);
    expect(backwardSlide.x).toBeLessThan(0);
    expect(directionalSlideVariants.center.x).toBe(0);
  });

  it("enforces modular typography scale with tabular line-height pairings", () => {
    expect(typographyScaleTokens["2xs"].fontSize).toBe("0.694rem");
    expect(typographyScaleTokens.xs.fontSize).toBe("0.833rem");
    expect(typographyScaleTokens.sm.fontSize).toBe("1.000rem");
    expect(typographyScaleTokens.base.fontSize).toBe("1.200rem");
    expect(typographyScaleTokens.lg.fontSize).toBe("1.440rem");
    expect(typographyScaleTokens.xl.fontSize).toBe("1.728rem");
    expect(typographyScaleTokens["2xl"].fontSize).toBe("2.074rem");
  });

  it("enforces an 8px spatial rhythm across all spacing tokens", () => {
    expect(spacingCadenceTokens.space1).toBe("4px");
    expect(spacingCadenceTokens.space2).toBe("8px");
    expect(spacingCadenceTokens.space3).toBe("12px");
    expect(spacingCadenceTokens.space4).toBe("16px");
    expect(spacingCadenceTokens.space6).toBe("24px");
    expect(spacingCadenceTokens.space8).toBe("32px");
    expect(spacingCadenceTokens.space12).toBe("48px");
    expect(spacingCadenceTokens.space16).toBe("64px");
  });

  it("maintains semantic color architecture with high contrast", () => {
    expect(semanticColorPalette.canvas.background).toBe("#FAFBFC");
    expect(semanticColorPalette.canvas.surface).toBe("#FFFFFF");
    expect(semanticColorPalette.text.foreground).toBe("#111827");
    expect(semanticColorPalette.accent.primary).toBe("#0F2744");
    expect(semanticColorPalette.border.structural).toBe("#E5E7EB");
  });
});
