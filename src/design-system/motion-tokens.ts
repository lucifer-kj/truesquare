/**
 * BuildBill Design System — Codified Motion Tokens
 * 
 * Physics-based spring tokens and duration constants for enterprise SaaS ergonomics.
 * Micro-interactions give immediate tactile feedback; expressive transitions guide spatial context.
 */

export const springMotionTokens = {
  /**
   * Fast micro-interactions (~100-150ms feel).
   * For button presses, toggle switches, hover states, checkbox marks.
   */
  micro: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },

  /**
   * Balanced productive transitions (~200-250ms feel).
   * For dropdown menus, popovers, tooltips, accordion expansion.
   */
  productive: {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
    mass: 1,
  },

  /**
   * Spatial layout transitions (~300-400ms feel).
   * For wizard step slides, drawer entries, layout shifts, full-screen previews.
   */
  expressive: {
    type: "spring" as const,
    stiffness: 220,
    damping: 26,
    mass: 1.1,
  },

  /**
   * Instant transition fallback for reduced motion preference.
   */
  instant: {
    duration: 0,
  },
} as const;

export type SpringMotionTier = keyof typeof springMotionTokens;

/**
 * Directional slide transition variants for multi-step wizards & panels.
 */
export const directionalSlideVariants = {
  enter: (directionMultiplier: number) => ({
    x: directionMultiplier > 0 ? 36 : -36,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (directionMultiplier: number) => ({
    x: directionMultiplier > 0 ? -36 : 36,
    opacity: 0,
  }),
};
