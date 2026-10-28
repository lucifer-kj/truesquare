/**
 * Realistic Contractor Signature Curves Generator
 * Deterministically generates pen-drawn vector Bézier strokes matching the signatory's name.
 */
export interface SignatureStrokePaths {
  primaryFlourishPath: string;
  penUnderlinePath: string;
}

export function generateRealisticSignaturePaths(
  signatoryName: string = "Contractor"
): SignatureStrokePaths {
  let hashAccumulator = 0;
  const sanitizedName = signatoryName.trim() || "Contractor";

  for (let charIndex = 0; charIndex < sanitizedName.length; charIndex++) {
    hashAccumulator =
      (hashAccumulator << 5) - hashAccumulator + sanitizedName.charCodeAt(charIndex);
    hashAccumulator |= 0;
  }

  const pseudoRandomSeed = Math.abs(hashAccumulator);
  const startY = 13 + (pseudoRandomSeed % 5);
  const peakY = 4 + ((pseudoRandomSeed >> 2) % 4);
  const midDipY = 17 + ((pseudoRandomSeed >> 4) % 5);
  const loopY = 22 + ((pseudoRandomSeed >> 6) % 5);

  const primaryFlourishPath = [
    `M 8 ${startY}`,
    `C 16 ${peakY}, 22 ${peakY - 2}, 30 ${midDipY}`,
    `C 38 ${loopY}, 46 25, 54 11`,
    `C 60 3, 66 7, 72 17`,
    `C 78 25, 84 9, 90 13`,
    `C 98 17, 106 25, 114 11`,
    `C 120 4, 128 13, 136 19`,
  ].join(" ");

  const penUnderlinePath = [
    `M 14 ${midDipY + 3}`,
    `C 40 ${midDipY + 6}, 85 ${midDipY + 4}, 140 ${midDipY + 1}`,
  ].join(" ");

  return {
    primaryFlourishPath,
    penUnderlinePath,
  };
}

/**
 * Creates an inline SVG string for HTML previews or canvas elements.
 */
export function generateRealisticSignatureSvgString(
  signatoryName: string = "Contractor"
): string {
  const { primaryFlourishPath, penUnderlinePath } =
    generateRealisticSignaturePaths(signatoryName);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="32" viewBox="0 0 144 32" fill="none">
    <path d="${primaryFlourishPath}" stroke="#1e3a8a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${penUnderlinePath}" stroke="#1e3a8a" stroke-width="1.1" stroke-linecap="round"/>
  </svg>`;
}
