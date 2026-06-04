// Chemistry Tools: Molar Mass, Empirical Formulas, and element constants
// Ported from Zperiod/js/modules/chemistryTools.js

import { parseFormulaStrict } from "./balancer";

// ===== Atomic Masses (common elements for Grade 9-11) =====
export const atomicMasses: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.01, N: 14.01, O: 16.0, F: 19.0, Ne: 20.18,
  Na: 22.99, Mg: 24.31, Al: 26.98, Si: 28.09, P: 30.97, S: 32.07, Cl: 35.45, Ar: 39.95,
  K: 39.1, Ca: 40.08, Sc: 44.96, Ti: 47.87, V: 50.94, Cr: 52.0, Mn: 54.94, Fe: 55.85, Co: 58.93, Ni: 58.69, Cu: 63.55, Zn: 65.38,
  Ga: 69.72, Ge: 72.63, As: 74.92, Se: 78.97, Br: 79.9, Kr: 83.8,
  Rb: 85.47, Sr: 87.62, Y: 88.91, Zr: 91.22, Nb: 92.91, Mo: 95.95, Tc: 98.0, Ru: 101.1, Rh: 102.9, Pd: 106.4, Ag: 107.9, Cd: 112.4,
  In: 114.8, Sn: 118.7, Sb: 121.8, Te: 127.6, I: 126.9, Xe: 131.3,
  Cs: 132.9, Ba: 137.3, La: 138.9, Ce: 140.1, Pr: 140.9, Nd: 144.2, Pm: 145.0, Sm: 150.4, Eu: 152.0, Gd: 157.3, Tb: 158.9, Dy: 162.5,
  Ho: 164.9, Er: 167.3, Tm: 168.9, Yb: 173.0, Lu: 175.0, Hf: 178.5, Ta: 180.9, W: 183.8, Re: 186.2, Os: 190.2, Ir: 192.2, Pt: 195.1,
  Au: 197.0, Hg: 200.6, Tl: 204.4, Pb: 207.2, Bi: 209.0, Po: 209.0, At: 210.0, Rn: 222.0,
  Fr: 223.0, Ra: 226.0, Ac: 227.0, Th: 232.0, Pa: 231.0, U: 238.0, Np: 237.0, Pu: 244.0, Am: 243.0, Cm: 247.0, Bk: 247.0, Cf: 251.0,
  Es: 252.0, Fm: 257.0, Md: 258.0, No: 259.0, Lr: 262.0, Rf: 267.0, Db: 270.0, Sg: 271.0, Bh: 270.0, Hs: 277.0, Mt: 276.0, Ds: 281.0,
  Rg: 282.0, Cn: 285.0, Nh: 286.0, Fl: 289.0, Mc: 290.0, Lv: 293.0, Ts: 294.0, Og: 294.0,
};

// Metal symbols list (for formula ordering: metals before nonmetals)
const METALS = new Set([
  'Li','Be','Na','Mg','Al','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn',
  'Ga','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn',
  'Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu',
  'Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po',
  'Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr',
  'Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og'
]);

export interface MolarMassBreakdown {
  element: string;
  atomicMass: string | number;
  count: number;
  subtotal: string | number;
}

export interface MolarMassResult {
  total: string | number;
  breakdown: MolarMassBreakdown[];
  exact: boolean;
}

export function calculateMolarMassModal(formula: string, exact: boolean): MolarMassResult {
  const elements = parseFormulaStrict(formula);
  let total = 0;
  const breakdown: MolarMassBreakdown[] = [];

  Object.keys(elements).forEach((element) => {
    const count = elements[element];
    const atomicMass = atomicMasses[element];

    if (!atomicMass) {
      throw new Error(`Unknown element: ${element}`);
    }

    const subtotal = atomicMass * count;
    total += subtotal;

    breakdown.push({
      element,
      atomicMass: exact ? atomicMass.toFixed(3) : Math.round(atomicMass),
      count,
      subtotal: exact ? subtotal.toFixed(3) : Math.round(subtotal),
    });
  });

  return {
    total: exact ? total.toFixed(3) : Math.round(total),
    breakdown,
    exact,
  };
}

export const EMPIRICAL_PRESETS = [
  {
    name: "Methane (甲烷)",
    elements: [
      { symbol: "C", percent: 75.0 },
      { symbol: "H", percent: 25.0 },
    ],
    molMass: 16,
  },
  {
    name: "Water (水)",
    elements: [
      { symbol: "H", percent: 11.2 },
      { symbol: "O", percent: 88.8 },
    ],
    molMass: 18,
  },
  {
    name: "Ammonia (氨)",
    elements: [
      { symbol: "N", percent: 82.4 },
      { symbol: "H", percent: 17.6 },
    ],
    molMass: 17,
  },
  {
    name: "Benzene (苯)",
    elements: [
      { symbol: "C", percent: 92.3 },
      { symbol: "H", percent: 7.7 },
    ],
    molMass: 78,
  },
  {
    name: "Carbon Dioxide (二氧化碳)",
    elements: [
      { symbol: "C", percent: 27.3 },
      { symbol: "O", percent: 72.7 },
    ],
    molMass: 44,
  },
  {
    name: "Glucose (葡萄糖)",
    elements: [
      { symbol: "C", percent: 40.0 },
      { symbol: "H", percent: 6.7 },
      { symbol: "O", percent: 53.3 },
    ],
    molMass: 180,
  },
  {
    name: "Aspirin (阿司匹林)",
    elements: [
      { symbol: "C", percent: 60.0 },
      { symbol: "H", percent: 4.5 },
      { symbol: "O", percent: 35.5 },
    ],
    molMass: 180,
  },
  {
    name: "Ethanol (乙醇)",
    elements: [
      { symbol: "C", percent: 52.2 },
      { symbol: "H", percent: 13.0 },
      { symbol: "O", percent: 34.8 },
    ],
    molMass: 46,
  },
  {
    name: "Acetic Acid (乙酸)",
    elements: [
      { symbol: "C", percent: 40.0 },
      { symbol: "H", percent: 6.7 },
      { symbol: "O", percent: 53.3 },
    ],
    molMass: 60,
  },
  {
    name: "Vitamin C (维生素C)",
    elements: [
      { symbol: "C", percent: 40.9 },
      { symbol: "H", percent: 4.6 },
      { symbol: "O", percent: 54.5 },
    ],
    molMass: 176,
  },
  {
    name: "Caffeine (咖啡因)",
    elements: [
      { symbol: "C", percent: 49.5 },
      { symbol: "H", percent: 5.2 },
      { symbol: "N", percent: 28.9 },
      { symbol: "O", percent: 16.5 },
    ],
    molMass: 194,
  },
  {
    name: "Urea (尿素)",
    elements: [
      { symbol: "C", percent: 20.0 },
      { symbol: "H", percent: 6.7 },
      { symbol: "N", percent: 46.7 },
      { symbol: "O", percent: 26.7 },
    ],
    molMass: 60,
  },
  {
    name: "Glycine (甘氨酸)",
    elements: [
      { symbol: "C", percent: 32.0 },
      { symbol: "H", percent: 6.7 },
      { symbol: "N", percent: 18.7 },
      { symbol: "O", percent: 42.6 },
    ],
    molMass: 75,
  },
  {
    name: "Alanine (丙氨酸)",
    elements: [
      { symbol: "C", percent: 40.4 },
      { symbol: "H", percent: 7.9 },
      { symbol: "N", percent: 15.7 },
      { symbol: "O", percent: 36.0 },
    ],
    molMass: 89,
  },
  {
    name: "Cysteine (半胱氨酸)",
    elements: [
      { symbol: "C", percent: 29.8 },
      { symbol: "H", percent: 5.8 },
      { symbol: "N", percent: 11.6 },
      { symbol: "O", percent: 26.4 },
      { symbol: "S", percent: 26.4 },
    ],
    molMass: 121,
  },
  {
    name: "Methionine (蛋氨酸)",
    elements: [
      { symbol: "C", percent: 40.3 },
      { symbol: "H", percent: 7.4 },
      { symbol: "N", percent: 9.4 },
      { symbol: "O", percent: 21.5 },
      { symbol: "S", percent: 21.5 },
    ],
    molMass: 149,
  },
  {
    name: "Thiamine (维生素B1)",
    elements: [
      { symbol: "C", percent: 42.7 },
      { symbol: "H", percent: 5.4 },
      { symbol: "N", percent: 16.6 },
      { symbol: "O", percent: 4.7 },
      { symbol: "S", percent: 9.5 },
    ],
    molMass: 337,
  },
];

export function formatFormulaHTML(formula: string): string {
  if (!formula) return "";
  return formula.replace(/[₀₁₂₃₄₅₆₇₈₉]+/g, (match) => {
    const nums = match
      .split("")
      .map((c) => {
        const subscripts = "₀₁₂₃₄₅₆₇₈₉";
        return subscripts.indexOf(c);
      })
      .join("");
    return `<sub>${nums}</sub>`;
  });
}

export function normalizeSymbol(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s.length === 0 || s.length > 2) return null;
  const norm = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return atomicMasses[norm] !== undefined ? norm : null;
}

export interface EmpiricalElementInput {
  symbol: string;
  percent: number;
}

export function validateEmpiricalInputs(
  elements: EmpiricalElementInput[],
  molecularMass: string | number | null | undefined
) {
  const errors: Array<{ row: number; field: string; message: string }> = [];

  if (elements.length < 2) {
    errors.push({ row: -1, field: 'global', message: 'Enter at least 2 elements.' });
  }

  const seenSymbols = new Set<string>();
  let percentSum = 0;

  elements.forEach((el, i) => {
    if (!el.symbol || el.symbol.trim() === '') {
      errors.push({ row: i, field: 'symbol', message: 'Enter an element symbol' });
    } else {
      const norm = normalizeSymbol(el.symbol);
      if (!norm) {
        errors.push({ row: i, field: 'symbol', message: `"${el.symbol}" is not a valid element` });
      } else if (seenSymbols.has(norm)) {
        errors.push({ row: i, field: 'symbol', message: `Duplicate element: ${norm}` });
      } else {
        seenSymbols.add(norm);
      }
    }

    if (el.percent === undefined || el.percent === null || isNaN(Number(el.percent))) {
      errors.push({ row: i, field: 'value', message: 'Enter a number' });
    } else {
      const v = Number(el.percent);
      if (v <= 0 || v > 100) {
        errors.push({ row: i, field: 'value', message: 'Must be 0–100 %' });
      } else {
        percentSum += v;
      }
    }
  });

  if (errors.filter(e => e.field === 'value').length === 0 && elements.length >= 2) {
    if (Math.abs(percentSum - 100) > 1.0) {
      errors.push({
        row: -1,
        field: 'sum',
        message: `Percentages sum to ${percentSum.toFixed(1)}%, expected ~100%`
      });
    }
  }

  if (molecularMass !== null && molecularMass !== undefined && molecularMass !== '') {
    const mm = Number(molecularMass);
    if (isNaN(mm) || mm <= 0) {
      errors.push({ row: -1, field: 'molMass', message: 'Molar mass must be a positive number' });
    }
  }

  return { ok: errors.length === 0, errors };
}

function gcdTwo(a: number, b: number): number {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function gcdArr(arr: number[]): number {
  return arr.reduce((g, v) => gcdTwo(g, v));
}

export interface SimplifiedRatio {
  symbol: string;
  count: number;
}

export interface MoleRatioInfo {
  symbol: string;
  moles: number;
  ratio: number;
  grams: number;
  atomicWeight: number;
  originalPercent: number;
}

function simplifyRatiosModal(ratios: MoleRatioInfo[]): SimplifiedRatio[] | null {
  const TOL = 0.08;
  const MAX_MULT = 8;

  for (let mult = 1; mult <= MAX_MULT; mult++) {
    const scaled = ratios.map(r => r.ratio * mult);
    const allInt = scaled.every(v => Math.abs(v - Math.round(v)) < TOL);
    if (allInt) {
      let counts = scaled.map(v => Math.round(v) || 1);
      const g = gcdArr(counts);
      counts = counts.map(c => c / g);
      return ratios.map((r, i) => ({ symbol: r.symbol, count: counts[i] }));
    }
  }

  return null;
}

function orderElements(elements: SimplifiedRatio[]): SimplifiedRatio[] {
  const hasMetal = elements.some(e => METALS.has(e.symbol));
  const hasNonMetal = elements.some(e => !METALS.has(e.symbol));

  if (hasMetal && hasNonMetal) {
    const metals = elements.filter(e => METALS.has(e.symbol)).sort((a, b) => a.symbol.localeCompare(b.symbol));
    const nonmetals = elements.filter(e => !METALS.has(e.symbol)).sort((a, b) => a.symbol.localeCompare(b.symbol));
    return [...metals, ...nonmetals];
  }

  const sorted = [...elements].sort((a, b) => {
    if (a.symbol === 'C') return -1;
    if (b.symbol === 'C') return 1;
    if (a.symbol === 'H') return -1;
    if (b.symbol === 'H') return 1;
    return a.symbol.localeCompare(b.symbol);
  });
  return sorted;
}

export interface EmpiricalRowInfo {
  symbol: string;
  count: number;
  grams: number;
  atomicWeight: number;
  moles: number;
  ratio: number;
  subscript: number;
}

export interface EmpiricalResult {
  empiricalFormula: string;
  molecularFormula: string | null;
  explanation: string;
  empiricalMass: number;
  molecularMass: number | null;
  empirical: EmpiricalRowInfo[];
  multiplier: number;
  molMassError: string | null;
  normalised: boolean;
}

export function calculateEmpiricalModal(data: {
  elements: EmpiricalElementInput[];
  molecularMass?: string | number | null;
}): EmpiricalResult {
  const { elements, molecularMass } = data;

  if (!elements || elements.length < 2) {
    throw new Error("Please enter at least 2 elements with valid data.");
  }

  const rawSum = elements.reduce((s, e) => s + e.percent, 0);
  const normalised = Math.abs(rawSum - 100) > 0.01;
  const scaleFactor = 100 / rawSum;
  const elems = elements.map(e => ({
    symbol: e.symbol,
    percent: e.percent * scaleFactor,
  }));

  const moles = elems.map(elem => {
    const aw = atomicMasses[elem.symbol];
    const molesVal = elem.percent / aw;
    return {
      symbol: elem.symbol,
      grams: elem.percent,
      atomicWeight: aw,
      moles: molesVal,
      originalPercent: elements.find(e => e.symbol === elem.symbol)!.percent,
    };
  });

  const minMoles = Math.min(...moles.map(m => m.moles));
  const ratios: MoleRatioInfo[] = moles.map(m => ({
    symbol: m.symbol,
    moles: m.moles,
    ratio: m.moles / minMoles,
    grams: m.grams,
    atomicWeight: m.atomicWeight,
    originalPercent: m.originalPercent,
  }));

  const simplified = simplifyRatiosModal(ratios);
  if (!simplified) {
    throw new Error("Cannot determine empirical formula — ratios are too far from whole numbers. Check your data.");
  }

  const ordered = orderElements(simplified);

  const empiricalFormula = ordered
    .map(r => r.symbol + (r.count > 1 ? subscript(r.count) : ''))
    .join('');

  let empiricalMass = 0;
  ordered.forEach(elem => {
    empiricalMass += atomicMasses[elem.symbol] * elem.count;
  });

  let explanation = "<h4>Calculation Steps</h4><ol>";
  explanation += "<li><strong>Assume 100 g sample</strong> — each % becomes grams directly.</li>";
  if (normalised) {
    explanation += `<li><strong>Note:</strong> Percentages summed to ${rawSum.toFixed(1)}%; values normalised to 100%.</li>`;
  }
  explanation += "<li><strong>Convert grams → moles</strong> (g ÷ atomic mass):</li><ul>";
  moles.forEach(m => {
    explanation += `<li>${m.symbol}: ${m.grams.toFixed(2)} g ÷ ${m.atomicWeight} g/mol = <strong>${m.moles.toFixed(4)} mol</strong></li>`;
  });
  explanation += "</ul>";
  explanation += `<li><strong>Divide all by smallest</strong> (${minMoles.toFixed(4)} mol):</li><ul>`;
  ratios.forEach(r => {
    explanation += `<li>${r.symbol}: ${r.moles.toFixed(4)} ÷ ${minMoles.toFixed(4)} = <strong>${r.ratio.toFixed(3)}</strong></li>`;
  });
  explanation += "</ul>";
  explanation += "<li><strong>Round to whole-number ratio:</strong></li><ul>";
  ordered.forEach(r => {
    explanation += `<li>${r.symbol} → <strong>${r.count}</strong></li>`;
  });
  explanation += "</ul>";
  explanation += `<li><strong>Empirical formula:</strong> <strong>${empiricalFormula}</strong> (${empiricalMass.toFixed(2)} g/mol)</li>`;
  explanation += "</ol>";

  let molecularFormula: string | null = null;
  let multiplier = 1;
  let molMassError: string | null = null;

  if (molecularMass !== null && molecularMass !== undefined && Number(molecularMass) > 0) {
    const mm = Number(molecularMass);
    const rawN = mm / empiricalMass;
    const n = Math.round(rawN);

    if (n < 1 || Math.abs(rawN - n) > 0.1) {
      molMassError = `Molar mass ${mm} g/mol does not match empirical formula mass ${empiricalMass.toFixed(2)} g/mol (ratio = ${rawN.toFixed(2)}, not close to an integer).`;
    } else {
      multiplier = n;
      molecularFormula = ordered
        .map(r => r.symbol + (r.count * n > 1 ? subscript(r.count * n) : ''))
        .join('');

      explanation += "<hr><h4>Molecular Formula</h4>";
      explanation += `<p>Given molar mass: <strong>${mm} g/mol</strong></p>`;
      explanation += `<p>n = ${mm} ÷ ${empiricalMass.toFixed(2)} = <strong>${rawN.toFixed(2)} ≈ ${n}</strong></p>`;
      explanation += `<p>Molecular formula = empirical × ${n} = <strong>${molecularFormula}</strong></p>`;
    }
  }

  const empiricalRows: EmpiricalRowInfo[] = ordered.map(item => {
    const r = ratios.find(ratio => ratio.symbol === item.symbol)!;
    return {
      symbol: item.symbol,
      count: item.count,
      grams: r.grams,
      atomicWeight: r.atomicWeight,
      moles: r.moles,
      ratio: r.ratio,
      subscript: item.count,
    };
  });

  return {
    empiricalFormula,
    molecularFormula,
    explanation,
    empiricalMass,
    molecularMass: molecularMass ? Number(molecularMass) : null,
    empirical: empiricalRows,
    multiplier,
    molMassError,
    normalised,
  };
}

function subscript(num: number): string {
  const subscripts: Record<string, string> = {
    0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉"
  };
  return String(num)
    .split("")
    .map((d) => subscripts[d] || d)
    .join("");
}
