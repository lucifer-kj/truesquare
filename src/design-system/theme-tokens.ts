/**
 * BuildBill Design System — Theme & Design Tokens
 * 
 * Strict modular scale (1.2 Minor Third), 8px spatial grid, and semantic color palette.
 */

export const typographyScaleTokens = {
  "2xs": { fontSize: "0.694rem", lineHeight: "1rem" }, // 11px micro labels & badges
  xs: { fontSize: "0.833rem", lineHeight: "1.25rem" }, // 13px captions, secondary metadata
  sm: { fontSize: "1.000rem", lineHeight: "1.5rem" }, // 16px body copy, standard inputs
  base: { fontSize: "1.200rem", lineHeight: "1.75rem" }, // 19px card headings, section headers
  lg: { fontSize: "1.440rem", lineHeight: "2.0rem" }, // 23px view titles, modal titles
  xl: { fontSize: "1.728rem", lineHeight: "2.25rem" }, // 28px document title
  "2xl": { fontSize: "2.074rem", lineHeight: "2.5rem" }, // 33px hero metrics
} as const;

export const spacingCadenceTokens = {
  space1: "4px", // Tight inline icons & compact badge padding
  space2: "8px", // Standard input padding & icon gaps
  space3: "12px", // Form field vertical separation
  space4: "16px", // Card padding & inner container gutters
  space6: "24px", // Section dividers & grid column gaps
  space8: "32px", // Major layout panel gutters
  space12: "48px", // Page-level breathing space
  space16: "64px", // Studio hero margins
} as const;

export const semanticColorPalette = {
  canvas: {
    background: "#FAFBFC", // Cool crisp paper canvas
    surface: "#FFFFFF", // Elevated cards & editor panels
    surfaceHover: "#F4F6F8", // Subtle interactive hover
    surfaceSubtle: "#F9FAFB", // Table zebra striping & ribbon background
  },
  text: {
    foreground: "#111827", // Primary charcoal text (near-black, high contrast)
    muted: "#6B7280", // Secondary metadata labels
    placeholder: "#9CA3AF", // Ghost input prompts
  },
  accent: {
    primary: "#0F2744", // Deep enterprise navy
    primaryHover: "#1E3A5F",
    action: "#2563EB", // Standard interactive action blue
    actionSubtle: "#EFF6FF", // Soft action highlight pill
    actionText: "#1D4ED8",
  },
  status: {
    draftBg: "#F1F5F9",
    draftText: "#475569",
    sentBg: "#FEF3C7",
    sentText: "#92400E",
    paidBg: "#ECFDF5",
    paidText: "#065F46",
    alertBg: "#FEF2F2",
    alertText: "#991B1B",
  },
  border: {
    structural: "#E5E7EB", // Hairline 1px structural boundary
    subtle: "#F3F4F6", // Whisper divider
    strong: "#0F2744", // Brand accent border
  },
} as const;
