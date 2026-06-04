// Robust equation balancer for neutral chemical equations using BigInt
// Ported from Zperiod/js/modules/equationBalancer.js

const VALID_ELEMENTS = new Set([
  "H","He","Li","Be","B","C","N","O","F","Ne",
  "Na","Mg","Al","Si","P","S","Cl","Ar","K","Ca",
  "Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn",
  "Ga","Ge","As","Se","Br","Kr","Rb","Sr","Y","Zr",
  "Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn",
  "Sb","Te","I","Xe","Cs","Ba","La","Ce","Pr","Nd",
  "Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb",
  "Lu","Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg",
  "Tl","Pb","Bi","Po","At","Rn","Fr","Ra","Ac","Th",
  "Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm",
  "Md","No","Lr","Rf","Db","Sg","Bh","Hs","Mt","Ds",
  "Rg","Cn","Nh","Fl","Mc","Lv","Ts","Og"
]);

export class FormulaError extends Error {
  code: string;
  constructor(message: string, code: string = "INVALID_FORMULA") {
    super(message);
    this.name = "FormulaError";
    this.code = code;
  }
}

export class EquationError extends Error {
  code: string;
  constructor(message: string, code: string = "INVALID_EQUATION") {
    super(message);
    this.name = "EquationError";
    this.code = code;
  }
}

export const ERROR_CODES = {
  INVALID_FORMULA: "INVALID_FORMULA",
  INVALID_EQUATION: "INVALID_EQUATION",
  NO_SOLUTION: "NO_SOLUTION",
  SUSPICIOUS_FORMULA: "SUSPICIOUS_FORMULA",
  IONIC_NOT_SUPPORTED: "IONIC_NOT_SUPPORTED"
};

const SUBSCRIPT_MAP: Record<string, string> = {
  "₀":"0","₁":"1","₂":"2","₃":"3","₄":"4",
  "₅":"5","₆":"6","₇":"7","₈":"8","₉":"9"
};

export function normalizeText(input: string): string {
  let s = String(input)
    .replace(/[₀-₉]/g, ch => SUBSCRIPT_MAP[ch] || ch);

  let result = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "0") {
      const prev = i > 0 ? s[i - 1] : "";
      if (/[0-9]/.test(prev)) {
        result += "0";
      } else {
        result += "O";
      }
    } else {
      result += s[i];
    }
  }

  s = result.replace(/\bH20\b/g, "H2O");

  return s
    .replace(/[→⟶⟹⇌⟷]/g, "->")
    .replace(/[·•]/g, "•")
    .replace(/\s+/g, " ")
    .trim();
}

function gcdBigInt(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function lcmBigInt(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  const val = (a / gcdBigInt(a, b)) * b;
  return val < 0n ? -val : val;
}

function cloneCountMap(map: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) out[k] = v;
  return out;
}

function mergeCounts(target: Record<string, number>, source: Record<string, number>, multiplier: number = 1): Record<string, number> {
  for (const [el, count] of Object.entries(source)) {
    target[el] = (target[el] || 0) + count * multiplier;
  }
  return target;
}

function stripTrailingState(formula: string): string {
  return formula.replace(/\s*\((aq|s|l|g)\)\s*$/i, "").trim();
}

function hasUnsupportedChargeNotation(formula: string): boolean {
  return /(\^?\d*[+-]$)|([A-Za-z0-9)\]}][+-](?![A-Za-z]))/.test(formula);
}

function ensureNoLeadingCoefficient(formula: string): void {
  if (/^\d+\s*[A-Za-z([{]/.test(formula)) {
    throw new FormulaError(formula, "LEADING_COEFFICIENT");
  }
}

export class Fraction {
  n: bigint;
  d: bigint;

  constructor(n: bigint | number, d: bigint | number = 1n) {
    if (typeof n !== "bigint") n = BigInt(n);
    if (typeof d !== "bigint") d = BigInt(d);
    if (d === 0n) throw new Error("Division by zero in Fraction");

    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcdBigInt(n, d);
    this.n = n / g;
    this.d = d / g;
  }

  static zero() { return new Fraction(0n, 1n); }
  static one() { return new Fraction(1n, 1n); }

  isZero() { return this.n === 0n; }

  add(other: Fraction): Fraction {
    return new Fraction(this.n * other.d + other.n * this.d, this.d * other.d);
  }
  sub(other: Fraction): Fraction {
    return new Fraction(this.n * other.d - other.n * this.d, this.d * other.d);
  }
  mul(other: Fraction): Fraction {
    return new Fraction(this.n * other.n, this.d * other.d);
  }
  div(other: Fraction): Fraction {
    if (other.n === 0n) throw new Error("Division by zero Fraction");
    return new Fraction(this.n * other.d, this.d * other.n);
  }
  neg(): Fraction {
    return new Fraction(-this.n, this.d);
  }
}

export function parseFormulaStrict(rawFormula: string, options: { chemistryValidator?: any } = {}): Record<string, number> {
  const { chemistryValidator = null } = options;

  if (!rawFormula || !String(rawFormula).trim()) {
    throw new FormulaError("Formula is empty.");
  }

  let formula = normalizeText(rawFormula);
  formula = stripTrailingState(formula);

  if (!formula) {
    throw new FormulaError("Formula is empty after removing state symbols.");
  }

  if (hasUnsupportedChargeNotation(formula)) {
    throw new FormulaError(
      `Charged species / ionic notation is not supported in this balancer: "${rawFormula}".`,
      "IONIC_NOT_SUPPORTED"
    );
  }

  ensureNoLeadingCoefficient(formula);

  if (/->|=/.test(formula)) {
    throw new FormulaError(`Formula should be a single compound, not a whole equation: "${rawFormula}".`);
  }

  if (formula.includes("•")) {
    const parts = formula.split("•").map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) {
      throw new FormulaError(`Invalid hydrate notation: "${rawFormula}".`);
    }

    const combined: Record<string, number> = {};
    for (const part of parts) {
      const counts = parseHydratePart(part);
      mergeCounts(combined, counts, 1);
    }

    runChemistryValidation(formula, combined, chemistryValidator);
    return combined;
  }

  const counts = parseSingleFormula(formula);
  runChemistryValidation(formula, counts, chemistryValidator);
  return counts;
}

function parseHydratePart(part: string): Record<string, number> {
  const m = part.match(/^(\d+)([A-Za-z([{].*)$/);
  if (m) {
    const multiplier = parseInt(m[1], 10);
    const inner = m[2].trim();
    if (multiplier <= 0) throw new FormulaError(`Invalid hydrate multiplier in "${part}".`);
    const counts = parseSingleFormula(inner);
    const scaled: Record<string, number> = {};
    for (const [el, n] of Object.entries(counts)) scaled[el] = n * multiplier;
    return scaled;
  }
  return parseSingleFormula(part);
}

function parseSingleFormula(formula: string): Record<string, number> {
  let i = 0;
  const len = formula.length;
  const stack: Array<{ type: string; counts: Record<string, number> }> = [{ type: "root", counts: {} }];
  const openToClose: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const closeToOpen: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  function currentCounts() {
    return stack[stack.length - 1].counts;
  }

  function parseNumber() {
    let start = i;
    while (i < len && /\d/.test(formula[i])) i++;
    if (start === i) return 1;
    const value = Number(formula.slice(start, i));
    if (!Number.isInteger(value) || value <= 0) {
      throw new FormulaError(`Invalid subscript in "${formula}".`);
    }
    return value;
  }

  while (i < len) {
    const ch = formula[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (openToClose[ch]) {
      stack.push({ type: ch, counts: {} });
      i++;
      continue;
    }

    if (closeToOpen[ch]) {
      if (stack.length === 1) {
        throw new FormulaError(`Unmatched closing bracket "${ch}" in "${formula}".`);
      }
      const group = stack.pop()!;
      if (group.type !== closeToOpen[ch]) {
        throw new FormulaError(`Mismatched brackets in "${formula}".`);
      }
      i++;
      const mult = parseNumber();
      mergeCounts(currentCounts(), group.counts, mult);
      continue;
    }

    if (/[A-Z]/.test(ch)) {
      let symbol = ch;
      i++;
      if (i < len && /[a-z]/.test(formula[i])) {
        symbol += formula[i];
        i++;
      }

      if (!VALID_ELEMENTS.has(symbol)) {
        throw new FormulaError(`Unknown element symbol "${symbol}" in "${formula}".`);
      }

      const mult = parseNumber();
      currentCounts()[symbol] = (currentCounts()[symbol] || 0) + mult;
      continue;
    }

    if (/\d/.test(ch)) {
      throw new FormulaError(
        `Unexpected number at position ${i + 1} in "${formula}". ` +
        `Numbers must follow an element or a closed group.`
      );
    }

    throw new FormulaError(`Invalid character "${ch}" in "${formula}".`);
  }

  if (stack.length !== 1) {
    throw new FormulaError(`Unclosed bracket in "${formula}".`);
  }

  const result = stack[0].counts;
  if (Object.keys(result).length === 0) {
    throw new FormulaError(`No elements found in "${formula}".`);
  }
  return result;
}

function runChemistryValidation(formula: string, atomCounts: Record<string, number>, chemistryValidator: any) {
  if (!chemistryValidator) return;
  const verdict = chemistryValidator(formula, cloneCountMap(atomCounts));
  if (verdict === true || verdict == null) return;
  if (verdict === false) {
    throw new FormulaError(`Chemically invalid or unsupported formula "${formula}".`);
  }
  if (typeof verdict === "string") {
    throw new FormulaError(verdict);
  }
  throw new FormulaError(`Chemistry validator returned an invalid result for "${formula}".`);
}

function splitEquation(rawEquation: string) {
  const eq = normalizeText(rawEquation);
  const parts = eq.split("->");
  if (parts.length !== 2) {
    throw new EquationError(`Equation must contain exactly one arrow "->": "${rawEquation}"`);
  }

  const reactants = splitSide(parts[0], "reactant");
  const products = splitSide(parts[1], "product");

  if (reactants.length === 0 || products.length === 0) {
    throw new EquationError(`Equation must have at least one reactant and one product.`);
  }

  return { reactants, products };
}

function splitSide(sideText: string, label: string): string[] {
  const rawParts = sideText
    .split("+")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (rawParts.length === 0) return [];

  for (const p of rawParts) {
    if (p === "+" || p === "->") {
      throw new EquationError(`Invalid ${label} side syntax.`);
    }
  }

  return rawParts;
}

function buildMatrix(reactants: string[], products: string[], options = {}) {
  const all = [...reactants, ...products];
  const parsed = all.map(f => parseFormulaStrict(f, options));

  const elementSet = new Set<string>();
  for (const obj of parsed) {
    for (const el of Object.keys(obj)) elementSet.add(el);
  }
  const elements = Array.from(elementSet).sort();

  if (elements.length === 0) {
    throw new EquationError("No elements found in equation.");
  }

  const matrix = elements.map(el => {
    const row: Fraction[] = [];
    for (let i = 0; i < reactants.length; i++) {
      row.push(new Fraction(BigInt(parsed[i][el] || 0)));
    }
    for (let i = reactants.length; i < all.length; i++) {
      row.push(new Fraction(BigInt(-(parsed[i][el] || 0))));
    }
    return row;
  });

  return { matrix, parsed, elements };
}

function rref(matrix: Fraction[][]) {
  const m = matrix.map(row => row.map(x => new Fraction(x.n, x.d)));
  const rows = m.length;
  const cols = m[0].length;

  let lead = 0;
  const pivotCols: number[] = [];

  for (let r = 0; r < rows; r++) {
    if (lead >= cols) break;

    let i = r;
    while (i < rows && m[i][lead].isZero()) i++;

    if (i === rows) {
      lead++;
      r--;
      continue;
    }

    if (i !== r) {
      [m[i], m[r]] = [m[r], m[i]];
    }

    const pivot = m[r][lead];
    for (let c = 0; c < cols; c++) {
      m[r][c] = m[r][c].div(pivot);
    }

    for (let rr = 0; rr < rows; rr++) {
      if (rr === r) continue;
      if (m[rr][lead].isZero()) continue;
      const factor = m[rr][lead];
      for (let c = 0; c < cols; c++) {
        m[rr][c] = m[rr][c].sub(factor.mul(m[r][c]));
      }
    }

    pivotCols.push(lead);
    lead++;
  }

  return { rrefMatrix: m, pivotCols };
}

function solveNullspaceSinglePositiveInteger(matrix: Fraction[][]): bigint[] {
  const cols = matrix[0].length;
  const { rrefMatrix, pivotCols } = rref(matrix);

  const pivotSet = new Set(pivotCols);
  const freeCols: number[] = [];
  for (let c = 0; c < cols; c++) {
    if (!pivotSet.has(c)) freeCols.push(c);
  }

  if (freeCols.length === 0) {
    throw new EquationError("No non-trivial balancing solution exists.", "NO_SOLUTION");
  }

  for (const chosenFree of freeCols) {
    const sol = Array.from({ length: cols }, () => Fraction.zero());
    sol[chosenFree] = Fraction.one();

    for (let r = pivotCols.length - 1; r >= 0; r--) {
      const pivotCol = pivotCols[r];
      let sum = Fraction.zero();
      for (let c = pivotCol + 1; c < cols; c++) {
        if (!rrefMatrix[r][c].isZero()) {
          sum = sum.add(rrefMatrix[r][c].mul(sol[c]));
        }
      }
      sol[pivotCol] = sum.neg();
    }

    const ints = fractionsToMinimalIntegers(sol);
    if (ints && ints.every(v => v > 0n)) {
      return ints;
    }

    const flipped = ints ? ints.map(v => -v) : null;
    if (flipped && flipped.every(v => v > 0n)) {
      return reduceBigIntVector(flipped);
    }
  }

  throw new EquationError(
    "Could not derive a strictly positive integer solution. " +
    "This may be an unsupported or invalid equation.",
    "NO_SOLUTION"
  );
}

function fractionsToMinimalIntegers(fracs: Fraction[]): bigint[] | null {
  if (!fracs || fracs.length === 0) return null;

  let commonDen = 1n;
  for (const f of fracs) {
    commonDen = lcmBigInt(commonDen, f.d);
  }

  let ints = fracs.map(f => (f.n * (commonDen / f.d)));

  if (ints.every(v => v === 0n)) return null;

  return reduceBigIntVector(ints);
}

function reduceBigIntVector(ints: bigint[]): bigint[] {
  let g = 0n;
  for (const v of ints) {
    const abs = v < 0n ? -v : v;
    if (abs !== 0n) g = g === 0n ? abs : gcdBigInt(g, abs);
  }
  if (g === 0n) return ints;
  return ints.map(v => v / g);
}

function verifyBalanced(parsedAll: Array<Record<string, number>>, reactantCount: number, coeffs: bigint[]): boolean {
  const left: Record<string, number> = {};
  const right: Record<string, number> = {};

  for (let i = 0; i < parsedAll.length; i++) {
    const target = i < reactantCount ? left : right;
    const coeff = Number(coeffs[i]);

    for (const [el, count] of Object.entries(parsedAll[i])) {
      target[el] = (target[el] || 0) + count * coeff;
    }
  }

  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const k of keys) {
    if ((left[k] || 0) !== (right[k] || 0)) return false;
  }
  return true;
}

export interface BalancedTerm {
  formula: string;
  coefficient: number;
}

export interface BalanceResult {
  reactants: BalancedTerm[];
  products: BalancedTerm[];
  formatted: string;
}

export function balanceEquation(
  input: string | { reactants: string[]; products: string[] },
  options: { chemistryValidator?: any; formatCoefficientsAsNumber?: boolean } = {}
): BalanceResult {
  const {
    chemistryValidator = null,
    formatCoefficientsAsNumber = true
  } = options;

  let reactants: string[], products: string[];

  if (typeof input === "string") {
    const split = splitEquation(input);
    reactants = split.reactants;
    products = split.products;
  } else if (
    input &&
    Array.isArray(input.reactants) &&
    Array.isArray(input.products)
  ) {
    reactants = input.reactants.map(x => String(x).trim()).filter(Boolean);
    products = input.products.map(x => String(x).trim()).filter(Boolean);

    if (reactants.length === 0 || products.length === 0) {
      throw new EquationError("Both reactants and products must be non-empty arrays.");
    }
  } else {
    throw new EquationError(
      'Input must be either a full equation string like "H2 + O2 -> H2O" ' +
      'or an object { reactants: [...], products: [...] }.'
    );
  }

  const build = buildMatrix(reactants, products, { chemistryValidator });
  const coeffs = solveNullspaceSinglePositiveInteger(build.matrix);

  if (!verifyBalanced(build.parsed, reactants.length, coeffs)) {
    throw new EquationError("Internal verification failed: equation did not balance correctly.");
  }

  const reactantCoeffs = coeffs.slice(0, reactants.length);
  const productCoeffs = coeffs.slice(reactants.length);

  return {
    reactants: reactants.map((formula, i) => ({
      formula,
      coefficient: formatCoefficientsAsNumber ? Number(reactantCoeffs[i]) : (reactantCoeffs[i] as any)
    })),
    products: products.map((formula, i) => ({
      formula,
      coefficient: formatCoefficientsAsNumber ? Number(productCoeffs[i]) : (productCoeffs[i] as any)
    })),
    formatted: formatBalancedEquation(reactants, products, reactantCoeffs, productCoeffs)
  };
}

export function formatBalancedEquation(reactants: string[], products: string[], reactantCoeffs: bigint[], productCoeffs: bigint[]) {
  const left = reactants.map((f, i) => formatTerm(reactantCoeffs[i], f)).join(" + ");
  const right = products.map((f, i) => formatTerm(productCoeffs[i], f)).join(" + ");
  return `${left} -> ${right}`;
}

function formatTerm(coeff: bigint, formula: string) {
  const c = typeof coeff === "bigint" ? coeff : BigInt(coeff);
  return c === 1n ? formula : `${c}${formula}`;
}

export function demoChemistryValidator(formula: string, atomCounts: Record<string, number>): boolean {
  const totalAtoms = Object.values(atomCounts).reduce((a, b) => a + b, 0);
  if (totalAtoms > 200) {
    throw new FormulaError(
      `This formula looks unusual (total ${totalAtoms} atoms). Please check the subscripts.`,
      "SUSPICIOUS_FORMULA"
    );
  }

  const elements = Object.keys(atomCounts);
  if (elements.length === 1) {
    const el = elements[0];
    const count = atomCounts[el];
    const diatomic = ["H", "N", "F", "Cl", "Br", "I"];
    
    if (diatomic.includes(el) && count !== 2) {
      throw new FormulaError(
        `${el} should be written as ${el}2, not ${formula}.`,
        "INVALID_ELEMENTAL_FORM"
      );
    }
    
    if (el === "O" && count !== 2 && count !== 3) {
      throw new FormulaError(
        `Oxygen should be written as O2 (or O3), not ${formula}.`,
        "INVALID_ELEMENTAL_FORM"
      );
    }
  }

  if (
    Object.keys(atomCounts).length === 2 &&
    atomCounts.H &&
    atomCounts.O &&
    atomCounts.H >= 10 &&
    atomCounts.O === 1
  ) {
    throw new FormulaError(
      `Unsupported or chemically implausible formula "${formula}".`,
      "SUSPICIOUS_FORMULA"
    );
  }

  return true;
}

export function formatReactionError(errorMessage: string): string {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return "We couldn't parse this formula. Please double-check your spelling and formatting.";
  }

  if (/Invalid character:\s*[a-z]/.test(errorMessage)) {
    return "Unrecognized element symbol. Remember that chemical elements must start with a capital letter (e.g., 'Na' instead of 'na', 'H2O' instead of 'Water').";
  }

  if (/(unmatched|mismatched).*parenthes/i.test(errorMessage) || 
      /(unmatched|mismatched).*bracket/i.test(errorMessage) || 
      /unclosed/i.test(errorMessage)) {
    return "Mismatched brackets. Please check your formula and make sure all parentheses are closed properly (e.g., 'Ca(OH)2').";
  }

  const specialCharMatch = errorMessage.match(/Invalid character:\s*([^a-zA-Z0-9\s])/);
  if (specialCharMatch) {
    const invalidChar = specialCharMatch[1];
    return `Special characters like '${invalidChar}' are not allowed. Please use standard chemical formulas and '+' to separate reactants.`;
  }

  if (/Invalid|Parse|Syntax|undefined/i.test(errorMessage) || errorMessage.length < 25) {
    return "We couldn't parse this formula. Please double-check your spelling and formatting.";
  }

  return errorMessage;
}
