"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Element } from "@kimi/data";
import { Dialog, DialogContent } from "../ui/dialog";
import AtomRenderer from "../three/AtomRenderer";
import CardSlider from "./CardSlider";
import { usePreferencesStore } from "../../stores/preferences";
import { useHasHydrated } from "../../hooks/useHasHydrated";
import { Play, Pause, Layers, HelpCircle, X } from "lucide-react";

interface ElementModalProps {
  element: Element;
  isOpen: boolean;
  onClose: () => void;
}

interface ShellGroup {
  shellNum: number;
  label: string;
  electronsCount: number;
  subshellsText: string;
  subshellsList: string[];
}

// Helper to expand noble gases and parse occupied subshells list
function getSubshells(configurationStr: string): string[] {
  if (!configurationStr) return [];
  const nobleGases: Record<string, string> = {
    "[He]": "1s²",
    "[Ne]": "1s² 2s² 2p⁶",
    "[Ar]": "1s² 2s² 2p⁶ 3s² 3p⁶",
    "[Kr]": "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶",
    "[Xe]": "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 5s² 5p⁶",
    "[Rn]": "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 4f¹⁴ 5s² 5p⁶ 5d¹⁰ 6s² 6p⁶"
  };
  let result = configurationStr;
  for (const [gas, val] of Object.entries(nobleGases)) {
    if (result.includes(gas)) {
      result = result.replace(gas, val);
      break;
    }
  }
  return result.split(/\s+/).filter(Boolean).filter(s => /^\d[a-z]/.test(s));
}

function getSubshellBlock(sub: string): "s" | "p" | "d" | "f" {
  const clean = sub.toLowerCase();
  if (clean.includes("s")) return "s";
  if (clean.includes("p")) return "p";
  if (clean.includes("d")) return "d";
  if (clean.includes("f")) return "f";
  return "s";
}

export default function ElementModal({
  element,
  isOpen,
  onClose,
}: ElementModalProps) {
  const locale = useLocale();
  const [localizedElement, setLocalizedElement] = useState<Element>(element);
  const localizedName = localizedElement.name;
  const isKhmer = locale === "km";

  // Load translations for element details dynamically
  useEffect(() => {
    setLocalizedElement(element);
    if (locale === "en") {
      return;
    }
    const loadLocalizedData = async () => {
      try {
        const loaders: Record<string, () => Promise<any>> = {
          // @ts-ignore
          km: () => import("@kimi/data/src/locales/km.js"),
          // @ts-ignore
          zh: () => import("@kimi/data/src/locales/zh.js"),
          // @ts-ignore
          "zh-Hant": () => import("@kimi/data/src/locales/zhHant.js"),
          // @ts-ignore
          fr: () => import("@kimi/data/src/locales/fr.js"),
          // @ts-ignore
          ru: () => import("@kimi/data/src/locales/ru.js"),
          // @ts-ignore
          fa: () => import("@kimi/data/src/locales/fa.js"),
          // @ts-ignore
          ur: () => import("@kimi/data/src/locales/ur.js"),
          // @ts-ignore
          tl: () => import("@kimi/data/src/locales/tl.js"),
        };
        const loader = loaders[locale];
        if (loader) {
          const module = await loader();
          const localizedElements =
            module[`${locale === "zh-Hant" ? "zh_hant" : locale}_elements`] || {};
          const elNum = Number(element.id);
          if (!isNaN(elNum) && localizedElements[elNum]) {
            const locInfo = localizedElements[elNum];
            setLocalizedElement((prev) => {
              if (prev.id !== element.id) return prev;
              return {
                ...prev,
                name: locInfo.name || prev.name,
                level1_basic: {
                  ...prev.level1_basic,
                  commonIons: locInfo.ions !== undefined && locInfo.ions !== "" ? locInfo.ions : prev.level1_basic.commonIons,
                },
                level4_history_stse: {
                  ...prev.level4_history_stse,
                  history: {
                    ...prev.level4_history_stse.history,
                    discoveryYear: locInfo.history?.discoveryYear !== undefined && locInfo.history.discoveryYear !== "" ? locInfo.history.discoveryYear : prev.level4_history_stse.history.discoveryYear,
                    discoveredBy: locInfo.history?.discoveredBy !== undefined && locInfo.history.discoveredBy !== "" ? locInfo.history.discoveredBy : prev.level4_history_stse.history.discoveredBy,
                    namedBy: locInfo.history?.namedBy !== undefined && locInfo.history.namedBy !== "" ? locInfo.history.namedBy : prev.level4_history_stse.history.namedBy,
                  },
                  stseContext: locInfo.stse !== undefined && locInfo.stse.length > 0 ? locInfo.stse : prev.level4_history_stse.stseContext,
                  commonUses: locInfo.uses !== undefined && locInfo.uses.length > 0 ? locInfo.uses : prev.level4_history_stse.commonUses,
                  hazards: locInfo.hazards !== undefined && locInfo.hazards.length > 0 ? locInfo.hazards : prev.level4_history_stse.hazards,
                },
              };
            });
          }
        }
      } catch (err) {
        console.error("Failed to load localized elements details:", err);
      }
    };
    loadLocalizedData();
  }, [locale, element]);

  const hasHydrated = hasHydratedHook();
  function hasHydratedHook() {
    return useHasHydrated();
  }
  const {
    defaultCardIndex,
    isCardIndexLocked,
    reduceMotion,
    animationPaused,
    animationSpeed
  } = usePreferencesStore();

  // Active level state (Level 1, 2, 3, or 4)
  const [activeLevel, setActiveLevel] = useState(0);

  // States for Play/Pause, Layers, Hover highlighting, and Selection
  const [isPaused, setIsPaused] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [hoveredSubshell, setHoveredSubshell] = useState<string | null>(null);
  const [selectedSubshell, setSelectedSubshell] = useState<string | null>(null);

  // Mobile layout states
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"info" | "model">("info");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && hasHydrated && isCardIndexLocked) {
      setActiveLevel(defaultCardIndex);
    } else {
      setActiveLevel(0);
    }
    if (isOpen) {
      setIsPaused(reduceMotion || animationPaused);
      setShowLayers(false);
      setHoveredSubshell(null);
      setSelectedSubshell(null);
      setActiveMobileTab("info");
    }
  }, [isOpen, element, isCardIndexLocked, defaultCardIndex, hasHydrated, reduceMotion, animationPaused]);

  const subshells = useMemo(() => {
    return getSubshells(element.level3_properties?.electronic?.configuration);
  }, [element]);

  const roundedMass = useMemo(() => {
    const raw = element.level2_atomic?.mass?.highSchool || "";
    const cleaned = String(raw).replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? String(raw) : String(Math.round(num));
  }, [element.level2_atomic?.mass?.highSchool]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        showCloseButton={false}
        className={cn(
          // Mobile responsive: anchored bottom-to-top drawer
          "max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:translate-x-0 max-md:translate-y-0",
          "max-md:max-w-full max-md:w-full max-md:h-[92vh] max-md:rounded-t-3xl max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0",
          
          // Desktop centered modal
          "md:max-w-[1360px] md:h-[800px] md:rounded-3xl",
          
          // Shared styles
          "p-0 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800/80 backdrop-blur-xl shadow-2xl overflow-hidden gap-0 select-none flex flex-col",
          
          // Animations: slide up on mobile, zoom on desktop
          "duration-350 ease-out",
          "data-open:animate-in data-open:fade-in-0 max-md:data-open:slide-in-from-bottom-full md:data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 max-md:data-closed:slide-out-to-bottom-full md:data-closed:zoom-out-95"
        )}
      >
        {/* Mobile Tab Swapper Header */}
        {isMobile && (
          <div className="w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 relative flex-shrink-0">
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-2.5">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700/80" />
            </div>
            
            {/* Navigation and Info Row */}
            <div className="w-full flex items-center justify-between px-4 pb-3.5 pt-0.5 gap-2">
              {/* Left: Element Symbol & Name */}
              <div className="flex items-center gap-2 leading-none min-w-0">
                <span className="text-2xl font-black text-zinc-900 dark:text-white leading-none">
                  {element.symbol}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate max-w-[80px]">
                  {localizedName}
                </span>
              </div>

              {/* Center: Tabs Switcher */}
              <div className="inline-flex p-0.5 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/80 rounded-full flex-shrink-0">
                <button
                  onClick={() => setActiveMobileTab("info")}
                  className={`px-4.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeMobileTab === "info"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-current transition-opacity ${activeMobileTab === "info" ? "opacity-100" : "opacity-40"}`} />
                  Details
                </button>
                <button
                  onClick={() => setActiveMobileTab("model")}
                  className={`px-4.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeMobileTab === "model"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-current transition-opacity ${activeMobileTab === "model" ? "opacity-100" : "opacity-40"}`} />
                  3D Model
                </button>
              </div>
              
              {/* Right: Close button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-all duration-150 cursor-pointer active:scale-95 border border-zinc-200 dark:border-zinc-800/80 flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Split Pane Container */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full">
          
          {/* Left Details Pane: Card Details Slider (35% width) */}
          {(!isMobile || activeMobileTab === "info") && (
            <div className="w-full md:w-[35%] min-w-0 p-6 md:p-8 flex flex-col justify-between overflow-y-auto scrollbar-hide bg-zinc-50/50 dark:bg-zinc-950/40 md:border-r border-zinc-200 dark:border-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800/60 md:border-b-0 h-full">
              {/* Nuclide Header Stack info */}
              <div className="hidden md:flex items-center gap-3 mb-6 select-none pl-1">
                <div className="flex flex-col text-right leading-none font-bold text-xs font-mono text-zinc-500 dark:text-zinc-400 select-none gap-0.5">
                  <span>{roundedMass}</span>
                  <span>{element.id}</span>
                </div>
                <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                  {element.symbol}
                </h2>
                <span className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-200 tracking-tight ml-2">
                  {localizedName}
                </span>
              </div>

              <CardSlider
                element={localizedElement}
                activeLevel={activeLevel}
                onChangeLevel={setActiveLevel}
              />
            </div>
          )}

          {/* Right Visual Pane: 3D Atom Renderer (65% width) */}
          {(!isMobile || activeMobileTab === "model") && (
            <div className="relative w-full md:w-[65%] min-w-0 overflow-hidden bg-zinc-900/10 max-md:p-4 md:p-6 flex flex-col items-center justify-center max-md:min-h-[250px] md:min-h-[500px] h-full flex-1">
              
              {/* Custom Close Button overlay */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-20 w-8 h-8 rounded-full bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center text-zinc-555 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-white hover:border-zinc-300 hover:dark:border-zinc-700 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm hidden md:flex"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

            {/* Top left: Occupied subshells pills (only when layers mode is active) */}
            {showLayers && (
              <div className="absolute top-6 left-6 z-10 flex items-center gap-1.5 flex-wrap max-w-[calc(100%-80px)]">
                {(!hoveredSubshell && !selectedSubshell) ? (
                  <div className="px-4 py-1.5 rounded-full text-xs font-mono font-bold text-zinc-750 dark:text-zinc-300 bg-white/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 backdrop-blur-md select-none flex items-center justify-center shadow-sm">
                    {element.level3_properties?.electronic?.configuration}
                  </div>
                ) : (
                  subshells.map((sub) => {
                    const block = getSubshellBlock(sub);
                    const isHovered = hoveredSubshell === sub;
                    const isSelected = selectedSubshell === sub;
                    const isAnyActive = hoveredSubshell !== null || selectedSubshell !== null;
                    const isSelfActive = isHovered || isSelected;

                    const blockStyles = {
                      s: {
                        idle: "border-red-200 dark:border-red-500/30 text-red-750 dark:text-red-300 bg-red-50 dark:bg-red-500/10 hover:border-red-305 dark:hover:border-red-400/50 hover:bg-red-100 dark:hover:bg-red-500/20",
                        active: "border-red-500 dark:border-red-400 text-red-950 dark:text-white bg-red-100 dark:bg-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)] dark:shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                      },
                      p: {
                        idle: "border-blue-200 dark:border-blue-500/30 text-blue-750 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:border-blue-305 dark:hover:border-blue-400/50 hover:bg-blue-100 dark:hover:bg-blue-500/20",
                        active: "border-blue-500 dark:border-blue-400 text-blue-950 dark:text-white bg-blue-100 dark:bg-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)] dark:shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                      },
                      d: {
                        idle: "border-yellow-250 dark:border-yellow-500/30 text-yellow-855 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-500/10 hover:border-yellow-305 dark:hover:border-yellow-400/50 hover:bg-yellow-100 dark:hover:bg-yellow-500/20",
                        active: "border-yellow-500 dark:border-yellow-400 text-yellow-950 dark:text-white bg-yellow-100 dark:bg-yellow-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] dark:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                      },
                      f: {
                        idle: "border-purple-200 dark:border-purple-500/30 text-purple-750 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 hover:border-purple-305 dark:hover:border-purple-400/50 hover:bg-purple-100 dark:hover:bg-purple-500/20",
                        active: "border-purple-500 dark:border-purple-400 text-purple-950 dark:text-white bg-purple-100 dark:bg-purple-500/40 shadow-[0_0_12px_rgba(139,92,246,0.2)] dark:shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                      }
                    };

                    let colorClass = "";
                    if (isSelfActive) {
                      colorClass = blockStyles[block].active;
                    } else if (isAnyActive) {
                      colorClass = "border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-950/20 hover:border-zinc-300 hover:dark:border-zinc-700 hover:text-zinc-650 hover:dark:text-zinc-400";
                    } else {
                      colorClass = blockStyles[block].idle;
                    }

                    return (
                      <button
                        key={sub}
                        onMouseEnter={() => setHoveredSubshell(sub)}
                        onMouseLeave={() => setHoveredSubshell(null)}
                        onClick={() => setSelectedSubshell(isSelected ? null : sub)}
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border transition-all cursor-pointer select-none active:scale-95 ${colorClass} ${
                          isHovered ? "scale-105" : ""
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* 3D WebGL Canvas */}
            <div className="w-full flex-1 flex items-center justify-center relative">
              <AtomRenderer 
                element={element}
                animationPaused={isPaused}
                animationSpeed={animationSpeed}
                showLayers={showLayers}
                hoveredSubshell={hoveredSubshell}
                selectedSubshell={selectedSubshell}
                subshells={subshells}
                onHoverSubshell={setHoveredSubshell}
                onSelectSubshell={setSelectedSubshell}
              />
            </div>

            {/* Glassmorphic Subshell Information Card Overlay */}
            {showLayers && selectedSubshell !== null && (
              <div className="absolute right-6 top-20 z-20 w-64 p-4 rounded-2xl bg-white/95 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/80 backdrop-blur-xl shadow-xl text-zinc-900 dark:text-white flex flex-col gap-2.5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      selectedSubshell.includes("s") ? "bg-red-500" :
                      selectedSubshell.includes("p") ? "bg-blue-500" :
                      selectedSubshell.includes("d") ? "bg-yellow-500" :
                      "bg-purple-500"
                    }`} />
                    <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                      {isKhmer ? `ស្រទាប់រង ${selectedSubshell}` : `Subshell ${selectedSubshell}`}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedSubshell(null)}
                    className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer p-0.5"
                    aria-label="Dismiss subshell info"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div>
                  <div className="text-2xl font-black tracking-tight leading-none text-zinc-900 dark:text-white">
                    {(() => {
                      const normalNumMap: Record<string, number> = {
                        "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9, "⁰": 0,
                        "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "0": 0
                      };
                      const sup = selectedSubshell.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁰\d]+)$/)?.[0] || "";
                      let count = 0;
                      for (const char of sup) {
                        count = count * 10 + (normalNumMap[char] ?? parseInt(char) ?? 0);
                      }
                      return count;
                    })()} <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{isKhmer ? "អេឡិចត្រុង" : "electrons"}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono mt-1">
                    {isKhmer ? `កម្រិតថាមពលស្រទាប់៖ n=${selectedSubshell[0]}` : `Shell energy level: n=${selectedSubshell[0]}`}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{isKhmer ? "ប្លុកអ័រប៊ីតាល់" : "Orbital block"}</span>
                  <div className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200">
                    {selectedSubshell.includes("s") && (isKhmer ? "ប្លុក Sharp (s) — រាងស្វ៊ែរ" : "Sharp (s) Block — spherical orbital shape")}
                    {selectedSubshell.includes("p") && (isKhmer ? "ប្លុក Principal (p) — រាងដំបារទម្ងន់" : "Principal (p) Block — dumbbell orbital shape")}
                    {selectedSubshell.includes("d") && (isKhmer ? "ប្លុក Diffuse (d) — រាងស្លឹកត្របាញ់ (cloverleaf)" : "Diffuse (d) Block — cloverleaf orbital shape")}
                    {selectedSubshell.includes("f") && (isKhmer ? "ប្លុក Fundamental (f) — រាងស្មុគស្មាញពហុកំពក" : "Fundamental (f) Block — multi-lobed complex shape")}
                  </div>
                </div>

                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1">
                  {selectedSubshell.includes("s") && (isKhmer 
                    ? `ស្រទាប់រង ${selectedSubshell[0]}s ផ្ទុកអេឡិចត្រុងបានរហូតដល់ ២។ វាជាស្រទាប់រងដែលមានថាមពលទាបបំផុតនៅក្នុងកម្រិតស្រទាប់ ${selectedSubshell[0]}។` 
                    : `The ${selectedSubshell[0]}s subshell holds up to 2 electrons. It is the lowest energy subshell in shell level ${selectedSubshell[0]}.`)}
                  {selectedSubshell.includes("p") && (isKhmer 
                    ? `ស្រទាប់រង ${selectedSubshell[0]}p ផ្ទុកអេឡិចត្រុងបានរហូតដល់ ៦ ក្នុងអ័រប៊ីតាល់រាងដំបារទម្ងន់កែងគ្នាចំនួនបី។` 
                    : `The ${selectedSubshell[0]}p subshell holds up to 6 electrons in three orthogonal dumbbell-shaped orbitals.`)}
                  {selectedSubshell.includes("d") && (isKhmer 
                    ? `ស្រទាប់រង ${selectedSubshell[0]}d ផ្ទុកអេឡិចត្រុងបានរហូតដល់ ១០ ក្នុងអ័រប៊ីតាល់រាងស្លឹកត្របាញ់ស្មុគស្មាញចំនួនប្រាំ។` 
                    : `The ${selectedSubshell[0]}d subshell holds up to 10 electrons across five complex cloverleaf-shaped orbitals.`)}
                  {selectedSubshell.includes("f") && (isKhmer 
                    ? `ស្រទាប់រង ${selectedSubshell[0]}f ផ្ទុកអេឡិចត្រុងបានរហូតដល់ ១៤ ក្នុងអ័រប៊ីតាល់រាងពហុកំពកស្មុគស្មាញបំផុតចំនួនប្រាំពីរ។` 
                    : `The ${selectedSubshell[0]}f subshell holds up to 14 electrons across seven highly complex multi-lobed orbitals.`)}
                </p>
              </div>
            )}

            {/* Bottom Left controls overlay */}
            <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 hover:dark:text-white hover:border-zinc-350 hover:dark:border-zinc-700 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
                title={isPaused ? "Play Animation" : "Pause Animation"}
              >
                {isPaused ? <Play className="w-[18px] h-[18px] md:w-4 md:h-4 fill-current" /> : <Pause className="w-[18px] h-[18px] md:w-4 md:h-4 fill-current" />}
              </button>

              {/* Layers Button */}
              <button
                onClick={() => setShowLayers(!showLayers)}
                className={`w-11 h-11 md:w-10 md:h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                  showLayers 
                    ? "bg-blue-600/20 border-blue-500/60 text-blue-500 dark:text-blue-400 hover:bg-blue-600/30" 
                    : "bg-white/60 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/80 text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 hover:dark:text-white hover:border-zinc-350 hover:dark:border-zinc-700 shadow-sm"
                }`}
                title={showLayers ? "Hide Orbital Layers" : "Show Orbital Layers"}
              >
                <Layers className="w-[18px] h-[18px] md:w-4 md:h-4" />
              </button>
            </div>

            {/* Bottom Right Help/Info Overlay */}
            <div className="absolute bottom-6 right-6 z-10">
              <button
                className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center text-zinc-550 dark:text-zinc-400 hover:text-zinc-950 hover:dark:text-white hover:border-zinc-350 hover:dark:border-zinc-700 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
                title="Help & Info"
              >
                <HelpCircle className="w-[18px] h-[18px] md:w-4 md:h-4" />
              </button>
            </div>

          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
