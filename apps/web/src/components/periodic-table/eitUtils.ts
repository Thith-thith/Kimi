import { Element } from "@kimi/data";

export function parseNumericMetric(
  rawValue: any,
  metricKey: string
): { value: number; min: number; max: number } | null {
  if (rawValue === null || rawValue === undefined) return null;
  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? { value: rawValue, min: rawValue, max: rawValue } : null;
  }
  const text = String(rawValue).trim();
  if (!text) return null;
  if (text === "N/A" || text === "Unknown" || text === "—") return null;

  const normalized = text.replace(/−/g, "-").replace(/,/g, "");
  const matches = [...normalized.matchAll(/-?\d+(?:\.\d+)?/g)];
  if (matches.length === 0) return null;

  let min = Number.parseFloat(matches[0][0]);
  let max = min;
  if (matches.length >= 2) {
    max = Number.parseFloat(matches[1][0]);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;

  min = Math.min(min, max);
  max = Math.max(min, max);

  // Special scaling for firstIonization in eV vs kJ/mol if needed
  if (metricKey === "firstIonization" && /ev/i.test(normalized)) {
    min *= 96.485;
    max *= 96.485;
  }
  return { value: (min + max) / 2, min, max };
}

export function getColorForRatio(ratio: number): string {
  const bounded = Math.max(0, Math.min(1, ratio));
  const hue = 210 - bounded * 200; // 210 (blue) to 10 (red)
  const saturation = 82;
  const lightness = 78 - bounded * 22; // 78% (blue) to 56% (red)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function getNumericRatio(value: number, min: number, max: number): number | null {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }
  if (Math.abs(max - min) < 1e-9) return 0.5;
  return (value - min) / (max - min);
}

export function getElectronBlock(z: number, col: number): string {
  if ((z >= 57 && z <= 71) || (z >= 89 && z <= 103)) return "f";
  if (z === 2) return "s";
  if (col >= 1 && col <= 2) return "s";
  if (col >= 3 && col <= 12) return "d";
  if (col >= 13 && col <= 18) return "p";
  return "—";
}

export function getMetalType(catClass: string): string {
  const cat = catClass.toLowerCase();
  if (
    [
      "alkali-metal",
      "alkali metal",
      "alkaline-earth-metal",
      "alkaline earth metal",
      "transition-metal",
      "transition metal",
      "post-transition-metal",
      "post-transition metal",
      "lanthanide",
      "actinide",
    ].includes(cat)
  ) {
    return "Metal";
  }
  if (cat === "metalloid") return "Metalloid";
  if (
    [
      "other-nonmetal",
      "other nonmetal",
      "nonmetal",
      "non-metal",
      "halogen",
      "noble-gas",
      "noble gas",
    ].includes(cat)
  ) {
    return "Nonmetal";
  }
  return "Unknown";
}
