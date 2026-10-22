import { useState, useEffect } from "react";
import { springMotionTokens, type SpringMotionTier } from "./motion-tokens";

/**
 * Hook to inspect user vestibular motion preferences (prefers-reduced-motion).
 * Enterprise software must never induce vertigo or motion sickness.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMediaChange = (changeEvent: MediaQueryListEvent) => {
      setPrefersReducedMotion(changeEvent.matches);
    };

    mediaQueryList.addEventListener("change", handleMediaChange);
    return () => mediaQueryList.removeEventListener("change", handleMediaChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns the requested spring token unless the user has requested reduced motion,
 * in which case it returns the instant zero-duration token.
 */
export function useAccessibleMotion(requestedTier: SpringMotionTier = "productive") {
  const isReducedMotion = usePrefersReducedMotion();
  if (isReducedMotion) {
    return springMotionTokens.instant;
  }
  return springMotionTokens[requestedTier];
}
