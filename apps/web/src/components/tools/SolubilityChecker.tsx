"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Beaker, AlertCircle, HelpCircle, Table, Check, X } from "lucide-react";
import { isSoluble } from "@kimi/chemistry-engine";

const PRESETS = ["NaCl", "AgCl", "BaSO4", "Ca(OH)2", "PbI2", "Na2CO3"];

const CATIONS = [
  { symbol: "NH4", label: "Ammonium (NH₄⁺)" },
  { symbol: "Na", label: "Sodium (Na⁺)" },
  { symbol: "K", label: "Potassium (K⁺)" },
  { symbol: "Ca", label: "Calcium (Ca²⁺)" },
  { symbol: "Ba", label: "Barium (Ba²⁺)" },
  { symbol: "Fe", label: "Iron(II) (Fe²⁺)" },
  { symbol: "Cu", label: "Copper(II) (Cu²⁺)" },
  { symbol: "Ag", label: "Silver (Ag⁺)" },
  { symbol: "Pb", label: "Lead (Pb²⁺)" }
];

const ANIONS = [
  { symbol: "NO3", label: "Nitrate (NO₃⁻)" },
  { symbol: "Cl", label: "Chloride (Cl⁻)" },
  { symbol: "SO4", label: "Sulfate (SO₄²⁻)" },
  { symbol: "OH", label: "Hydroxide (OH⁻)" },
  { symbol: "CO3", label: "Carbonate (CO₃²⁻)" },
  { symbol: "S", label: "Sulfide (S²⁻)" }
];

interface SolubilityCheckerProps {
  onClose?: () => void;
}

export default function SolubilityChecker({ onClose }: SolubilityCheckerProps = {}) {
  const t = useTranslations("solubility");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [activeCell, setActiveCell] = useState<{ cation: string; anion: string } | null>(null);

  const checkSolubilityRegex = (formula: string) => {
    const f = formula.trim().replace(/\s+/g, "");
    if (!f) return null;

    // 1. Group 1 & Ammonium (Li, Na, K, Rb, Cs, NH4)
    if (/(Li|Na|K|Rb|Cs)(?![a-z])/.test(f) || /NH4/.test(f)) {
      return {
        soluble: true,
        reason: t("reasonGroup1"),
      };
    }
    // 2. Nitrates & Acetates (NO3, CH3COO, C2H3O2)
    if (/NO3/.test(f) || /CH3COO/.test(f) || /C2H3O2/.test(f)) {
      return {
        soluble: true,
        reason: t("reasonNitrateAcetate"),
      };
    }
    // 3. Halides (Cl, Br, I) - not ClO, BrO
    if (/(Cl|Br|I)(?![a-z])(?!O)/.test(f)) {
      if (/(Ag|Pb|Hg)/.test(f)) {
        return {
          soluble: false,
          reason: t("reasonHalideException"),
        };
      }
      return {
        soluble: true,
        reason: t("reasonHalideGeneral"),
      };
    }
    // 4. Sulfates (SO4)
    if (/SO4/.test(f)) {
      if (/(Ca|Sr|Ba|Pb|Ag)/.test(f)) {
        return {
          soluble: false,
          reason: t("reasonSulfateException"),
        };
      }
      return {
        soluble: true,
        reason: t("reasonSulfateGeneral"),
      };
    }
    // 5. Hydroxides (OH)
    if (/(OH|\(OH\))/.test(f)) {
      if (/(Ca|Sr|Ba)/.test(f)) {
        return {
          soluble: true,
          reason: t("reasonHydroxideGroup2"),
        };
      }
      return {
        soluble: false,
        reason: t("reasonHydroxideGeneral"),
      };
    }
    // 6. Sulfides (S) - not SO4, SO3
    if (/S(?!O)(?![a-z])/.test(f)) {
      if (/(Li|Na|K|Rb|Cs|NH4|Be|Mg|Ca|Sr|Ba)/.test(f)) {
        return {
          soluble: true,
          reason: t("reasonSulfideException"),
        };
      }
      return {
        soluble: false,
        reason: t("reasonSulfideGeneral"),
      };
    }
    // 7. Carbonates & Phosphates
    if (/CO3/.test(f) || /PO4/.test(f)) {
      return {
        soluble: false,
        reason: t("reasonCarbonatePhosphateSulfide"),
      };
    }

    // Fallback: try parsing cation/anion automatically
    // Very simple fallback: look for first uppercase letter block for cation, and common anion
    let matchedCation = "";
    let matchedAnion = "";
    
    // Check known anions first
    for (const an of ANIONS) {
      if (f.includes(an.symbol)) {
        matchedAnion = an.symbol;
        break;
      }
    }
    // Check known cations next
    for (const cat of CATIONS) {
      if (f.startsWith(cat.symbol)) {
        matchedCation = cat.symbol;
        break;
      }
    }

    if (matchedCation && matchedAnion) {
      const solubleStatus = isSoluble(matchedCation, matchedAnion);
      return {
        soluble: solubleStatus,
        reason: solubleStatus 
          ? `Derived solubility: ${matchedCation} with ${matchedAnion} is generally soluble.` 
          : `Derived solubility: ${matchedCation} with ${matchedAnion} forms an insoluble precipitate.`
      };
    }

    return {
      unknown: true,
      reason: t("unknownSubtitle")
    };
  };

  const handleCheck = (val: string) => {
    if (!val.trim()) return;
    const res = checkSolubilityRegex(val);
    setResult(res ? { formula: val, ...res } : null);
  };

  const handlePreset = (preset: string) => {
    setInput(preset);
    handleCheck(preset);
  };

  const handleCellClick = (cat: string, an: string) => {
    setActiveCell({ cation: cat, anion: an });
    const formulaStr = `${cat}${an}`;
    const res = checkSolubilityRegex(formulaStr);
    setResult(res ? { formula: formulaStr, ...res } : null);
  };

  const renderFormulaJSX = (formula: string) => {
    const parts = formula.split(/(\d+)/);
    return (
      <span className="font-mono font-semibold">
        {parts.map((part, i) => {
          if (/^\d+$/.test(part)) {
            return <sub key={i} className="text-[75%] bottom-[-0.25em]">{part}</sub>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="w-full max-w-none mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4 w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
            <Beaker className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {t("title")}
            </h2>
            <p className="text-sm text-zinc-650 dark:text-zinc-400">
              Check the solubility of ionic compounds in water and inspect solubility rules.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-805 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-xl transition-all border border-zinc-200 dark:border-zinc-800/80 active:scale-95 cursor-pointer self-start"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Input Form & Results */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none">
            <div className="space-y-2">
              <label htmlFor="sol-input" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("enterFormula")}
              </label>
              <div className="flex gap-2">
                <input
                  id="sol-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCheck(input);
                  }}
                  placeholder={t("inputPlaceholder")}
                  className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-405 dark:placeholder-zinc-500 font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={() => handleCheck(input)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium px-4 rounded-xl transition-all shadow-md shadow-emerald-500/15 active:scale-[0.98] text-xs font-semibold cursor-pointer"
                >
                  Check
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider block">Common Presets</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePreset(preset)}
                    className="bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg transition-all font-mono hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-95 cursor-pointer"
                  >
                    {renderFormulaJSX(preset)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          {result && (
            <div className="bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-5 space-y-4 animate-in fade-in duration-300 shadow-sm dark:shadow-none">
              <div className="border-b border-zinc-200 dark:border-zinc-850 pb-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-zinc-850 dark:text-zinc-100">{renderFormulaJSX(result.formula)}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono">Result</span>
              </div>

              {result.unknown ? (
                <div className="space-y-2">
                  <div className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                    <HelpCircle className="w-5 h-5" />
                    <span>{t("unknown")}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {result.reason}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-base font-bold flex items-center gap-2">
                    {result.soluble ? (
                      <span className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg px-2 py-1 flex items-center gap-1.5 text-xs">
                        <Check className="w-4 h-4" />
                        {t("likelySoluble")}
                      </span>
                    ) : (
                      <span className="bg-rose-50 dark:bg-rose-500/10 border border-rose-250 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg px-2 py-1 flex items-center gap-1.5 text-xs">
                        <X className="w-4 h-4" />
                        {t("likelyInsoluble")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-855 rounded-xl p-3">
                    <strong>Rule:</strong> {result.reason}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Grid Table Reference */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Interactive Solubility Table
            </h3>
            <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">
              Click any cell in the grid to check its solubility status and corresponding rule details.
            </p>

            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 p-2">
              <table className="w-full text-center border-collapse text-[10px] sm:text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-850 text-zinc-550 dark:text-zinc-400">
                    <th className="p-2 text-left font-semibold">Cation \ Anion</th>
                    {ANIONS.map((an) => (
                      <th key={an.symbol} className="p-2 font-mono font-medium">
                        {an.symbol}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                  {CATIONS.map((cat) => (
                    <tr key={cat.symbol} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-2 text-left font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {cat.symbol}
                      </td>
                      {ANIONS.map((an) => {
                        const isSol = isSoluble(cat.symbol, an.symbol);
                        const isActive = activeCell?.cation === cat.symbol && activeCell?.anion === an.symbol;
                        return (
                          <td key={an.symbol} className="p-1">
                            <button
                              onClick={() => handleCellClick(cat.symbol, an.symbol)}
                              className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center mx-auto transition-all cursor-pointer ${
                                isSol
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                              } ${isActive ? "ring-2 ring-emerald-500 dark:ring-emerald-400 scale-105" : ""}`}
                              title={`${cat.label} + ${an.label}`}
                            >
                              {isSol ? "S" : "I"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 text-[10px] text-zinc-500 dark:text-zinc-500 font-semibold justify-end">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-205 dark:border-emerald-500/20 inline-block text-center font-bold">S</span> Soluble
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-205 dark:border-rose-500/20 inline-block text-center font-bold">I</span> Insoluble
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
