// Reaction Predictor — Rule-based product prediction for school chemistry
// Ported from Zperiod/js/modules/reactionPredictor.js

import { balanceEquation, demoChemistryValidator, normalizeText, parseFormulaStrict } from "./balancer";

// ============================================================
// 1) Chemistry Data
// ============================================================

const METAL_CHARGES: Record<string, number> = {
  Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Fr: 1,
  Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Ra: 2,
  Al: 3, Ga: 3,
  Zn: 2, Cd: 2,
  Ag: 1,
  Fe: 3, Cu: 2, Ni: 2, Co: 2, Mn: 2, Cr: 3,
  Sn: 2, Pb: 2, Ti: 4,
};

const METALS = new Set([
  "Li","Na","K","Rb","Cs","Fr",
  "Be","Mg","Ca","Sr","Ba","Ra",
  "Al","Ga","In","Tl",
  "Sn","Pb","Bi",
  "Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn",
  "Y","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd",
  "La","Ce","Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg",
]);

const HALOGENS = ["F", "Cl", "Br", "I"];
const HALOGEN_SET = new Set(HALOGENS);
const DIATOMIC_ELEMENTS = new Set(["H", "N", "O", "F", "Cl", "Br", "I"]);

const ACTIVITY_SERIES = [
  "K", "Ba", "Ca", "Na", "Mg", "Al", "Zn", "Fe", "Ni", "Sn", "Pb",
  "H",
  "Cu", "Hg", "Ag", "Pt", "Au",
];

const HALOGEN_ACTIVITY = ["F", "Cl", "Br", "I"];

export interface PolyatomicIonInfo {
  formula: string;
  charge: number;
  display: string;
}

export const POLYATOMIC_IONS: Record<string, PolyatomicIonInfo> = {
  "SO4":  { formula: "SO4",   charge: -2, display: "SO₄²⁻" },
  "NO3":  { formula: "NO3",   charge: -1, display: "NO₃⁻" },
  "CO3":  { formula: "CO3",   charge: -2, display: "CO₃²⁻" },
  "HCO3": { formula: "HCO3",  charge: -1, display: "HCO₃⁻" },
  "PO4":  { formula: "PO4",   charge: -3, display: "PO₄³⁻" },
  "OH":   { formula: "OH",    charge: -1, display: "OH⁻" },
  "ClO3": { formula: "ClO3",  charge: -1, display: "ClO₃⁻" },
  "ClO4": { formula: "ClO4",  charge: -1, display: "ClO₄⁻" },
  "CrO4": { formula: "CrO4",  charge: -2, display: "Cr₁O₄²⁻" },
  "Cr2O7":{ formula: "Cr2O7", charge: -2, display: "Cr₂O₇²⁻" },
  "MnO4": { formula: "MnO4",  charge: -1, display: "MnO₄⁻" },
  "C2H3O2":{ formula: "C2H3O2", charge: -1, display: "C₂H₃O₂⁻" },
  "NH4":  { formula: "NH4",   charge: 1,  display: "NH₄⁺" },
  "SO3":  { formula: "SO3",   charge: -2, display: "SO₃²⁻" },
  "HSO4": { formula: "HSO4",  charge: -1, display: "HSO₄⁻" },
  "HPO4": { formula: "HPO4",  charge: -2, display: "HPO₄²⁻" },
  "H2PO4":{ formula: "H2PO4", charge: -1, display: "H₂PO₄⁻" },
  "CN":   { formula: "CN",    charge: -1, display: "CN⁻" },
  "SCN":  { formula: "SCN",   charge: -1, display: "SCN⁻" },
  "S2O3": { formula: "S2O3",  charge: -2, display: "S₂O₃²⁻" },
};

const NONMETAL_CHARGES: Record<string, number> = {
  F: -1, Cl: -1, Br: -1, I: -1,
  O: -2, S: -2, Se: -2, Te: -2,
  N: -3, P: -3,
};

export function isSoluble(cation: string, anion: string | { formula: string }): boolean {
  const anionF = typeof anion === "string" ? anion : anion.formula;
  const cat = cation;

  if (["Li","Na","K","Rb","Cs","Fr"].includes(cat) || cat === "NH4") return true;
  if (anionF === "NO3") return true;

  if (["Cl","Br","I"].includes(anionF)) {
    if (["Ag","Pb","Hg"].includes(cat)) return false;
    return true;
  }

  if (anionF === "SO4") {
    if (["Ba","Pb","Ag","Sr"].includes(cat)) return false;
    if (cat === "Ca") return false;
    return true;
  }

  if (anionF === "OH") {
    if (["Li","Na","K","Rb","Cs","Fr","Ba","Ca","Sr"].includes(cat)) return true;
    return false;
  }

  if (anionF === "CO3") return false;
  if (anionF === "PO4") return false;

  if (anionF === "S") {
    if (["Li","Na","K","Rb","Cs","Fr","Be","Mg","Ca","Sr","Ba","NH4"].includes(cat)) return true;
    return false;
  }

  if (anionF === "SO3") return false;

  return true;
}

function isMetal(symbol: string): boolean { return METALS.has(symbol); }
function isHalogen(symbol: string): boolean { return HALOGEN_SET.has(symbol); }
function getMetalCharge(symbol: string): number | null { return METAL_CHARGES[symbol] || null; }
function getNonmetalCharge(symbol: string): number | null { return NONMETAL_CHARGES[symbol] || null; }

function elementFormula(symbol: string): string {
  return DIATOMIC_ELEMENTS.has(symbol) ? symbol + "2" : symbol;
}

function buildIonicFormula(
  cation: { symbol: string; formula?: string; charge: number },
  anion: { formula: string; charge: number }
): string {
  if (cation.symbol === "H" && anion.formula === "OH" && Math.abs(cation.charge) === 1 && Math.abs(anion.charge) === 1) {
    return "H2O";
  }

  const cCharge = Math.abs(cation.charge);
  const aCharge = Math.abs(anion.charge);

  const g = gcd(cCharge, aCharge);
  let cSub = aCharge / g;
  let aSub = cCharge / g;

  const cSymbol = cation.formula || cation.symbol;
  const aFormula = anion.formula;
  const aIsPolyatomic = aFormula.length > 2 || /[A-Z].*[A-Z]/.test(aFormula) ||
                         Object.keys(POLYATOMIC_IONS).includes(aFormula);
  const cIsPolyatomic = cSymbol === "NH4";

  let result = "";

  if (cSub === 1) {
    result += cSymbol;
  } else {
    result += cIsPolyatomic ? `(${cSymbol})${cSub}` : cSymbol + (cSub > 1 ? cSub : "");
  }

  if (aSub === 1) {
    result += aFormula;
  } else {
    result += aIsPolyatomic ? `(${aFormula})${aSub}` : aFormula + aSub;
  }

  return result;
}

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

function isMoreReactive(a: string, b: string): boolean | null {
  const aIdx = ACTIVITY_SERIES.indexOf(a);
  const bIdx = ACTIVITY_SERIES.indexOf(b);
  if (aIdx === -1 || bIdx === -1) return null;
  return aIdx < bIdx;
}

function isHalogenMoreReactive(a: string, b: string): boolean | null {
  const aIdx = HALOGEN_ACTIVITY.indexOf(a);
  const bIdx = HALOGEN_ACTIVITY.indexOf(b);
  if (aIdx === -1 || bIdx === -1) return null;
  return aIdx < bIdx;
}

// Compound Classification
export interface ClassificationResult {
  type: string;
  subtype?: string;
  formula: string;
  symbol?: string;
  isMetal?: boolean;
  isHalogen?: boolean;
  atoms?: Record<string, number>;
  metal?: string;
  nonmetal?: string;
  cation?: { symbol: string; formula?: string; charge: number };
  anion?: { formula: string; charge: number };
}

function classifyCompound(formula: string): ClassificationResult {
  let atoms: Record<string, number> | null = null;
  try {
    atoms = parseFormulaStrict(formula);
  } catch {
    return { type: "unknown", formula };
  }

  const elements = Object.keys(atoms);

  if (elements.length === 1) {
    const el = elements[0];
    return {
      type: "element",
      formula,
      symbol: el,
      isMetal: isMetal(el),
      isHalogen: isHalogen(el),
      atoms,
    };
  }

  if (formula === "H2O" || (atoms.H === 2 && atoms.O === 1 && elements.length === 2)) {
    return { type: "water", formula, atoms };
  }

  if (elements.length === 2 && atoms.O) {
    const otherEl = elements.find(e => e !== "O")!;
    if (isMetal(otherEl) && !atoms.H) {
      return {
        type: "metal_oxide",
        formula, atoms,
        metal: otherEl,
        cation: { symbol: otherEl, charge: getMetalCharge(otherEl) || 2 },
      };
    }
    if (!isMetal(otherEl) && !atoms.H) {
      return {
        type: "nonmetal_oxide",
        formula, atoms,
        nonmetal: otherEl,
      };
    }
  }

  const ionDetection = detectIons(formula, atoms);
  
  if (ionDetection.cation && ionDetection.anion) {
    let anionCharge = POLYATOMIC_IONS[ionDetection.anion]?.charge || getNonmetalCharge(ionDetection.anion) || -1;
    const cationSym = ionDetection.cation.symbol;
    
    if (cationSym && cationSym !== "H" && cationSym !== "NH4") {
      const catCount = atoms[cationSym] || 1;
      const anFormula = ionDetection.anion;
      let anCount = 1;
      
      if (POLYATOMIC_IONS[anFormula]) {
        const polyAtoms = parseFormulaStrict(anFormula);
        if (polyAtoms) {
          const firstEl = Object.keys(polyAtoms)[0];
          anCount = Math.floor((atoms[firstEl] || 0) / polyAtoms[firstEl]);
        }
      } else {
        anCount = atoms[anFormula] || 1;
      }
      
      if (anCount > 0 && catCount > 0) {
        const calculatedCharge = Math.abs((anCount * Math.abs(anionCharge)) / catCount);
        if (Number.isInteger(calculatedCharge) && calculatedCharge > 0) {
          ionDetection.cation.charge = calculatedCharge;
        }
      }
    }
  }

  if (ionDetection.anion === "OH" && ionDetection.cation) {
    return {
      type: "hydroxide",
      formula, atoms,
      cation: ionDetection.cation,
      anion: { formula: "OH", charge: -1 },
    };
  }

  if (ionDetection.anion === "CO3" && ionDetection.cation) {
    return {
      type: "carbonate",
      formula, atoms,
      cation: ionDetection.cation,
      anion: { formula: "CO3", charge: -2 },
    };
  }

  if (ionDetection.anion === "HCO3" && ionDetection.cation) {
    return {
      type: "hydrogen_carbonate",
      formula, atoms,
      cation: ionDetection.cation,
      anion: { formula: "HCO3", charge: -1 },
    };
  }

  const isAmmonium = ionDetection.cation && ionDetection.cation.symbol === "NH4";
  if (atoms.H && elements.length >= 2 && !isAmmonium) {
    if (elements.length === 2 && HALOGEN_SET.has(elements.find(e => e !== "H")!)) {
      const halogen = elements.find(e => e !== "H")!;
      return {
        type: "acid",
        subtype: "binary_acid",
        formula, atoms,
        cation: { symbol: "H", charge: 1 },
        anion: { formula: halogen, charge: getNonmetalCharge(halogen) || -1 },
      };
    }
    if (atoms.O && ionDetection.anion) {
      return {
        type: "acid",
        subtype: "oxyacid",
        formula, atoms,
        cation: { symbol: "H", charge: 1 },
        anion: { formula: ionDetection.anion, charge: POLYATOMIC_IONS[ionDetection.anion]?.charge || 0 },
      };
    }
  }

  if (ionDetection.cation && ionDetection.anion) {
    return {
      type: "ionic",
      formula, atoms,
      cation: ionDetection.cation,
      anion: { formula: ionDetection.anion, charge: POLYATOMIC_IONS[ionDetection.anion]?.charge || getNonmetalCharge(ionDetection.anion) || -1 },
    };
  }

  if (elements.length === 2) {
    const metal = elements.find(e => isMetal(e));
    const nonmetal = elements.find(e => !isMetal(e));
    if (metal && nonmetal) {
      return {
        type: "ionic",
        subtype: "binary",
        formula, atoms,
        cation: { symbol: metal, charge: getMetalCharge(metal) || 2 },
        anion: { formula: nonmetal, charge: getNonmetalCharge(nonmetal) || -1 },
      };
    }
  }

  if (elements.length === 2 && atoms.C && atoms.H && !atoms.O) {
    return { type: "hydrocarbon", formula, atoms };
  }

  if (atoms.C && atoms.H) {
    return { type: "organic", formula, atoms };
  }

  return { type: "unknown", formula, atoms };
}

function detectIons(formula: string, atoms: Record<string, number>) {
  const elements = Object.keys(atoms);
  let cation: { symbol: string; charge: number } | null = null;
  let anion: string | null = null;

  if (formula.includes("NH4")) {
    cation = { symbol: "NH4", charge: 1 };
  } else {
    for (const el of elements) {
      if (isMetal(el)) {
        cation = { symbol: el, charge: getMetalCharge(el) || 2 };
        break;
      }
    }
    if (!cation && atoms.H) {
      cation = { symbol: "H", charge: 1 };
    }
  }

  const sortedPolyIons = Object.keys(POLYATOMIC_IONS)
    .sort((a, b) => b.length - a.length);

  for (const ionKey of sortedPolyIons) {
    let ionAtoms: Record<string, number> | null = null;
    try {
      ionAtoms = parseFormulaStrict(ionKey);
    } catch {
      continue;
    }

    const cationSymbol = cation?.symbol || "";
    let matches = true;
    for (const el of Object.keys(ionAtoms)) {
      if (!atoms[el]) { matches = false; break; }
    }
    if (matches && (ionKey !== "OH" || (ionKey === "OH" && atoms.O && atoms.H))) {
      if (formula.includes(`(${ionKey})`) || formulaContainsIon(formula, ionKey)) {
        anion = ionKey;
        break;
      }
    }
  }

  if (!anion) {
    for (const el of elements) {
      if (!isMetal(el) && el !== "H" && el !== "O") {
        if (HALOGEN_SET.has(el) || getNonmetalCharge(el)) {
          anion = el;
          break;
        }
      }
    }
    if (!anion && atoms.O && elements.length === 2) {
      anion = "O";
    }
  }

  return { cation, anion };
}

function formulaContainsIon(formula: string, ionFormula: string): boolean {
  if (formula.includes(ionFormula)) return true;
  if (formula.includes(`(${ionFormula})`)) return true;
  return false;
}

const NONMETAL_OXIDE_TO_ACID: Record<string, string> = {
  "SO3":  "H2SO4",
  "SO2":  "H2SO3",
  "CO2":  "H2CO3",
  "N2O5": "HNO3",
  "N2O3": "HNO2",
  "P2O5": "H3PO4",
  "Cl2O7":"HClO4",
};

// Heuristic Translation Helper
function getTranslation(
  key: string,
  fallback: string,
  values: Record<string, string | number> = {},
  tFn?: (key: string) => string
): string {
  let text = tFn ? tFn(key) : fallback;
  if (text === key) text = fallback;
  for (const [k, v] of Object.entries(values)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

// Predictors
function predictSynthesis(reactants: string[], tFn?: (key: string) => string) {
  if (reactants.length < 2) return { error: "Synthesis requires at least two reactants." };
  const classified = reactants.map(classifyCompound);

  if (classified.length === 2) {
    const metal = classified.find(c => c.type === "element" && c.isMetal);
    const nonmetal = classified.find(c => c.type === "element" && !c.isMetal);

    if (metal && nonmetal) {
      const mCharge = getMetalCharge(metal.symbol!);
      const nmCharge = getNonmetalCharge(nonmetal.symbol!);

      if (mCharge !== null && nmCharge !== null) {
        const product = buildIonicFormula(
          { symbol: metal.symbol!, charge: mCharge },
          { formula: nonmetal.symbol!, charge: nmCharge },
        );
        return {
          products: [product],
          explanation: getTranslation(
            "predictor.reasonSynthesisBinary",
            `Metal (${metal.symbol}) + nonmetal (${nonmetal.symbol}) combine to form an ionic compound.`,
            { m: metal.symbol!, nm: nonmetal.symbol! },
            tFn
          ),
        };
      }
    }

    const metalOxide = classified.find(c => c.type === "metal_oxide");
    const water = classified.find(c => c.type === "water");

    if (metalOxide && water) {
      const charge = getMetalCharge(metalOxide.metal!) || 2;
      const product = buildIonicFormula(
        { symbol: metalOxide.metal!, charge },
        { formula: "OH", charge: -1 },
      );
      return {
        products: [product],
        explanation: `Metal oxide (${metalOxide.formula}) + water → metal hydroxide.`,
      };
    }

    const nmOxide = classified.find(c => c.type === "nonmetal_oxide");
    if (nmOxide && water) {
      const acidFormula = NONMETAL_OXIDE_TO_ACID[nmOxide.formula];
      if (acidFormula) {
        return {
          products: [acidFormula],
          explanation: `Nonmetal oxide (${nmOxide.formula}) + water → oxyacid.`,
        };
      }
      return { error: `Unsupported nonmetal oxide synthesis: ${nmOxide.formula} + H₂O.` };
    }

    const nm1 = classified[0];
    const nm2 = classified[1];
    
    if (nm1.type === "element" && nm2.type === "element" && !nm1.isMetal && !nm2.isMetal) {
      const sym1 = nm1.symbol!;
      const sym2 = nm2.symbol!;
      const set = new Set([sym1, sym2]);

      if (set.has("H") && set.has("O")) {
        return {
          products: ["H2O"],
          explanation: getTranslation("predictor.reasonSynthesisWater", "Hydrogen and oxygen synthesize to form water.", {}, tFn)
        };
      }
      const halogen = (isHalogen(sym1) && sym1) || (isHalogen(sym2) && sym2);
      if (set.has("H") && halogen) {
        return {
          products: ["H" + halogen],
          explanation: getTranslation("predictor.reasonSynthesisAcid", `Hydrogen and a halogen (${halogen}) synthesize to form hydrogen halide.`, { halogen }, tFn)
        };
      }
      if (set.has("H") && set.has("N")) {
        return {
          products: ["NH3"],
          explanation: getTranslation("predictor.reasonSynthesisAmmonia", "Hydrogen and nitrogen synthesize to form ammonia.", {}, tFn)
        };
      }
      if (set.has("O")) {
        const otherNm = sym1 === "O" ? sym2 : sym1;
        const oxideMap: Record<string, string> = { "C": "CO2", "S": "SO2", "P": "P2O5", "N": "NO2" };
        if (oxideMap[otherNm]) {
          return {
            products: [oxideMap[otherNm]],
            explanation: getTranslation("predictor.reasonSynthesisOxide", `${otherNm} synthesizes with oxygen to form ${oxideMap[otherNm]}`, {}, tFn)
          };
        }
      }
    }
  }

  return { error: "These reactants do not match a supported synthesis pattern." };
}

function predictDecomposition(reactants: string[], tFn?: (key: string) => string) {
  if (reactants.length !== 1) return { error: "Decomposition requires exactly one reactant." };
  const c = classifyCompound(reactants[0]);

  if (c.type === "water") {
    return {
      products: ["H2", "O2"],
      explanation: "Water decomposes into hydrogen gas and oxygen gas.",
    };
  }

  if (c.type === "carbonate" && c.cation) {
    const charge = c.cation.charge || getMetalCharge(c.cation.symbol) || 2;
    const oxide = buildIonicFormula(
      { symbol: c.cation.symbol, charge },
      { formula: "O", charge: -2 },
    );
    return {
      products: [oxide, "CO2"],
      explanation: `Metal carbonate (${c.formula}) decomposes into a metal oxide and carbon dioxide.`,
    };
  }

  if (c.type === "hydrogen_carbonate" && c.cation) {
    const charge = c.cation.charge || getMetalCharge(c.cation.symbol) || 1;
    const carbonate = buildIonicFormula(
      { symbol: c.cation.symbol, charge },
      { formula: "CO3", charge: -2 },
    );
    return {
      products: [carbonate, "H2O", "CO2"],
      explanation: `Metal hydrogen carbonate (${c.formula}) decomposes into a metal carbonate, water, and carbon dioxide.`,
    };
  }

  if (c.type === "hydroxide" && c.cation) {
    const charge = c.cation.charge || getMetalCharge(c.cation.symbol) || 2;
    const oxide = buildIonicFormula(
      { symbol: c.cation.symbol, charge },
      { formula: "O", charge: -2 },
    );
    return {
      products: [oxide, "H2O"],
      explanation: `Metal hydroxide (${c.formula}) decomposes into a metal oxide and water.`,
    };
  }

  if (c.type === "ionic" && c.cation && c.anion && c.atoms) {
    const elements = Object.keys(c.atoms);
    if (elements.length === 2) {
      const products = elements.map(elementFormula);
      return {
        products,
        explanation: `Binary compound (${c.formula}) decomposes into its constituent elements.`,
      };
    }
  }

  if (c.type === "metal_oxide" && c.metal) {
    return {
      products: [c.metal, "O2"],
      explanation: `Metal oxide (${c.formula}) decomposes into the metal and oxygen gas.`,
    };
  }

  return { error: `Unsupported decomposition pattern for ${c.formula}. Cannot determine products.` };
}

function predictSingleDisplacement(reactants: string[], tFn?: (key: string) => string) {
  if (reactants.length !== 2) {
    return { error: "Single displacement requires exactly two reactants: an element and a compound." };
  }

  const classified = reactants.map(classifyCompound);
  const element = classified.find(c => c.type === "element");
  const compound = classified.find(c => c.type !== "element");

  if (!element || !compound) {
    return { error: "Single displacement requires one element and one compound." };
  }

  if (element.isMetal) {
    if (compound.type === "acid" && compound.anion) {
      const metalSym = element.symbol!;
      const reactivity = isMoreReactive(metalSym, "H");

      if (reactivity === false) {
        return { noReaction: true, explanation: `${metalSym} is less reactive than hydrogen in the activity series. No reaction occurs.` };
      }
      if (reactivity === null) {
        return { error: `Cannot determine reactivity of ${metalSym} — not in the supported activity series.` };
      }

      const charge = getMetalCharge(metalSym) || 2;
      const salt = buildIonicFormula(
        { symbol: metalSym, charge },
        compound.anion,
      );
      return {
        products: [salt, "H2"],
        explanation: `${metalSym} is more reactive than hydrogen, so it displaces H₂ from the acid.`,
      };
    }

    if (compound.type === "ionic" || compound.type === "carbonate" || compound.type === "hydroxide") {
      const compoundCation = compound.cation;
      if (!compoundCation) {
        return { error: `Cannot identify the cation in ${compound.formula}.` };
      }
      const metalSym = element.symbol!;
      const displacedMetal = compoundCation.symbol;

      const reactivity = isMoreReactive(metalSym, displacedMetal);
      if (reactivity === false) {
        return { noReaction: true, explanation: `${metalSym} is less reactive than ${displacedMetal} in the activity series. No reaction occurs.` };
      }
      if (reactivity === null) {
        return { error: `Cannot determine reactivity between ${metalSym} and ${displacedMetal}.` };
      }

      const charge = getMetalCharge(metalSym) || compoundCation.charge || 2;
      const newCompound = buildIonicFormula(
        { symbol: metalSym, charge },
        compound.anion!,
      );
      const displacedSpecies = elementFormula(displacedMetal);
      return {
        products: [newCompound, displacedSpecies],
        explanation: `${metalSym} is more reactive than ${displacedMetal}, so it displaces ${displacedMetal} from the compound.`,
      };
    }
  }

  if (element.isHalogen) {
    if (compound.type === "ionic" && compound.anion && HALOGEN_SET.has(compound.anion.formula)) {
      const incoming = element.symbol!;
      const existing = compound.anion.formula;

      const reactivity = isHalogenMoreReactive(incoming, existing);
      if (reactivity === false) {
        return { noReaction: true, explanation: `${incoming} is less reactive than ${existing}. No displacement occurs.` };
      }
      if (reactivity === null) {
        return { error: `Cannot determine halogen reactivity between ${incoming} and ${existing}.` };
      }

      const newSalt = buildIonicFormula(
        compound.cation!,
        { formula: incoming, charge: -1 },
      );
      const displacedHalogen = elementFormula(existing);
      return {
        products: [newSalt, displacedHalogen],
        explanation: `${incoming} is more reactive than ${existing}, so it displaces ${existing} from the salt.`,
      };
    }
  }

  return { error: "These reactants do not match a supported single displacement pattern." };
}

function predictDoubleDisplacement(reactants: string[], tFn?: (key: string) => string) {
  if (reactants.length !== 2) return { error: "Double displacement requires exactly two reactants." };
  const classified = reactants.map(classifyCompound);

  const c1 = classified[0];
  const c2 = classified[1];

  if (!c1.cation || !c1.anion || !c2.cation || !c2.anion) {
    return { error: "Double displacement requires two ionic compounds or an acid and a base." };
  }

  const cat1 = c1.cation;
  const an1 = c1.anion;
  const cat2 = c2.cation;
  const an2 = c2.anion;

  const product1Formula = buildIonicFormula(cat1, an2);
  const product2Formula = buildIonicFormula(cat2, an1);

  const products: string[] = [];
  let hasDriver = false;

  if ((cat1.symbol === "H" && an2.formula === "OH") || (cat2.symbol === "H" && an1.formula === "OH")) {
    hasDriver = true;
  }

  const p1Class = classifyCompound(product1Formula);
  const p2Class = classifyCompound(product2Formula);

  let finalProducts: string[] = [];

  for (const [pFormula, pClass] of [[product1Formula, p1Class], [product2Formula, p2Class]] as Array<[string, ClassificationResult]>) {
    if (pFormula === "H2CO3" || (pClass.type === "acid" && pClass.atoms?.C && pClass.atoms?.O)) {
      if (pFormula === "H2CO3") {
        finalProducts.push("H2O", "CO2");
        hasDriver = true;
        continue;
      }
    }
    if (pFormula === "H2SO3") {
      finalProducts.push("H2O", "SO2");
      hasDriver = true;
      continue;
    }
    if (pFormula === "NH4OH" || pFormula === "(NH4)(OH)" || pFormula === "(NH4)OH") {
      finalProducts.push("NH3", "H2O");
      hasDriver = true;
      continue;
    }
    if (pFormula === "H2O" || pFormula === "HOH") {
      finalProducts.push("H2O");
      hasDriver = true;
      continue;
    }
    finalProducts.push(pFormula);
  }

  if (!hasDriver) {
    const p1Soluble = isSoluble(cat1.symbol, an2);
    const p2Soluble = isSoluble(cat2.symbol, an1);
    if (!p1Soluble || !p2Soluble) {
      hasDriver = true;
    }
  }

  if (!hasDriver) {
    return {
      noReaction: true,
      explanation: "No driving force: both products remain soluble, and no gas, water, or precipitate is formed.",
    };
  }

  const seen = new Set();
  const dedupedProducts = [];
  for (const p of finalProducts) {
    if (!seen.has(p)) {
      seen.add(p);
      dedupedProducts.push(p);
    }
  }

  return {
    products: dedupedProducts,
    explanation: `The cations and anions swap partners in a double displacement reaction.`,
  };
}

function predictCombustion(reactants: string[], tFn?: (key: string) => string) {
  const classified = reactants.map(classifyCompound);
  const o2 = classified.find(c => c.type === "element" && c.symbol === "O");
  const fuel = classified.find(c => c.type !== "element" || c.symbol !== "O");

  if (!fuel) return { error: "Combustion requires a fuel compound." };

  let needsO2Added = false;
  if (!o2) {
    needsO2Added = true;
  }

  const fuelAtoms = fuel.atoms;
  if (!fuelAtoms) return { error: `Cannot parse the fuel formula "${fuel.formula}".` };

  if (!fuelAtoms.C && !fuelAtoms.H) {
    return { error: `These reactants do not match a supported combustion pattern. Combustion of hydrocarbons requires a compound containing carbon and/or hydrogen.` };
  }

  const products = [];
  if (fuelAtoms.C) products.push("CO2");
  if (fuelAtoms.H) products.push("H2O");

  const otherElements = Object.keys(fuelAtoms).filter(e => !["C", "H", "O"].includes(e));
  if (otherElements.length > 0) {
    return { error: `Combustion of compounds containing ${otherElements.join(", ")} is not supported in school-level prediction.` };
  }

  return {
    products,
    explanation: fuelAtoms.C && fuelAtoms.H
      ? `A hydrocarbon (${fuel.formula}) combusts completely in oxygen to produce CO₂ and H₂O.`
      : `Combustion produces ${products.join(" and ")}.`,
    autoAddO2: needsO2Added,
  };
}

const REACTION_HANDLERS: Record<string, (reactants: string[], tFn?: (key: string) => string) => any> = {
  synthesis: predictSynthesis,
  decomposition: predictDecomposition,
  single_displacement: predictSingleDisplacement,
  double_displacement: predictDoubleDisplacement,
  combustion: predictCombustion,
};

export interface PredictResult {
  success: boolean;
  reactants?: string[];
  products?: string[];
  balancedEquation?: string | null;
  unbalancedEquation?: string;
  balancedResult?: any;
  explanation?: string;
  error?: string;
  noReaction?: boolean;
  balancingError?: string;
}

export function predictReaction(
  reactantInput: string,
  reactionType: string,
  options: { t?: (key: string) => string } = {}
): PredictResult {
  if (!reactantInput || !reactantInput.trim()) {
    return { success: false, error: "Please enter reactant formulas." };
  }

  const handler = REACTION_HANDLERS[reactionType];
  if (!handler) {
    return { success: false, error: `Unknown reaction type: "${reactionType}".` };
  }

  const normalizedInput = normalizeText(reactantInput);
  const reactants = normalizedInput
    .replace(/[·.]/g, "•")
    .split(/\s*\+\s*/)
    .map(s => s.trim())
    .filter(Boolean);

  if (reactants.length === 0) {
    return { success: false, error: "No valid reactant formulas found." };
  }

  for (const r of reactants) {
    try {
      parseFormulaStrict(r);
    } catch (e: any) {
      return { success: false, error: `Invalid formula "${r}": ${e.message}` };
    }
  }

  const prediction = handler(reactants, options.t);

  if (prediction.error) {
    return { success: false, error: prediction.error };
  }
  if (prediction.noReaction) {
    return { success: false, noReaction: true, explanation: prediction.explanation };
  }

  let fullReactants = [...reactants];
  if (prediction.autoAddO2 && !reactants.some(r => r === "O2")) {
    fullReactants.push("O2");
  }
  const productFormulas = prediction.products;

  for (const p of productFormulas) {
    try {
      parseFormulaStrict(p);
    } catch (e: any) {
      return {
        success: false,
        error: `Internal prediction error: generated invalid product formula "${p}". ${e.message}`,
      };
    }
  }

  try {
    const balResult = balanceEquation(
      { reactants: fullReactants, products: productFormulas },
      { chemistryValidator: demoChemistryValidator }
    );

    const balancedStr = balResult.formatted.replace(/->/g, "→");

    return {
      success: true,
      reactants: fullReactants,
      products: productFormulas,
      balancedEquation: balancedStr,
      balancedResult: balResult,
      explanation: prediction.explanation,
    };
  } catch (balErr: any) {
    const unbalanced = fullReactants.join(" + ") + " → " + productFormulas.join(" + ");
    return {
      success: true,
      reactants: fullReactants,
      products: productFormulas,
      balancedEquation: null,
      unbalancedEquation: unbalanced,
      explanation: prediction.explanation,
      balancingError: `Prediction succeeded but auto-balancing failed: ${balErr.message}`,
    };
  }
}

export function getReactionTypes() {
  return [
    {
      id: "synthesis",
      label: "Synthesis",
      icon: "⊕",
      description: "Two or more substances combine to form one product.",
      example: "Na + Cl₂ → NaCl",
    },
    {
      id: "decomposition",
      label: "Decomposition",
      icon: "⊖",
      description: "One compound breaks down into simpler substances.",
      example: "CaCO₃ → CaO + CO₂",
    },
    {
      id: "single_displacement",
      label: "Single Displacement",
      icon: "⇄",
      description: "An element replaces another in a compound.",
      example: "Zn + HCl → ZnCl₂ + H₂",
    },
    {
      id: "double_displacement",
      label: "Double Displacement",
      icon: "⇆",
      description: "Two compounds exchange ions to form new products.",
      example: "AgNO₃ + NaCl → AgCl + NaNO₃",
    },
    {
      id: "combustion",
      label: "Combustion",
      icon: "🔥",
      description: "A fuel reacts with oxygen to produce CO₂ and H₂O.",
      example: "CH₄ + O₂ → CO₂ + H₂O",
    },
  ];
}
