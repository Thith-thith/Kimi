"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Clipboard, 
  FlaskConical, 
  Sparkles, 
  HelpCircle, 
  Check, 
  ArrowRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePreferencesStore } from "../../stores/preferences";
import { 
  balanceEquation, 
  normalizeText, 
  parseFormulaStrict, 
  formatReactionError,
  predictReaction,
  getReactionTypes,
  atomicMasses
} from "@kimi/chemistry-engine";

const BALANCE_PRESETS = [
  "H2 + O2 -> H2O",
  "CH4 + O2 -> CO2 + H2O",
  "Fe + O2 -> Fe2O3",
  "Na + Cl2 -> NaCl",
  "Al + O2 -> Al2O3",
  "Cu + AgNO3 -> Cu(NO3)2 + Ag"
];

const PREDICT_PRESETS = [
  { reactants: "Na + Cl2", type: "synthesis", label: "Na + Cl₂ (Synthesis)" },
  { reactants: "CaCO3", type: "decomposition", label: "CaCO₃ (Decomposition)" },
  { reactants: "Zn + HCl", type: "single_displacement", label: "Zn + HCl (Single Disp.)" },
  { reactants: "Fe + CuSO4", type: "single_displacement", label: "Fe + CuSO₄ (Single Disp.)" },
  { reactants: "AgNO3 + NaCl", type: "double_displacement", label: "AgNO₃ + NaCl (Double Disp.)" },
  { reactants: "HCl + NaOH", type: "double_displacement", label: "HCl + NaOH (Double Disp.)" },
  { reactants: "CH4 + O2", type: "combustion", label: "CH₄ + O₂ (Combustion)" }
];

const TYPE_TRANSLATION_KEYS: Record<string, string> = {
  synthesis: "synthesis",
  decomposition: "decomposition",
  single_displacement: "singleDisplacement",
  double_displacement: "doubleDisplacement",
  combustion: "combustion"
};

const stripCoefficients = (sideStr: string): string => {
  return sideStr
    .split(/\s*\+\s*/)
    .map(term => {
      const trimmed = term.trim();
      const match = trimmed.match(/^(\d+)?(.*)$/);
      return match?.[2] || trimmed;
    })
    .join(" + ");
};

interface EquationBalancerProps {
  onClose?: () => void;
}

export default function EquationBalancer({ onClose }: EquationBalancerProps) {
  const tTools = useTranslations("tools");
  const tBalancer = useTranslations("balancer");
  const tPredictor = useTranslations("predictor");

  const [activeTab, setActiveTab] = useState<"balance" | "predict">("balance");

  const { reduceMotion } = usePreferencesStore();
  const [impulseOffset, setImpulseOffset] = useState(0);

  // --- BALANCE TAB STATE ---
  const [reactantsInput, setReactantsInput] = useState("");
  const [productsInput, setProductsInput] = useState("");
  const [balanceResult, setBalanceResult] = useState<any>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [verification, setVerification] = useState<any[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  // --- PREDICT TAB STATE ---
  const [reactantsPredictInput, setReactantsPredictInput] = useState("");
  const [selectedType, setSelectedType] = useState("single_displacement");
  const [predictResult, setPredictResult] = useState<any>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [suggestedType, setSuggestedType] = useState<string | null>(null);
  const [suggestedTypeLabel, setSuggestedTypeLabel] = useState<string | null>(null);

  const reactionTypes = getReactionTypes();

  // Helper to parse formula weight
  const getSideWeight = useCallback((rawInput: string): number => {
    if (!rawInput.trim()) return 0;
    const terms = rawInput.split(/\s*\+\s*/);
    let totalWeight = 0;
    for (const term of terms) {
      const trimmed = term.trim();
      if (!trimmed) continue;
      
      const match = trimmed.match(/^(\d+)?(.*)$/);
      const coeff = match?.[1] ? parseInt(match[1], 10) : 1;
      const formula = match?.[2] || trimmed;
      
      try {
        const parsed = parseFormulaStrict(formula);
        let termWeight = 0;
        for (const [el, count] of Object.entries(parsed)) {
          const mass = atomicMasses[el] || 1.0;
          termWeight += mass * count;
        }
        totalWeight += termWeight * coeff;
      } catch {
        // Silent error during interactive weight estimation
      }
    }
    return totalWeight;
  }, []);

  // Live Atom Counter for detailed imbalance hints
  const getSideAtoms = useCallback((rawInput: string): Record<string, number> => {
    if (!rawInput.trim()) return {};
    const terms = rawInput.split(/\s*\+\s*/);
    const atoms: Record<string, number> = {};
    for (const term of terms) {
      const trimmed = term.trim();
      if (!trimmed) continue;
      
      const match = trimmed.match(/^(\d+)?(.*)$/);
      const coeff = match?.[1] ? parseInt(match[1], 10) : 1;
      const formula = match?.[2] || trimmed;
      
      try {
        const parsed = parseFormulaStrict(formula);
        for (const [el, count] of Object.entries(parsed)) {
          atoms[el] = (atoms[el] || 0) + count * coeff;
        }
      } catch {
        // Silent error during interactive parsing
      }
    }
    return atoms;
  }, []);

  // Compute live weights for scale animation
  const lhsWeight = useMemo(() => getSideWeight(reactantsInput), [reactantsInput, getSideWeight]);
  const rhsWeight = useMemo(() => getSideWeight(productsInput), [productsInput, getSideWeight]);

  const tiltAngle = useMemo(() => {
    if (balanceResult) return 0;
    if (lhsWeight === 0 && rhsWeight === 0) return 0;
    if (lhsWeight > 0 && rhsWeight === 0) return -12;
    if (lhsWeight === 0 && rhsWeight > 0) return 12;

    const diff = lhsWeight - rhsWeight;
    const sum = lhsWeight + rhsWeight;
    const ratio = diff / sum; // -1 to 1

    const angle = Math.min(12, Math.max(-12, ratio * 12));
    if (Math.abs(diff) < 0.01) return 0;
    return angle;
  }, [lhsWeight, rhsWeight, balanceResult]);

  const impulseTimerRef = useRef<any>(null);
  const productsInputRef = useRef<HTMLInputElement>(null);

  const triggerImpulse = useCallback((direction: "left" | "right" | "both" = "both") => {
    if (reduceMotion) return;
    if (impulseTimerRef.current) {
      clearTimeout(impulseTimerRef.current);
    }
    const kickValue = direction === "left" ? -4 : direction === "right" ? 4 : (Math.random() > 0.5 ? 4 : -4);
    setImpulseOffset(kickValue);
    impulseTimerRef.current = setTimeout(() => {
      setImpulseOffset(0);
      impulseTimerRef.current = null;
    }, 50);
  }, [reduceMotion]);

  const prevWeights = useRef({ lhs: 0, rhs: 0 });

  useEffect(() => {
    if (lhsWeight !== prevWeights.current.lhs || rhsWeight !== prevWeights.current.rhs) {
      const leftChanged = lhsWeight > prevWeights.current.lhs;
      const rightChanged = rhsWeight > prevWeights.current.rhs;
      
      if (leftChanged && !rightChanged) {
        triggerImpulse("left");
      } else if (rightChanged && !leftChanged) {
        triggerImpulse("right");
      } else {
        triggerImpulse("both");
      }
      
      prevWeights.current = { lhs: lhsWeight, rhs: rhsWeight };
    }
  }, [lhsWeight, rhsWeight, triggerImpulse]);

  useEffect(() => {
    return () => {
      if (impulseTimerRef.current) {
        clearTimeout(impulseTimerRef.current);
      }
    };
  }, []);

  // Normalize formula label representation for scale pan display (e.g. "CH4+O2" -> "CH4 + O2")
  const getNormalizedLabel = useCallback((rawInput: string): string => {
    if (!rawInput.trim()) return "";
    return rawInput.split(/[\s+]+/).filter(Boolean).join(" + ");
  }, []);

  const lhsLabel = useMemo(() => {
    if (balanceResult) {
      return balanceResult.reactants
        .map((r: any) => `${r.coefficient > 1 ? r.coefficient : ""}${r.formula}`)
        .join(" + ");
    }
    return getNormalizedLabel(reactantsInput);
  }, [reactantsInput, balanceResult, getNormalizedLabel]);

  const rhsLabel = useMemo(() => {
    if (balanceResult) {
      return balanceResult.products
        .map((p: any) => `${p.coefficient > 1 ? p.coefficient : ""}${p.formula}`)
        .join(" + ");
    }
    return getNormalizedLabel(productsInput);
  }, [productsInput, balanceResult, getNormalizedLabel]);

  // Compute text bubble size dynamically based on formula length
  const getLabelWidth = useCallback((text: string): number => {
    return text.length * 6.8 + 16;
  }, []);

  // Live detailed imbalance detector (e.g. H: 4 left vs 2 right)
  const liveImbalance = useMemo(() => {
    if (!reactantsInput.trim() || !productsInput.trim()) return null;
    
    const leftAtoms = getSideAtoms(reactantsInput);
    const rightAtoms = getSideAtoms(productsInput);
    
    const allElements = Array.from(new Set([...Object.keys(leftAtoms), ...Object.keys(rightAtoms)]));
    
    for (const el of allElements) {
      const left = leftAtoms[el] || 0;
      const right = rightAtoms[el] || 0;
      if (left !== right) {
        return {
          element: el,
          left,
          right
        };
      }
    }
    
    return null;
  }, [reactantsInput, productsInput, getSideAtoms]);

  // Helper to check if both inputs are valid and elements match perfectly
  let liveIsBalanced = false;
  if (balanceResult) {
    liveIsBalanced = true;
  } else if (reactantsInput.trim() && productsInput.trim()) {
    const leftAtoms = getSideAtoms(reactantsInput);
    const rightAtoms = getSideAtoms(productsInput);
    const allElements = Array.from(new Set([...Object.keys(leftAtoms), ...Object.keys(rightAtoms)]));
    if (allElements.length > 0) {
      let isMatch = true;
      for (const el of allElements) {
        if ((leftAtoms[el] || 0) !== (rightAtoms[el] || 0)) {
          isMatch = false;
          break;
        }
      }
      liveIsBalanced = isMatch;
    }
  }

  // Compute translation offsets for the sibling hanger groups based on beam tilt
  const hangerTranslation = useMemo(() => {
    const angle = reduceMotion ? tiltAngle : (tiltAngle + impulseOffset);
    const rad = (angle * Math.PI) / 180;
    return {
      finalAngle: angle,
      leftDx: -150 * Math.cos(rad) + 150,
      leftDy: -150 * Math.sin(rad),
      rightDx: 150 * Math.cos(rad) - 150,
      rightDy: 150 * Math.sin(rad),
    };
  }, [tiltAngle, impulseOffset, reduceMotion]);

  const handleReactantsChange = useCallback((val: string) => {
    if (val.includes("->") || val.includes("→") || val.includes("=")) {
      const normalized = val.replace(/->/g, "→").replace(/=/g, "→");
      const parts = normalized.split("→");
      const r = parts[0]?.trim() || "";
      const p = parts[1]?.trim() || "";
      setReactantsInput(r);
      setProductsInput(p);
      setBalanceResult(null);
      setBalanceError(null);
      setVerification([]);
      
      // Auto focus the products input
      setTimeout(() => {
        productsInputRef.current?.focus();
      }, 50);
      return;
    }

    setReactantsInput(val);
    setBalanceResult(null);
    setBalanceError(null);
    setVerification([]);
  }, []);

  const handleProductsChange = useCallback((val: string) => {
    setProductsInput(val);
    setBalanceResult(null);
    setBalanceError(null);
    setVerification([]);
  }, []);

  // Handle Balancing
  const handleBalance = useCallback((rIn: string, pIn: string) => {
    if (!rIn.trim() && !pIn.trim()) return;
    setBalanceError(null);
    setBalanceResult(null);
    setVerification([]);

    let targetReactants = rIn;
    let targetProducts = pIn;

    if (rIn.trim() && !pIn.trim()) {
      // Try to predict products from reactants
      const types = ["synthesis", "decomposition", "single_displacement", "double_displacement", "combustion"];
      let predictionSuccess = false;
      let lastPredictError = null;

      for (const type of types) {
        try {
          const res = predictReaction(rIn, type);
          if (res.success && res.products && res.products.length > 0) {
            targetProducts = res.products.join(" + ");
            if (res.reactants && res.reactants.length > 0) {
              targetReactants = res.reactants.join(" + ");
            }
            predictionSuccess = true;
            break;
          } else if (res.noReaction) {
            lastPredictError = res.explanation || "No reaction occurs.";
          } else if (res.error) {
            lastPredictError = res.error;
          }
        } catch (e: any) {
          // ignore and try next reaction type
        }
      }

      if (!predictionSuccess) {
        setBalanceError(
          lastPredictError || 
          "Could not predict reaction products automatically. Please enter products manually."
        );
        return;
      }
    } else if (!rIn.trim() && pIn.trim()) {
      setBalanceError("Please enter the reactants side of the equation.");
      return;
    }

    try {
      const strippedR = stripCoefficients(normalizeText(targetReactants));
      const strippedP = stripCoefficients(normalizeText(targetProducts));
      const fullEquation = `${strippedR} -> ${strippedP}`;
      const balanced = balanceEquation(fullEquation);
      
      // Calculate Element Verification
      const leftCounts: Record<string, number> = {};
      const rightCounts: Record<string, number> = {};

      for (const term of balanced.reactants) {
        const parsed = parseFormulaStrict(term.formula);
        for (const [el, count] of Object.entries(parsed)) {
          leftCounts[el] = (leftCounts[el] || 0) + count * term.coefficient;
        }
      }

      for (const term of balanced.products) {
        const parsed = parseFormulaStrict(term.formula);
        for (const [el, count] of Object.entries(parsed)) {
          rightCounts[el] = (rightCounts[el] || 0) + count * term.coefficient;
        }
      }

      const allElements = Array.from(new Set([...Object.keys(leftCounts), ...Object.keys(rightCounts)]));
      const verifyList = allElements.map(el => ({
        element: el,
        left: leftCounts[el] || 0,
        right: rightCounts[el] || 0,
        balanced: (leftCounts[el] || 0) === (rightCounts[el] || 0)
      }));

      const balancedReactants = balanced.reactants
        .map((r: any) => `${r.coefficient > 1 ? r.coefficient : ""}${r.formula}`)
        .join(" + ");
      const balancedProducts = balanced.products
        .map((p: any) => `${p.coefficient > 1 ? p.coefficient : ""}${p.formula}`)
        .join(" + ");

      setReactantsInput(balancedReactants);
      setProductsInput(balancedProducts);
      setBalanceResult(balanced);
      setVerification(verifyList);
      triggerImpulse("both");
    } catch (err: any) {
      console.error(err);
      setBalanceError(formatReactionError(err.message || String(err)));
    }
  }, [triggerImpulse]);

  const handleBalancePreset = (preset: string) => {
    const parts = preset.split(/->|→/);
    const r = parts[0]?.trim() || "";
    const p = parts[1]?.trim() || "";
    setReactantsInput(r);
    setProductsInput(p);
    setBalanceResult(null);
    setBalanceError(null);
    setVerification([]);
  };

  const handleClearBalance = () => {
    setReactantsInput("");
    setProductsInput("");
    setBalanceResult(null);
    setBalanceError(null);
    setVerification([]);
    triggerImpulse("both");
  };

  // Handle Predict
  const handlePredict = useCallback((inputReactants: string, type: string) => {
    if (!inputReactants.trim()) return;
    setPredictError(null);
    setPredictResult(null);
    setSuggestedType(null);
    setSuggestedTypeLabel(null);

    const res = predictReaction(inputReactants, type);
    if (!res.success) {
      // Find if another reaction type works
      const otherTypes = ["synthesis", "decomposition", "single_displacement", "double_displacement", "combustion"].filter(t => t !== type);
      let matchingType: string | null = null;
      for (const t of otherTypes) {
        try {
          const testRes = predictReaction(inputReactants, t);
          if (testRes.success) {
            matchingType = t;
            break;
          }
        } catch {
          // ignore error
        }
      }

      setPredictError(res.error || tPredictor("unknownError"));

      if (matchingType) {
        const typeLabels: Record<string, string> = {
          synthesis: "Synthesis",
          decomposition: "Decomposition",
          single_displacement: "Single Displacement",
          double_displacement: "Double Displacement",
          combustion: "Combustion"
        };
        setSuggestedType(matchingType);
        setSuggestedTypeLabel(typeLabels[matchingType] || matchingType);
      }
    } else if (res.noReaction) {
      setPredictResult({
        noReaction: true,
        explanation: res.explanation || tPredictor("noReaction")
      });
    } else {
      setPredictResult(res);
    }
  }, [tPredictor]);

  const handlePredictPreset = (preset: typeof PREDICT_PRESETS[0]) => {
    setReactantsPredictInput(preset.reactants);
    setSelectedType(preset.type);
    setSuggestedType(null);
    setSuggestedTypeLabel(null);
    handlePredict(preset.reactants, preset.type);
  };

  const handleClearPredict = () => {
    setReactantsPredictInput("");
    setPredictResult(null);
    setPredictError(null);
    setSuggestedType(null);
    setSuggestedTypeLabel(null);
  };

  // Helper JSX formulas
  const renderFormulaJSX = (formula: string) => {
    const parts = formula.split(/(\d+)/);
    return (
      <span className="font-mono font-bold tracking-tight">
        {parts.map((part, i) => {
          if (/^\d+$/.test(part)) {
            return <sub key={i} className="text-[75%] bottom-[-0.2em] font-bold">{part}</sub>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const renderEquationJSX = (eqString: string, themeColor: "blue" | "purple" = "blue") => {
    const arrow = eqString.includes("→") ? "→" : "->";
    const [leftSide, rightSide] = eqString.split(arrow);
    
    const parseTerms = (side: string) => {
      return side.split(/\s*\+\s*/).map(term => {
        const match = term.trim().match(/^(\d+)?(.*)$/);
        return {
          coeff: match?.[1] || "",
          formula: match?.[2] || term.trim()
        };
      });
    };

    const leftTerms = parseTerms(leftSide);
    const rightTerms = parseTerms(rightSide);

    const coeffBadgeClass = themeColor === "blue"
      ? "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
      : "bg-purple-50 dark:bg-purple-500/20 text-purple-750 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30";

    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-lg md:text-xl font-mono text-zinc-900 dark:text-white">
        {leftTerms.map((term, idx) => (
          <span key={`l-${idx}`} className="flex items-center gap-1">
            {idx > 0 && <span className="text-zinc-400 dark:text-zinc-550 font-bold mr-1">+</span>}
            {term.coeff && (
              <span className={`px-2 py-0.5 rounded-lg text-sm md:text-base font-bold font-sans ${coeffBadgeClass}`}>
                {term.coeff}
              </span>
            )}
            {renderFormulaJSX(term.formula)}
          </span>
        ))}
        <span className="text-zinc-400 dark:text-zinc-550 font-bold px-1.5">→</span>
        {rightTerms.map((term, idx) => (
          <span key={`r-${idx}`} className="flex items-center gap-1">
            {idx > 0 && <span className="text-zinc-400 dark:text-zinc-550 font-bold mr-1">+</span>}
            {term.coeff && (
              <span className={`px-2 py-0.5 rounded-lg text-sm md:text-base font-bold font-sans ${coeffBadgeClass}`}>
                {term.coeff}
              </span>
            )}
            {renderFormulaJSX(term.formula)}
          </span>
        ))}
      </div>
    );
  };

  const copyToClipboard = () => {
    if (balanceResult) {
      const arrowFormatted = balanceResult.formatted.replace(/->/g, "→");
      navigator.clipboard.writeText(arrowFormatted);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-none mx-auto animate-in fade-in slide-in-from-bottom-4 duration-350">
      <div className="bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-md dark:shadow-none space-y-6 relative">
        
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-zinc-100 dark:border-zinc-800 pb-4 w-full">
          <div className="flex justify-start min-w-0">
            <h2 className="text-base md:text-lg lg:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              Equation Balancer
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-850 rounded-xl">
              <button
                onClick={() => setActiveTab("balance")}
                className={`px-6 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "balance"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-650 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {tBalancer("modeBalance")}
              </button>
              <button
                onClick={() => setActiveTab("predict")}
                className={`px-6 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "predict"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-650 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {tBalancer("modePredict")}
              </button>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            {onClose ? (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-450 dark:hover:text-white rounded-xl transition-all border border-zinc-200 dark:border-zinc-800/80 active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>
        </div>

        <AnPresence mode="wait">
          {activeTab === "balance" ? (
            <motion.div
              key="balance"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* LARGE Scale Visualization */}
              <div className="bg-zinc-50/40 dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[380px] overflow-hidden relative">
                
                <div className="w-full max-w-[640px] mx-auto relative">
                  <svg viewBox="0 0 400 240" className="w-full h-auto text-zinc-800 dark:text-zinc-100 overflow-visible select-none">
                    
                    <defs>
                      <linearGradient id="stand-metallic" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#374151" />
                        <stop offset="30%" stopColor="#9ca3af" />
                        <stop offset="50%" stopColor="#4b5563" />
                        <stop offset="70%" stopColor="#9ca3af" />
                        <stop offset="100%" stopColor="#374151" />
                      </linearGradient>
                      <linearGradient id="base-metallic" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6b7280" />
                        <stop offset="30%" stopColor="#374151" />
                        <stop offset="100%" stopColor="#111827" />
                      </linearGradient>
                      <linearGradient id="beam-metallic" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#9ca3af" />
                        <stop offset="30%" stopColor="#4b5563" />
                        <stop offset="70%" stopColor="#374151" />
                        <stop offset="100%" stopColor="#1f2937" />
                      </linearGradient>
                      <linearGradient id="pivot-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f3f4f6" />
                        <stop offset="100%" stopColor="#9ca3af" />
                      </linearGradient>
                      <linearGradient id="pivot-cap" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6b7280" />
                        <stop offset="100%" stopColor="#1f2937" />
                      </linearGradient>
                      <linearGradient id="rod-metallic" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d1d5db" />
                        <stop offset="20%" stopColor="#9ca3af" />
                        <stop offset="50%" stopColor="#374151" />
                        <stop offset="80%" stopColor="#9ca3af" />
                        <stop offset="100%" stopColor="#d1d5db" />
                      </linearGradient>
                      <radialGradient id="joint-grad" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="50%" stopColor="#d1d5db" />
                        <stop offset="100%" stopColor="#4b5563" />
                      </radialGradient>
                      <linearGradient id="pan-metallic" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4b5563" />
                        <stop offset="50%" stopColor="#374151" />
                        <stop offset="100%" stopColor="#111827" />
                      </linearGradient>
                      <linearGradient id="needle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#dc2626" />
                        <stop offset="100%" stopColor="#991b1b" />
                      </linearGradient>
                      <radialGradient id="sphere-blue" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="40%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1e3a8a" />
                      </radialGradient>
                      <radialGradient id="sphere-cyan" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="40%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#083344" />
                      </radialGradient>
                      <radialGradient id="sphere-orange" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="40%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#7c2d12" />
                      </radialGradient>
                      <radialGradient id="sphere-red" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="40%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#7f1d1d" />
                      </radialGradient>
                    </defs>

                    {/* Central Vertical Pillar Post */}
                    <rect x="197" y="50" width="6" height="162" rx="3" fill="url(#stand-metallic)" stroke="#1f2937" strokeWidth="1" />
                    {/* Metal Stand Base */}
                    <rect x="145" y="212" width="110" height="10" rx="5" fill="url(#base-metallic)" stroke="#111827" strokeWidth="1" />

                    {/* Dial Background (stationary behind beam) */}
                    <circle cx="200" cy="50" r="18" fill="url(#pivot-grad)" stroke="#e5e7eb" strokeWidth="2" />

                    {/* Moving Beam Assembly */}
                    <motion.g
                      animate={{ rotate: hangerTranslation.finalAngle }}
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 50, damping: 12 }}
                      style={{ originX: 0.5, originY: 0.5, transformBox: "fill-box" }}
                    >
                      {/* Invisible balancing element to keep the bounding box centered vertically around y=50 */}
                      {/* Bounding box y-range will be: [14, 86] (center y=50) */}
                      <rect x="199" y="14" width="2" height="36" fill="none" opacity="0" />

                      {/* Scale Pointer (needle) */}
                      <rect x="199" y="50" width="2" height="36" rx="1" fill="url(#needle-grad)" stroke="#7f1d1d" strokeWidth="0.5" />

                      {/* Beam Line */}
                      <rect x="46" y="46" width="308" height="8" rx="4" fill="url(#beam-metallic)" stroke="#111827" strokeWidth="1" />

                      {/* Hash marks */}
                      {Array.from({ length: 15 }).map((_, i) => {
                        const xLeft = 200 - (i * 10);
                        const xRight = 200 + (i * 10);
                        return (
                          <g key={i}>
                            {i > 0 && xLeft >= 56 && xRight <= 344 && (
                              <>
                                <line x1={xLeft} y1="48" x2={xLeft} y2="52" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
                                <line x1={xRight} y1="48" x2={xRight} y2="52" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
                              </>
                            )}
                          </g>
                        );
                      })}
                    </motion.g>

                    {/* Left Hanging Pan (pivot at 50,50) - translated sibling group */}
                    <motion.g
                      animate={{ 
                        x: hangerTranslation.leftDx,
                        y: hangerTranslation.leftDy
                      }}
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 50, damping: 12 }}
                    >
                      {/* Support Rod */}
                      <rect x="49.25" y="50" width="1.5" height="90" fill="url(#rod-metallic)" />
                      
                      {/* Joint rings */}
                      <circle cx="50" cy="50" r="3.5" fill="url(#joint-grad)" stroke="#374151" strokeWidth="0.8" />
                      <circle cx="50" cy="140" r="3.5" fill="url(#joint-grad)" stroke="#374151" strokeWidth="0.8" />

                      {/* Curved metallic cup pan */}
                      <path d="M 10,140 L 90,140 L 90,142 A 5,5 0 0 1 85,147 L 15,147 A 5,5 0 0 1 10,142 Z" fill="url(#pan-metallic)" stroke="#1f2937" strokeWidth="1" />
                      <line x1="10" y1="140" x2="90" y2="140" stroke="#6b7280" strokeWidth="0.8" />

                      {/* Text bubble on left pan tray */}
                      {lhsLabel && (
                        <g>
                          <rect
                            x={50 - getLabelWidth(lhsLabel) / 2}
                            y="112"
                            width={getLabelWidth(lhsLabel)}
                            height="20"
                            rx="10"
                            fill="white"
                            stroke="#d4d4d8"
                            strokeWidth="1"
                            className="dark:fill-zinc-950 dark:stroke-zinc-800 shadow-sm"
                            style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.06))" }}
                          />
                          <text
                            x="50"
                            y="126"
                            textAnchor="middle"
                            className="font-sans text-[10px] md:text-[11px] font-extrabold fill-zinc-850 dark:fill-zinc-200"
                          >
                            {lhsLabel}
                          </text>
                        </g>
                      )}
                    </motion.g>

                    {/* Right Hanging Pan (pivot at 350,50) - translated sibling group */}
                    <motion.g
                      animate={{ 
                        x: hangerTranslation.rightDx,
                        y: hangerTranslation.rightDy
                      }}
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 50, damping: 12 }}
                    >
                      {/* Support Rod */}
                      <rect x="349.25" y="50" width="1.5" height="90" fill="url(#rod-metallic)" />
                      
                      {/* Joint rings */}
                      <circle cx="350" cy="50" r="3.5" fill="url(#joint-grad)" stroke="#374151" strokeWidth="0.8" />
                      <circle cx="350" cy="140" r="3.5" fill="url(#joint-grad)" stroke="#374151" strokeWidth="0.8" />

                      {/* Curved metallic cup pan */}
                      <path d="M 310,140 L 390,140 L 390,142 A 5,5 0 0 1 385,147 L 315,147 A 5,5 0 0 1 310,142 Z" fill="url(#pan-metallic)" stroke="#1f2937" strokeWidth="1" />
                      <line x1="310" y1="140" x2="390" y2="140" stroke="#6b7280" strokeWidth="0.8" />

                      {/* Text bubble on right pan tray */}
                      {rhsLabel && (
                        <g>
                          <rect
                            x={350 - getLabelWidth(rhsLabel) / 2}
                            y="112"
                            width={getLabelWidth(rhsLabel)}
                            height="20"
                            rx="10"
                            fill="white"
                            stroke="#d4d4d8"
                            strokeWidth="1"
                            className="dark:fill-zinc-950 dark:stroke-zinc-800 shadow-sm"
                            style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.06))" }}
                          />
                          <text
                            x="350"
                            y="126"
                            textAnchor="middle"
                            className="font-sans text-[10px] md:text-[11px] font-extrabold fill-zinc-850 dark:fill-zinc-200"
                          >
                            {rhsLabel}
                          </text>
                        </g>
                      )}
                    </motion.g>

                    {/* Central Stationary Cap on top */}
                    <circle cx="200" cy="50" r="6" fill="url(#pivot-cap)" stroke="#111827" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* Reactants and Products Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                {/* Reactants */}
                <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 space-y-3 shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-1.5 text-zinc-550 dark:text-zinc-400">
                    <span className="bg-indigo-650/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold">
                      R
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      REACTANTS
                    </span>
                  </div>
                  <input
                    id="reactants-split-large"
                    type="text"
                    value={reactantsInput}
                    onChange={(e) => handleReactantsChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleBalance(reactantsInput, productsInput);
                    }}
                    placeholder={tBalancer("reactantsPlaceholder")}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-900 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-500 font-mono text-base font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                  />
                </div>

                {/* Arrow Button */}
                <div className="flex items-center justify-center text-zinc-450 dark:text-zinc-600 h-10 w-10 md:h-12 md:w-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 rounded-full mx-auto shadow-sm">
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </div>

                {/* Products */}
                <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 space-y-3 shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-1.5 text-zinc-550 dark:text-zinc-400">
                    <span className="bg-emerald-650/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold">
                      P
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      PRODUCTS
                    </span>
                  </div>
                  <input
                    id="products-split-large"
                    ref={productsInputRef}
                    type="text"
                    value={productsInput}
                    onChange={(e) => handleProductsChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleBalance(reactantsInput, productsInput);
                    }}
                    placeholder={tBalancer("productsPlaceholder")}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-900 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-500 font-mono text-base font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Controls and Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr] gap-4 items-center">
                <button
                  onClick={() => handleBalance(reactantsInput, productsInput)}
                  className="bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer text-sm"
                >
                  {tBalancer("autoBalance")}
                </button>
                
                <button
                  onClick={handleClearBalance}
                  className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer text-sm"
                >
                  {tBalancer("clear")}
                </button>

                {/* Status Bar */}
                <div className={`w-full border px-4 py-3.5 rounded-xl text-center text-sm font-bold min-h-[50px] flex items-center justify-center transition-all ${
                  balanceError 
                    ? "bg-red-50 dark:bg-red-500/10 border-red-250 dark:border-red-500/20 text-red-800 dark:text-red-400"
                    : reactantsInput.trim() !== "" && productsInput.trim() === ""
                    ? "bg-amber-50/50 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
                    : reactantsInput.trim() === "" && productsInput.trim() !== ""
                    ? "bg-amber-50/50 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
                    : reactantsInput.trim() === "" && productsInput.trim() === ""
                    ? "bg-zinc-50/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-855 text-zinc-550 dark:text-zinc-450"
                    : liveIsBalanced
                    ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-50/50 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
                }`}>
                  {balanceError ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      {balanceError}
                    </span>
                  ) : reactantsInput.trim() === "" && productsInput.trim() === "" ? (
                    <span className="font-bold uppercase tracking-wider text-xs">
                      {tBalancer("enterEquation")}
                    </span>
                  ) : reactantsInput.trim() !== "" && productsInput.trim() === "" ? (
                    <span className="font-bold flex items-center gap-1.5 justify-center">
                      <span className="text-base">⚠️</span>
                      {tBalancer("addProducts")}
                    </span>
                  ) : reactantsInput.trim() === "" && productsInput.trim() !== "" ? (
                    <span className="font-bold flex items-center gap-1.5 justify-center">
                      <span className="text-base">⚠️</span>
                      {tBalancer("addReactants")}
                    </span>
                  ) : liveIsBalanced ? (
                    <span className="font-bold flex items-center gap-1.5 justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {tBalancer("balanced")}
                    </span>
                  ) : liveImbalance ? (
                    <span className="font-bold flex items-center gap-1.5 justify-center">
                      <span className="text-base">⚠️</span>
                      {tBalancer("notBalanced")} — {liveImbalance.element}: {liveImbalance.left} {tBalancer("left")} vs {liveImbalance.right} {tBalancer("right")}
                    </span>
                  ) : (
                    <span className="font-bold flex items-center gap-1.5 justify-center">
                      <span className="text-base">⚠️</span>
                      {tBalancer("notBalanced")}
                    </span>
                  )}
                </div>
              </div>

              {/* Presets List */}
              <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <span className="text-xs text-zinc-500 dark:text-zinc-550 font-bold uppercase tracking-wider block">
                  Common Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  {BALANCE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleBalancePreset(preset)}
                      className="bg-zinc-50 hover:bg-zinc-150/70 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 text-xs px-3.5 py-2 rounded-xl transition-all font-mono font-bold hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-95 cursor-pointer shadow-sm"
                    >
                      {preset.replace(/->/g, "→")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Output Block */}
              {balanceResult && (
                <div className="space-y-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in duration-300">
                  {/* Balanced output card */}
                  <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 p-3">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 active:scale-90 cursor-pointer flex items-center gap-1.5"
                      >
                        <Clipboard className="w-4 h-4" />
                        <span className="text-xs font-semibold">{isCopied ? tBalancer("copied") : tBalancer("clickToCopy")}</span>
                      </button>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-550 font-bold uppercase tracking-wider block mb-2">
                      Balanced Equation
                    </span>
                    <div className="py-2">
                      {renderEquationJSX(balanceResult.formatted, "blue")}
                    </div>
                  </div>

                  {/* Verification Table */}
                  <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 mb-4 flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800 pb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Stoichiometric Verification
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm text-left">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450 font-bold uppercase tracking-wider text-[10px]">
                            <th className="pb-2">Element</th>
                            <th className="pb-2 text-center">Reactants (LHS)</th>
                            <th className="pb-2 text-center">Products (RHS)</th>
                            <th className="pb-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/50">
                          {verification.map((v) => (
                            <tr key={v.element} className="text-zinc-850 dark:text-zinc-300">
                              <td className="py-3 font-extrabold font-mono text-base text-zinc-955 dark:text-zinc-100">{v.element}</td>
                              <td className="py-3 text-center font-mono font-bold text-zinc-700 dark:text-zinc-400">{v.left}</td>
                              <td className="py-3 text-center font-mono font-bold text-zinc-700 dark:text-zinc-400">{v.right}</td>
                              <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Balanced
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="predict"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Predict Main Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-zinc-50/40 dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-none">
                    {/* Select Reaction Type Grid */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-855 dark:text-zinc-200">
                        {tPredictor("reactionType")}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {reactionTypes.map((type) => {
                          const isSelected = selectedType === type.id;
                          const labelKey = TYPE_TRANSLATION_KEYS[type.id] || type.id;
                          const label = tPredictor.has(labelKey) ? tPredictor(labelKey) : type.label;

                          return (
                            <button
                              key={type.id}
                              onClick={() => {
                                setSelectedType(type.id);
                                setPredictError(null);
                                setPredictResult(null);
                                setSuggestedType(null);
                                setSuggestedTypeLabel(null);
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col justify-between h-20 cursor-pointer ${
                                isSelected
                                  ? "bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/40 text-purple-755 dark:text-purple-400 shadow-sm"
                                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-450 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-300"
                              }`}
                            >
                              <span className="text-lg">{type.icon}</span>
                              <div>
                                <span className="block font-bold text-zinc-850 dark:text-white">{label}</span>
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-normal leading-tight line-clamp-1">
                                  {type.description}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reactant Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="reactants-predict-large" className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                          {tPredictor("reactants")}
                        </label>
                        <span className="bg-purple-55/60 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          R
                        </span>
                      </div>
                      <input
                        id="reactants-predict-large"
                        type="text"
                        value={reactantsPredictInput}
                        onChange={(e) => {
                          setReactantsPredictInput(e.target.value);
                          setPredictError(null);
                          setPredictResult(null);
                          setSuggestedType(null);
                          setSuggestedTypeLabel(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePredict(reactantsPredictInput, selectedType);
                        }}
                        placeholder={tPredictor("reactantsPlaceholder")}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-900 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-500 font-mono text-base font-bold focus:outline-none focus:border-purple-500 dark:focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all shadow-sm"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 justify-end pt-2 border-t border-zinc-200/60 dark:border-zinc-800/40">
                      <button
                        onClick={handleClearPredict}
                        className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-zinc-850 dark:text-zinc-300 font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer text-sm"
                      >
                        {tBalancer("clear")}
                      </button>
                      <button
                        onClick={() => handlePredict(reactantsPredictInput, selectedType)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md shadow-purple-500/15 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        {tPredictor("predict")}
                      </button>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="bg-zinc-50/40 dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
                    <span className="text-xs text-zinc-500 dark:text-zinc-555 font-bold uppercase tracking-wider block">
                      Common Presets
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PREDICT_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePredictPreset(preset)}
                          className="bg-white hover:bg-zinc-55 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-855 text-zinc-700 dark:text-zinc-300 text-xs px-3.5 py-2 rounded-xl transition-all font-mono font-bold hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-95 cursor-pointer shadow-sm"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-zinc-50/40 dark:bg-zinc-955/20 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800 pb-2">
                        <Sparkles className="w-4 h-4 text-purple-650 dark:text-purple-400" />
                        Reactivity Reference
                      </h3>
                      <p className="text-xs text-zinc-700 dark:text-zinc-400 leading-relaxed font-bold">
                        For displacement reactions, an element can only displace another if it lies higher on the reactivity series:
                      </p>
                      <div className="bg-white dark:bg-zinc-905 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-[11px] font-mono text-zinc-755 dark:text-zinc-400 space-y-2 shadow-sm">
                        <div>
                          <strong className="text-purple-750 dark:text-purple-455">Metal Series:</strong>
                          <div className="flex flex-wrap gap-1 mt-1 font-bold">
                            {["Li", "K", "Ba", "Ca", "Na", "Mg", "Al", "Zn", "Fe", "Ni", "Sn", "Pb", "H", "Cu", "Ag", "Au"].map((el, idx) => (
                              <span key={el} className="flex items-center">
                                {idx > 0 && <span className="text-zinc-400 dark:text-zinc-650 px-0.5">&gt;</span>}
                                <span className={el === "H" ? "text-amber-600 dark:text-amber-400/85 font-extrabold" : ""}>{el}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="border-t border-zinc-150 dark:border-zinc-800 pt-2">
                          <strong className="text-pink-700 dark:text-pink-400">Halogen Series:</strong>
                          <div className="flex flex-wrap gap-1 mt-1 font-bold">
                            {["F", "Cl", "Br", "I"].map((el, idx) => (
                              <span key={el} className="flex items-center">
                                {idx > 0 && <span className="text-zinc-400 dark:text-zinc-650 px-0.5">&gt;</span>}
                                <span>{el}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-[11px] text-zinc-600 dark:text-zinc-500 leading-snug pt-4 border-t border-zinc-200/60 dark:border-zinc-800/40">
                      <HelpCircle className="w-4 h-4 flex-shrink-0 text-zinc-500 dark:text-zinc-450 mt-0.5" />
                      <span className="font-semibold">
                        <strong>Decomposition</strong> usually requires heating (e.g. CaCO₃ → CaO + CO₂).
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {predictError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400 rounded-xl p-4 flex flex-col gap-2.5 animate-in fade-in duration-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-bold leading-normal">{predictError}</div>
                  </div>
                  {suggestedType && (
                    <div className="pl-8 pt-0.5">
                      <button
                        onClick={() => {
                          setSelectedType(suggestedType);
                          handlePredict(reactantsPredictInput, suggestedType);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-900 dark:text-red-300 border border-red-300/40 dark:border-red-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Switch to {suggestedTypeLabel}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Predict Results Panel */}
              {predictResult && (
                <div className="bg-zinc-50/40 dark:bg-zinc-955/20 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 space-y-4 animate-in fade-in duration-300 shadow-sm dark:shadow-none">
                  {predictResult.noReaction ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                        <AlertCircle className="w-5 h-5" />
                        <span>{tPredictor("noReaction")}</span>
                      </div>
                      <p className="text-sm text-zinc-850 dark:text-zinc-300 leading-relaxed font-bold">
                        {predictResult.explanation}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800/50 pb-3">
                        <span className="text-xs text-zinc-550 dark:text-zinc-550 font-bold uppercase tracking-wider">
                          {tPredictor("predictedProducts")}
                        </span>
                        <span className="bg-purple-55/60 dark:bg-purple-500/15 text-purple-755 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize">
                          {(TYPE_TRANSLATION_KEYS[selectedType] ? tPredictor(TYPE_TRANSLATION_KEYS[selectedType]) : selectedType).replace(/_/g, " ")}
                        </span>
                      </div>

                      {/* Balanced Equation */}
                      <div className="p-4 bg-white dark:bg-zinc-905 border border-zinc-200 dark:border-zinc-850 rounded-xl flex items-center justify-between shadow-sm">
                        {predictResult.balancedEquation ? (
                          renderEquationJSX(predictResult.balancedEquation, "purple")
                        ) : (
                          <div className="text-sm font-mono font-bold text-zinc-855 dark:text-zinc-350">
                            {predictResult.unbalancedEquation} (Unbalanced)
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 rounded-lg px-2.5 py-1">
                          <Check className="w-3.5 h-3.5" />
                          Product Formed
                        </div>
                      </div>

                      {/* Products */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-zinc-555 dark:text-zinc-400 font-bold">Products formed:</span>
                        {predictResult.products?.map((p: string, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 text-purple-755 dark:text-purple-300 rounded-xl px-3.5 py-2 text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <span>{renderFormulaJSX(p)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      {predictResult.explanation && (
                        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/50 space-y-2">
                          <span className="text-xs text-zinc-555 dark:text-zinc-400 font-bold block">
                            Reaction Mechanism & Explanation
                          </span>
                          <p className="text-sm text-zinc-850 dark:text-zinc-300 leading-relaxed font-bold">
                            {predictResult.explanation}
                          </p>
                        </div>
                      )}

                      {/* Warning */}
                      {predictResult.balancingError && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl p-3 flex items-start gap-2.5 text-xs font-bold">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>{predictResult.balancingError}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnPresence>

        {/* Help Circle */}
        <div className="absolute bottom-6 right-6">
          <button 
            title="Help / Tutorial"
            className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-800 dark:text-zinc-450 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
          >
            <span className="text-sm font-extrabold font-sans">?</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AnPresence({ children, mode }: { children: React.ReactNode; mode: "wait" }) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}
