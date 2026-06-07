"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calculator, AlertCircle, Plus, Trash2, HelpCircle, Layers, Clipboard, Check, X } from "lucide-react";
import {
  calculateMolarMassModal,
  atomicMasses,
  calculateEmpiricalModal,
  EMPIRICAL_PRESETS,
  EmpiricalResult,
  MolarMassResult
} from "@kimi/chemistry-engine";

const MOLAR_PRESETS = [
  { formula: "H2O", label: "H₂O (Water)" },
  { formula: "NaCl", label: "NaCl (Salt)" },
  { formula: "C6H12O6", label: "C₆H₁₂O₆ (Glucose)" },
  { formula: "H2SO4", label: "H₂SO₄ (Sulfuric Acid)" },
  { formula: "CaCO3", label: "CaCO₃ (Calcium Carbonate)" }
];

interface ElementRow {
  symbol: string;
  percent: string;
}

interface MolarMassCalculatorProps {
  onClose?: () => void;
}

export default function MolarMassCalculator({ onClose }: MolarMassCalculatorProps = {}) {
  const t = useTranslations("tools");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<"molar" | "empirical">("molar");

  const getPresetName = (name: string) => {
    if (locale === "zh" || locale === "zh-Hant") {
      return name.match(/\(([^)]+)\)/)?.[1] || name;
    }
    return name.replace(/\s*\([^)]+\)/, "");
  };

  // Molar Mass States
  const [formula, setFormula] = useState("");
  const [exact, setExact] = useState(true);
  const [molarResult, setMolarResult] = useState<MolarMassResult | null>(null);
  const [molarError, setMolarError] = useState<string | null>(null);
  const [copiedMolar, setCopiedMolar] = useState(false);

  // Empirical States
  const [empiricalRows, setEmpiricalRows] = useState<ElementRow[]>([
    { symbol: "C", percent: "40.0" },
    { symbol: "H", percent: "6.7" },
    { symbol: "O", percent: "53.3" }
  ]);
  const [molecularMassInput, setMolecularMassInput] = useState("180.16");
  const [empiricalResult, setEmpiricalResult] = useState<EmpiricalResult | null>(null);
  const [empiricalError, setEmpiricalError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // --- Molar Mass Logic ---
  const handleCalculateMolar = (val: string) => {
    if (!val.trim()) return;
    setMolarError(null);
    setMolarResult(null);
    try {
      const res = calculateMolarMassModal(val, exact);
      setMolarResult(res);
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to calculate molar mass. Check formula syntax.";
      setMolarError(errMsg);
    }
  };

  const handleMolarPreset = (f: string) => {
    setFormula(f);
    handleCalculateMolar(f);
  };

  const copyMolarMassToClipboard = () => {
    if (molarResult) {
      navigator.clipboard.writeText(String(molarResult.total));
      setCopiedMolar(true);
      setTimeout(() => setCopiedMolar(false), 2000);
    }
  };

  // --- Empirical Formula Logic ---
  const handleAddRow = () => {
    setActivePreset(null);
    setEmpiricalRows([...empiricalRows, { symbol: "", percent: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    setActivePreset(null);
    setEmpiricalRows(empiricalRows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof ElementRow, value: string) => {
    setActivePreset(null);
    const updated = [...empiricalRows];
    updated[index][field] = value;
    setEmpiricalRows(updated);
  };

  const handleCalculateEmpirical = () => {
    setEmpiricalError(null);
    setEmpiricalResult(null);

    // Validate inputs
    const elementsData = [];
    for (let i = 0; i < empiricalRows.length; i++) {
      const { symbol, percent } = empiricalRows[i];
      const cleanSymbol = symbol.trim();
      const cleanPercent = parseFloat(percent.trim());

      if (!cleanSymbol) {
        setEmpiricalError(`Element symbol in row ${i + 1} cannot be empty.`);
        return;
      }
      if (!atomicMasses[cleanSymbol]) {
        setEmpiricalError(`"${cleanSymbol}" is not a recognized element symbol.`);
        return;
      }
      if (isNaN(cleanPercent) || cleanPercent <= 0) {
        setEmpiricalError(`Percentage/mass composition in row ${i + 1} must be a positive number.`);
        return;
      }

      elementsData.push({ symbol: cleanSymbol, percent: cleanPercent });
    }

    if (elementsData.length < 2) {
      setEmpiricalError("Please specify at least 2 elements.");
      return;
    }

    const molMassNum = molecularMassInput.trim() ? parseFloat(molecularMassInput.trim()) : null;
    if (molecularMassInput.trim() && (molMassNum === null || isNaN(molMassNum) || molMassNum <= 0)) {
      setEmpiricalError("Molecular mass must be a positive number (or empty).");
      return;
    }

    try {
      const res = calculateEmpiricalModal({
        elements: elementsData,
        molecularMass: molMassNum
      });
      setEmpiricalResult(res);
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to calculate empirical formula.";
      setEmpiricalError(errMsg);
    }
  };

  const handleEmpiricalPreset = (preset: typeof EMPIRICAL_PRESETS[0]) => {
    setActivePreset(preset.name);
    const rows = preset.elements.map(e => ({
      symbol: e.symbol,
      percent: String(e.percent)
    }));
    setEmpiricalRows(rows);
    setMolecularMassInput(preset.molMass ? String(preset.molMass) : "");
    
    // Auto-calculate
    setErrorAndCalculate(rows, preset.molMass);
  };

  const setErrorAndCalculate = (rows: ElementRow[], molMass: number | null) => {
    setEmpiricalError(null);
    setEmpiricalResult(null);

    const elementsData = rows.map(r => ({
      symbol: r.symbol.trim(),
      percent: parseFloat(r.percent)
    }));

    try {
      const res = calculateEmpiricalModal({
        elements: elementsData,
        molecularMass: molMass
      });
      setEmpiricalResult(res);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error running preset.";
      setEmpiricalError(errMsg);
    }
  };

  // --- Rendering Helpers ---
  const renderFormulaJSX = (formStr: string) => {
    if (!formStr) return "—";
    const parts = formStr.split(/(\d+)/);
    return (
      <span className="font-mono font-bold">
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
      {/* Tab Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {activeTab === "molar" ? t("molarMassName") : t("empiricalName")}
            </h2>
            <p className="text-sm text-zinc-650 dark:text-zinc-400">
              {activeTab === "molar" ? t("molarMassDesc") : t("empiricalDesc")}
            </p>
          </div>
        </div>

        {/* Pill Tabs & Close Button */}
        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="flex bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800/80 w-fit">
            <button
              onClick={() => {
                setActiveTab("molar");
                setEmpiricalError(null);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "molar"
                  ? "bg-white dark:bg-zinc-800 text-amber-750 dark:text-amber-400 border border-zinc-200/80 dark:border-amber-500/20 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border border-transparent"
              }`}
            >
              Molar Mass
            </button>
            <button
              onClick={() => {
                setActiveTab("empirical");
                setMolarError(null);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "empirical"
                  ? "bg-white dark:bg-zinc-800 text-amber-755 dark:text-amber-400 border border-zinc-200/80 dark:border-amber-500/20 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border border-transparent"
              }`}
            >
              Empirical Formula
            </button>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-450 dark:hover:text-white rounded-xl transition-all border border-zinc-200 dark:border-zinc-800/80 active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* --- MOLAR MASS TAB --- */}
      {activeTab === "molar" && (
        <div className="space-y-6">
          {/* Input Box */}
          <div className="bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label htmlFor="molar-input" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Enter Chemical Formula
                </label>
                <input
                  id="molar-input"
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCalculateMolar(formula);
                  }}
                  placeholder="e.g. H2SO4  or  C6H12O6"
                  className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 font-mono focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 h-12">
                {/* Precision Selector */}
                <div className="flex bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setExact(true)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      exact ? "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white shadow-xs border border-zinc-200/50 dark:border-transparent" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                    }`}
                  >
                    Exact (4 sig.fig)
                  </button>
                  <button
                    onClick={() => setExact(false)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      !exact ? "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white shadow-xs border border-zinc-200/50 dark:border-transparent" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                    }`}
                  >
                    Rounded
                  </button>
                </div>

                <button
                  onClick={() => handleCalculateMolar(formula)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-6 h-full rounded-xl transition-all shadow-md shadow-amber-500/15 active:scale-[0.98] cursor-pointer"
                >
                  Calculate
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider block">Common Presets</span>
              <div className="flex flex-wrap gap-2">
                {MOLAR_PRESETS.map((preset) => (
                  <button
                    key={preset.formula}
                    onClick={() => handleMolarPreset(preset.formula)}
                    className="bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs px-3 py-1.5 rounded-lg transition-all font-mono hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-95 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Molar Error */}
          {molarError && (
            <div className="bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{molarError}</div>
            </div>
          )}

          {/* Molar Results */}
          {molarResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {/* Left Column: Total Mass Summary */}
              <div className="bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm dark:shadow-none">
                <div className="absolute top-2 right-2">
                  <button
                    onClick={copyMolarMassToClipboard}
                    title="Copy to Clipboard"
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg transition-all border border-zinc-200 dark:border-zinc-800/10 hover:border-zinc-300 dark:hover:border-zinc-700/50 active:scale-90 cursor-pointer"
                  >
                    {copiedMolar ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider block mb-1">Molar Mass (Molecular Weight)</span>
                  <div className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white font-mono select-all tracking-tight mt-2">
                    {molarResult.total}
                    <span className="text-lg text-zinc-550 dark:text-zinc-500 font-medium font-sans ml-2">g/mol</span>
                  </div>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800/50 pt-4 mt-6">
                  <span className="text-xs text-zinc-650 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Contains {molarResult.breakdown.length} unique elements.
                  </span>
                </div>
              </div>

              {/* Middle/Right Column: Breakdown Table + Bars */}
              <div className="md:col-span-2 bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-none">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Composition Analysis</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-750 dark:text-zinc-300">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                          <th className="pb-2">Element</th>
                          <th className="pb-2 text-center">Atomic Weight</th>
                          <th className="pb-2 text-center">Count</th>
                          <th className="pb-2 text-right">Subtotal Mass</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800/40">
                        {molarResult.breakdown.map((row) => (
                          <tr key={row.element}>
                            <td className="py-2.5 font-bold font-mono text-zinc-900 dark:text-white text-sm">{row.element}</td>
                            <td className="py-2.5 text-center font-mono text-zinc-550 dark:text-zinc-400">{row.atomicMass}</td>
                            <td className="py-2.5 text-center font-mono font-semibold text-amber-700 dark:text-amber-400">{row.count}</td>
                            <td className="py-2.5 text-right font-mono text-zinc-700 dark:text-zinc-200">{row.subtotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Composition Bar Chart */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 block">Mass Percentage Composition</span>
                  <div className="space-y-2">
                    {molarResult.breakdown.map((row) => {
                      const totalMassVal = Number(molarResult.total);
                      const subMassVal = Number(row.subtotal);
                      const percent = isNaN(totalMassVal) || totalMassVal === 0 ? 0 : (subMassVal / totalMassVal) * 100;
                      return (
                        <div key={row.element} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold font-mono">
                            <span className="text-zinc-850 dark:text-zinc-300">{row.element}</span>
                            <span className="text-zinc-550 dark:text-zinc-400">{percent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-900">
                            <div
                              style={{ width: `${percent}%` }}
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- EMPIRICAL TAB --- */}
      {activeTab === "empirical" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Form Column */}
            <div className="md:col-span-2 bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-sm dark:shadow-none">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-2">Percent/Mass Composition</h3>
                
                <div className="space-y-2.5">
                  {empiricalRows.map((row, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                       <div className="w-24">
                        <input
                          type="text"
                          value={row.symbol}
                          onChange={(e) => handleRowChange(idx, "symbol", e.target.value)}
                          placeholder="Element"
                          className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-center text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 font-mono font-bold focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={row.percent}
                          onChange={(e) => handleRowChange(idx, "percent", e.target.value)}
                          placeholder="e.g. 40.0"
                          className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 font-mono focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        disabled={empiricalRows.length <= 2}
                        className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add row + Molecular mass */}
              <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between border-t border-zinc-200 dark:border-zinc-800/50 pt-4">
                <button
                  onClick={handleAddRow}
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Element
                </button>

                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <label htmlFor="mol-mass-input" className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                      Molecular Mass (g/mol)
                    </label>
                    <input
                      id="mol-mass-input"
                      type="text"
                      value={molecularMassInput}
                      onChange={(e) => {
                        setMolecularMassInput(e.target.value);
                        setActivePreset(null);
                      }}
                      placeholder="Optional, e.g. 180"
                      className="w-28 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 font-mono text-sm focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50"
                    />
                  </div>
                  <button
                    onClick={handleCalculateEmpirical}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-5 h-[38px] rounded-xl transition-all shadow-md shadow-amber-500/15 active:scale-[0.98] text-xs font-semibold cursor-pointer"
                  >
                    Calculate
                  </button>
                </div>
              </div>
            </div>

            {/* Empirical Presets Column */}
            <div className="bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Empirical Presets
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Try composition data from actual chemicals:
              </p>
              <ScrollArea className="h-[350px] pr-3">
                <div className="space-y-2">
                  {EMPIRICAL_PRESETS.map((preset) => {
                    const isActive = activePreset === preset.name;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handleEmpiricalPreset(preset)}
                        className={`w-full text-xs px-3 py-2.5 rounded-xl transition-all text-left flex justify-between items-center cursor-pointer shadow-xs border ${
                          isActive
                            ? "bg-amber-50/60 dark:bg-amber-500/10 border-amber-500 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 font-semibold"
                            : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/80 border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700/80 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <span className="font-semibold font-sans">{getPresetName(preset.name)}</span>
                        <span className={`text-[10px] font-mono ${isActive ? "text-amber-750/70 dark:text-amber-400/70" : "text-zinc-550 dark:text-zinc-500"}`}>
                          {preset.molMass ? `${preset.molMass} g/mol` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Empirical Error */}
          {empiricalError && (
            <div className="bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{empiricalError}</div>
            </div>
          )}

          {/* Empirical Result */}
          {empiricalResult && (
            <div className="bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 space-y-6 animate-in fade-in duration-300 shadow-sm dark:shadow-none">
              {/* Formula Outputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium uppercase tracking-wider block">Empirical Formula</span>
                  <div className="text-2xl text-zinc-900 dark:text-white">
                    {renderFormulaJSX(empiricalResult.empiricalFormula)}
                  </div>
                  <span className="text-xs text-zinc-550 dark:text-zinc-500 font-mono block">
                    Empirical weight: {empiricalResult.empiricalMass.toFixed(2)} g/mol
                  </span>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium uppercase tracking-wider block">Molecular Formula</span>
                  <div className="text-2xl text-amber-700 dark:text-amber-400">
                    {empiricalResult.molecularFormula ? (
                      renderFormulaJSX(empiricalResult.molecularFormula)
                    ) : (
                      <span className="text-sm text-zinc-550 dark:text-zinc-500 font-sans italic font-normal">
                        Enter molecular mass above to derive
                      </span>
                    )}
                  </div>
                  {empiricalResult.molecularFormula && (
                    <span className="text-xs text-zinc-550 dark:text-zinc-500 font-mono block">
                      Molecular mass multiplier: ×{empiricalResult.multiplier}
                    </span>
                  )}
                </div>
              </div>

              {/* Ratios detail table */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Calculated Mole Ratios</h4>
                <div className="overflow-x-auto bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <table className="w-full text-left text-xs font-mono text-zinc-700 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-850 text-zinc-550 dark:text-zinc-500">
                        <th className="pb-2">Element</th>
                        <th className="pb-2">Grams (or %)</th>
                        <th className="pb-2">Molar Mass</th>
                        <th className="pb-2">Moles</th>
                        <th className="pb-2 text-right">Simplified Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-900">
                      {empiricalResult.empirical.map((row) => (
                        <tr key={row.symbol} className="text-zinc-705 dark:text-zinc-300">
                          <td className="py-2.5 font-sans font-bold text-zinc-900 dark:text-white text-sm">{row.symbol}</td>
                          <td className="py-2.5">{row.grams.toFixed(2)}g</td>
                          <td className="py-2.5">{row.atomicWeight.toFixed(2)}</td>
                          <td className="py-2.5">{row.moles.toFixed(4)}</td>
                          <td className="py-2.5 text-right font-bold text-amber-700 dark:text-amber-400">{row.ratio.toFixed(2)} → {row.subscript}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Text explanation */}
              {empiricalResult.explanation && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/50 space-y-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">Calculation Steps & Logic</span>
                  <div className="bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs">
                    <div
                      className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans space-y-4
                        [&_h4]:text-xs [&_h4]:font-bold [&_h4]:uppercase [&_h4]:tracking-wider [&_h4]:text-amber-700 [&_h4]:dark:text-amber-400 [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:first:mt-0
                        [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-3
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mt-1 [&_ul]:mb-2 [&_ul]:text-zinc-550 [&_ul]:dark:text-zinc-450
                        [&_li]:pl-1
                        [&_strong]:font-semibold [&_strong]:text-zinc-950 [&_strong]:dark:text-white
                        [&_hr]:border-zinc-200 [&_hr]:dark:border-zinc-800 [&_hr]:my-4"
                      dangerouslySetInnerHTML={{
                        __html: empiricalResult.explanation
                          .replace(/\n/g, "<br />")
                          .replace(/Step \d+:/g, "<strong>$&</strong>")
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
