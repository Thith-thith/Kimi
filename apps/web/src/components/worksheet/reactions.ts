export interface RawReaction {
  reactants: string[];
  products: string[];
  coefficients: number[];
  type: "synthesis" | "decomposition" | "singleReplacement" | "doubleReplacement" | "combustion";
}

export const getReactionDifficulty = (
  reactants: string[],
  products: string[],
  coefficients: number[],
  type: string
): "easy" | "medium" | "hard" => {
  let score = 1.5; // Base
  const coeffSum = coefficients.reduce((a, b) => a + b, 0);
  const hasParen =
    reactants.some((r) => r.includes("(")) || products.some((p) => p.includes("("));

  // Typology weights
  if (type === "combustion") score += 2;
  else if (type === "singleReplacement") score += 1;
  else if (type === "decomposition") score += 0.5;

  // Structure weights
  if (hasParen) score += 1;
  if (coeffSum > 12) score += 1;
  if (coeffSum <= 5) score -= 0.5;

  if (score <= 2.5) return "easy";
  if (score >= 3.5) return "hard";
  return "medium";
};

export const RAW_REACTIONS: RawReaction[] = [
  // Synthesis
  { reactants: ["Na", "Cl2"], products: ["NaCl"], coefficients: [2, 1, 2], type: "synthesis" },
  { reactants: ["Mg", "O2"], products: ["MgO"], coefficients: [2, 1, 2], type: "synthesis" },
  { reactants: ["Fe", "O2"], products: ["Fe2O3"], coefficients: [4, 3, 2], type: "synthesis" },
  { reactants: ["Al", "O2"], products: ["Al2O3"], coefficients: [4, 3, 2], type: "synthesis" },
  { reactants: ["H2", "O2"], products: ["H2O"], coefficients: [2, 1, 2], type: "synthesis" },
  { reactants: ["N2", "H2"], products: ["NH3"], coefficients: [1, 3, 2], type: "synthesis" },
  { reactants: ["Ca", "O2"], products: ["CaO"], coefficients: [2, 1, 2], type: "synthesis" },
  { reactants: ["K", "Br2"], products: ["KBr"], coefficients: [2, 1, 2], type: "synthesis" },
  { reactants: ["Li", "N2"], products: ["Li3N"], coefficients: [6, 1, 2], type: "synthesis" },
  { reactants: ["P4", "O2"], products: ["P4O10"], coefficients: [1, 5, 1], type: "synthesis" },
  { reactants: ["S", "O2"], products: ["SO2"], coefficients: [1, 1, 1], type: "synthesis" },
  { reactants: ["Fe", "S"], products: ["FeS"], coefficients: [1, 1, 1], type: "synthesis" },
  { reactants: ["Cu", "S"], products: ["Cu2S"], coefficients: [2, 1, 1], type: "synthesis" },
  { reactants: ["Zn", "Cl2"], products: ["ZnCl2"], coefficients: [1, 1, 1], type: "synthesis" },
  { reactants: ["Ca", "N2"], products: ["Ca3N2"], coefficients: [3, 1, 1], type: "synthesis" },
  { reactants: ["Ba", "O2"], products: ["BaO"], coefficients: [2, 1, 2], type: "synthesis" },
  { reactants: ["Sr", "Cl2"], products: ["SrCl2"], coefficients: [1, 1, 1], type: "synthesis" },
  { reactants: ["Mg", "N2"], products: ["Mg3N2"], coefficients: [3, 1, 1], type: "synthesis" },
  { reactants: ["Al", "S"], products: ["Al2S3"], coefficients: [2, 3, 1], type: "synthesis" },
  { reactants: ["Fe", "Cl2"], products: ["FeCl3"], coefficients: [2, 3, 2], type: "synthesis" },
  { reactants: ["Sn", "O2"], products: ["SnO2"], coefficients: [1, 1, 1], type: "synthesis" },
  { reactants: ["Ti", "O2"], products: ["TiO2"], coefficients: [1, 1, 1], type: "synthesis" },
  { reactants: ["Cu", "O2"], products: ["CuO"], coefficients: [2, 1, 2], type: "synthesis" },
  { reactants: ["Pb", "O2"], products: ["PbO"], coefficients: [2, 1, 2], type: "synthesis" },

  // Decomposition
  { reactants: ["H2O2"], products: ["H2O", "O2"], coefficients: [2, 2, 1], type: "decomposition" },
  { reactants: ["HgO"], products: ["Hg", "O2"], coefficients: [2, 2, 1], type: "decomposition" },
  { reactants: ["KClO3"], products: ["KCl", "O2"], coefficients: [2, 2, 3], type: "decomposition" },
  { reactants: ["CaCO3"], products: ["CaO", "CO2"], coefficients: [1, 1, 1], type: "decomposition" },
  { reactants: ["NaHCO3"], products: ["Na2CO3", "H2O", "CO2"], coefficients: [2, 1, 1, 1], type: "decomposition" },
  { reactants: ["NH4NO3"], products: ["N2O", "H2O"], coefficients: [1, 1, 2], type: "decomposition" },
  { reactants: ["Mg(OH)2"], products: ["MgO", "H2O"], coefficients: [1, 1, 1], type: "decomposition" },
  { reactants: ["Al2O3"], products: ["Al", "O2"], coefficients: [2, 4, 3], type: "decomposition" },
  { reactants: ["PbO2"], products: ["PbO", "O2"], coefficients: [2, 2, 1], type: "decomposition" },
  { reactants: ["H2CO3"], products: ["H2O", "CO2"], coefficients: [1, 1, 1], type: "decomposition" },
  { reactants: ["Na2CO3"], products: ["Na2O", "CO2"], coefficients: [1, 1, 1], type: "decomposition" },
  { reactants: ["BaCO3"], products: ["BaO", "CO2"], coefficients: [1, 1, 1], type: "decomposition" },
  { reactants: ["Fe2O3"], products: ["Fe", "O2"], coefficients: [2, 4, 3], type: "decomposition" },
  { reactants: ["AgNO3"], products: ["Ag", "NO2", "O2"], coefficients: [2, 2, 2, 1], type: "decomposition" },
  { reactants: ["Pb(NO3)2"], products: ["PbO", "NO2", "O2"], coefficients: [2, 2, 4, 1], type: "decomposition" },
  { reactants: ["Ca(OH)2"], products: ["CaO", "H2O"], coefficients: [1, 1, 1], type: "decomposition" },
  { reactants: ["NaNO3"], products: ["NaNO2", "O2"], coefficients: [2, 2, 1], type: "decomposition" },
  { reactants: ["KNO3"], products: ["KNO2", "O2"], coefficients: [2, 2, 1], type: "decomposition" },

  // Single Replacement
  { reactants: ["Zn", "HCl"], products: ["ZnCl2", "H2"], coefficients: [1, 2, 1, 1], type: "singleReplacement" },
  { reactants: ["Fe", "CuSO4"], products: ["FeSO4", "Cu"], coefficients: [1, 1, 1, 1], type: "singleReplacement" },
  { reactants: ["Mg", "HCl"], products: ["MgCl2", "H2"], coefficients: [1, 2, 1, 1], type: "singleReplacement" },
  { reactants: ["Na", "H2O"], products: ["NaOH", "H2"], coefficients: [2, 2, 2, 1], type: "singleReplacement" },
  { reactants: ["K", "H2O"], products: ["KOH", "H2"], coefficients: [2, 2, 2, 1], type: "singleReplacement" },
  { reactants: ["Ca", "H2O"], products: ["Ca(OH)2", "H2"], coefficients: [1, 2, 1, 1], type: "singleReplacement" },
  { reactants: ["Al", "HCl"], products: ["AlCl3", "H2"], coefficients: [2, 6, 2, 3], type: "singleReplacement" },
  { reactants: ["Zn", "AgNO3"], products: ["Zn(NO3)2", "Ag"], coefficients: [1, 2, 1, 2], type: "singleReplacement" },
  { reactants: ["Cu", "AgNO3"], products: ["Cu(NO3)2", "Ag"], coefficients: [1, 2, 1, 2], type: "singleReplacement" },
  { reactants: ["Fe", "HCl"], products: ["FeCl2", "H2"], coefficients: [1, 2, 1, 1], type: "singleReplacement" },
  { reactants: ["Mg", "H2SO4"], products: ["MgSO4", "H2"], coefficients: [1, 1, 1, 1], type: "singleReplacement" },
  { reactants: ["Li", "H2O"], products: ["LiOH", "H2"], coefficients: [2, 2, 2, 1], type: "singleReplacement" },
  { reactants: ["Al", "Fe2O3"], products: ["Al2O3", "Fe"], coefficients: [2, 1, 1, 2], type: "singleReplacement" },
  { reactants: ["Zn", "CuCl2"], products: ["ZnCl2", "Cu"], coefficients: [1, 1, 1, 1], type: "singleReplacement" },
  { reactants: ["Fe", "H2SO4"], products: ["FeSO4", "H2"], coefficients: [1, 1, 1, 1], type: "singleReplacement" },
  { reactants: ["Mg", "CuSO4"], products: ["MgSO4", "Cu"], coefficients: [1, 1, 1, 1], type: "singleReplacement" },
  { reactants: ["Ca", "HCl"], products: ["CaCl2", "H2"], coefficients: [1, 2, 1, 1], type: "singleReplacement" },
  { reactants: ["Ba", "H2O"], products: ["Ba(OH)2", "H2"], coefficients: [1, 2, 1, 1], type: "singleReplacement" },
  { reactants: ["Sr", "H2O"], products: ["Sr(OH)2", "H2"], coefficients: [1, 2, 1, 1], type: "singleReplacement" },
  { reactants: ["Al", "CuSO4"], products: ["Al2(SO4)3", "Cu"], coefficients: [2, 3, 1, 3], type: "singleReplacement" },

  // Combustion
  { reactants: ["CH4", "O2"], products: ["CO2", "H2O"], coefficients: [1, 2, 1, 2], type: "combustion" },
  { reactants: ["C2H6", "O2"], products: ["CO2", "H2O"], coefficients: [2, 7, 4, 6], type: "combustion" },
  { reactants: ["C3H8", "O2"], products: ["CO2", "H2O"], coefficients: [1, 5, 3, 4], type: "combustion" },
  { reactants: ["C4H10", "O2"], products: ["CO2", "H2O"], coefficients: [2, 13, 8, 10], type: "combustion" },
  { reactants: ["C2H5OH", "O2"], products: ["CO2", "H2O"], coefficients: [1, 3, 2, 3], type: "combustion" },
  { reactants: ["C6H12O6", "O2"], products: ["CO2", "H2O"], coefficients: [1, 6, 6, 6], type: "combustion" },
  { reactants: ["C2H2", "O2"], products: ["CO2", "H2O"], coefficients: [2, 5, 4, 2], type: "combustion" },
  { reactants: ["C6H6", "O2"], products: ["CO2", "H2O"], coefficients: [2, 15, 12, 6], type: "combustion" },
  { reactants: ["CH3OH", "O2"], products: ["CO2", "H2O"], coefficients: [2, 3, 2, 4], type: "combustion" },
  { reactants: ["C5H12", "O2"], products: ["CO2", "H2O"], coefficients: [1, 8, 5, 6], type: "combustion" },
  { reactants: ["C2H4", "O2"], products: ["CO2", "H2O"], coefficients: [1, 3, 2, 2], type: "combustion" },
  { reactants: ["C3H6", "O2"], products: ["CO2", "H2O"], coefficients: [2, 9, 6, 6], type: "combustion" },
  { reactants: ["C7H16", "O2"], products: ["CO2", "H2O"], coefficients: [1, 11, 7, 8], type: "combustion" },
  { reactants: ["C8H18", "O2"], products: ["CO2", "H2O"], coefficients: [2, 25, 16, 18], type: "combustion" },
  { reactants: ["C3H4", "O2"], products: ["CO2", "H2O"], coefficients: [1, 4, 3, 2], type: "combustion" },
  { reactants: ["C4H8", "O2"], products: ["CO2", "H2O"], coefficients: [1, 6, 4, 4], type: "combustion" },
  { reactants: ["C6H14", "O2"], products: ["CO2", "H2O"], coefficients: [2, 19, 12, 14], type: "combustion" },
  { reactants: ["C10H22", "O2"], products: ["CO2", "H2O"], coefficients: [2, 31, 20, 22], type: "combustion" },

  // Double Replacement
  { reactants: ["HCl", "NaOH"], products: ["NaCl", "H2O"], coefficients: [1, 1, 1, 1], type: "doubleReplacement" },
  { reactants: ["H2SO4", "NaOH"], products: ["Na2SO4", "H2O"], coefficients: [1, 2, 1, 2], type: "doubleReplacement" },
  { reactants: ["HNO3", "KOH"], products: ["KNO3", "H2O"], coefficients: [1, 1, 1, 1], type: "doubleReplacement" },
  { reactants: ["H2SO4", "KOH"], products: ["K2SO4", "H2O"], coefficients: [1, 2, 1, 2], type: "doubleReplacement" },
  { reactants: ["HCl", "Ca(OH)2"], products: ["CaCl2", "H2O"], coefficients: [2, 1, 1, 2], type: "doubleReplacement" },
  { reactants: ["H2SO4", "Ca(OH)2"], products: ["CaSO4", "H2O"], coefficients: [1, 1, 1, 2], type: "doubleReplacement" },
  { reactants: ["HCl", "Ba(OH)2"], products: ["BaCl2", "H2O"], coefficients: [2, 1, 1, 2], type: "doubleReplacement" },
  { reactants: ["H3PO4", "NaOH"], products: ["Na3PO4", "H2O"], coefficients: [1, 3, 1, 3], type: "doubleReplacement" },
  { reactants: ["H2CO3", "NaOH"], products: ["Na2CO3", "H2O"], coefficients: [1, 2, 1, 2], type: "doubleReplacement" },
  { reactants: ["AgNO3", "NaCl"], products: ["AgCl", "NaNO3"], coefficients: [1, 1, 1, 1], type: "doubleReplacement" },
  { reactants: ["BaCl2", "Na2SO4"], products: ["BaSO4", "NaCl"], coefficients: [1, 1, 1, 2], type: "doubleReplacement" },
  { reactants: ["Pb(NO3)2", "KI"], products: ["PbI2", "KNO3"], coefficients: [1, 2, 1, 2], type: "doubleReplacement" },
  { reactants: ["CaCl2", "Na2CO3"], products: ["CaCO3", "NaCl"], coefficients: [1, 1, 1, 2], type: "doubleReplacement" },
  { reactants: ["FeCl3", "NaOH"], products: ["Fe(OH)3", "NaCl"], coefficients: [1, 3, 1, 3], type: "doubleReplacement" },
  { reactants: ["CuSO4", "NaOH"], products: ["Cu(OH)2", "Na2SO4"], coefficients: [1, 2, 1, 1], type: "doubleReplacement" },
  { reactants: ["AgNO3", "K2CrO4"], products: ["Ag2CrO4", "KNO3"], coefficients: [2, 1, 1, 2], type: "doubleReplacement" },
  { reactants: ["MgCl2", "NaOH"], products: ["Mg(OH)2", "NaCl"], coefficients: [1, 2, 1, 2], type: "doubleReplacement" },
  { reactants: ["ZnSO4", "NaOH"], products: ["Zn(OH)2", "Na2SO4"], coefficients: [1, 2, 1, 1], type: "doubleReplacement" },
  { reactants: ["AlCl3", "NaOH"], products: ["Al(OH)3", "NaCl"], coefficients: [1, 3, 1, 3], type: "doubleReplacement" },
  { reactants: ["Na2CO3", "HCl"], products: ["NaCl", "H2O", "CO2"], coefficients: [1, 2, 2, 1, 1], type: "doubleReplacement" },
  { reactants: ["CaCO3", "HCl"], products: ["CaCl2", "H2O", "CO2"], coefficients: [1, 2, 1, 1, 1], type: "doubleReplacement" },
  { reactants: ["NaHCO3", "HCl"], products: ["NaCl", "H2O", "CO2"], coefficients: [1, 1, 1, 1, 1], type: "doubleReplacement" },
  { reactants: ["Na2S", "HCl"], products: ["NaCl", "H2S"], coefficients: [1, 2, 2, 1], type: "doubleReplacement" },
  { reactants: ["NH4Cl", "NaOH"], products: ["NaCl", "H2O", "NH3"], coefficients: [1, 1, 1, 1, 1], type: "doubleReplacement" },
  { reactants: ["(NH4)2SO4", "NaOH"], products: ["Na2SO4", "H2O", "NH3"], coefficients: [1, 2, 1, 2, 2], type: "doubleReplacement" }
];
