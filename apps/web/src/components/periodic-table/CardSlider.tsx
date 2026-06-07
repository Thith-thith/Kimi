"use client";

import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Element, IsotopeData } from "@kimi/data";
import { Lock, Unlock, ChevronLeft, ChevronRight } from "lucide-react";
import { usePreferencesStore } from "../../stores/preferences";
import { useHasHydrated } from "../../hooks/useHasHydrated";
import {
  formatTemperature,
  formatDensity,
  formatEnergy,
  formatRadius,
  formatSpecificHeat,
} from "../../utils/unitConverter";

function getElementBlock(element: Element): string {
  const id = element.id;
  const group = element.level1_basic.group;
  const type = element.level1_basic.type;

  if (id === 2) return "s";
  if (id === 1) return "s";
  
  if ((id >= 57 && id <= 71) || (id >= 89 && id <= 103)) {
    return "f";
  }
  
  if (group === 1 || group === 2) return "s";
  if (typeof group === "number" && group >= 3 && group <= 12) return "d";
  if (typeof group === "number" && group >= 13 && group <= 18) return "p";
  
  const typeLower = type?.toLowerCase() || "";
  if (typeLower.includes("lanthanide") || typeLower.includes("actinide")) return "f";
  if (typeLower.includes("transition")) return "d";
  if (typeLower.includes("alkali") || typeLower.includes("alkaline")) return "s";
  
  return "p";
}

// Helper to format isotope names to superscript the mass number (e.g. 23Na -> ²³Na)
function formatIsotopeName(name: string) {
  const match = name.match(/^(\d+)([A-Za-z]+)$/);
  if (match) {
    return (
      <span className="font-mono text-zinc-900 dark:text-zinc-100">
        <sup className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mr-0.5">{match[1]}</sup>
        <span className="font-bold text-sm">{match[2]}</span>
      </span>
    );
  }
  return <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">{name}</span>;
}

// Helper to parse common ions format: "Na⁺ (Sodium)" -> { symbol: "Na⁺", name: "Sodium" }
function parseCommonIon(ionStr: string): { symbol: string; name: string } {
  const match = ionStr.trim().match(/^([^\s(]+)\s*\(([^)]+)\)$/);
  if (match) {
    return { symbol: match[1], name: match[2] };
  }
  return { symbol: ionStr.trim(), name: "" };
}

interface CardSliderProps {
  element: Element;
  activeLevel: number;
  onChangeLevel: (level: number) => void;
}

export default function CardSlider({
  element,
  activeLevel,
  onChangeLevel,
}: CardSliderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const hasHydrated = useHasHydrated();

  // Locked default card settings from Zustand store
  const {
    defaultCardIndex,
    isCardIndexLocked,
    setDefaultCardIndex,
    setIsCardIndexLocked,
    tempUnit,
    densityUnit,
    energyUnit,
    radiusUnit,
    heatUnit,
  } = usePreferencesStore();

  const handleToggleLock = () => {
    if (isCardIndexLocked && defaultCardIndex === activeLevel) {
      setIsCardIndexLocked(false);
    } else {
      setDefaultCardIndex(activeLevel);
      setIsCardIndexLocked(true);
    }
  };

  const isCurrentLevelLocked =
    hasHydrated && isCardIndexLocked && defaultCardIndex === activeLevel;

  // Keyboard navigation for card switching (Left/Right Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        onChangeLevel(Math.min(activeLevel + 1, 3));
      } else if (e.key === "ArrowLeft") {
        onChangeLevel(Math.max(activeLevel - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLevel, onChangeLevel]);

  // Helper to localize isotope percent strings (e.g. "Stable (99.98%)" -> "ស្ថេរភាព (99.98%)")
  const localizePercent = (percentStr: string) => {
    if (!percentStr) return "";
    let result = percentStr;
    const stableLabel = t("elementL2.stable") || "Stable";
    const radioactiveLabel = t("elementL2.radioactive") || "Radioactive";
    
    result = result.replace(/stable/gi, stableLabel);
    result = result.replace(/radioactive/gi, radioactiveLabel);
    if (locale === "km") {
      result = result.replace(/synthetic/gi, "សំយោគ");
      result = result.replace(/trace/gi, "ដាន");
    }
    return result;
  };

  // Helper to localize element category/type dynamically using tableLegend keys
  const localizeCategory = (category: string) => {
    if (!category) return "";
    const clean = category.toLowerCase().trim();
    if (clean.includes("alkali metal")) return t("tableLegend.alkaliMetal");
    if (clean.includes("alkaline earth")) return t("tableLegend.alkalineEarth");
    if (clean.includes("transition metal") && !clean.includes("post-")) return t("tableLegend.transitionMetal");
    if (clean.includes("post-transition")) return t("tableLegend.postTransition");
    if (clean.includes("metalloid")) return t("tableLegend.metalloid");
    if (clean.includes("halogen")) return t("tableLegend.halogen");
    if (clean.includes("noble gas")) return t("tableLegend.nobleGas");
    if (clean.includes("lanthanide")) return t("tableLegend.lanthanide");
    if (clean.includes("actinide")) return t("tableLegend.actinide");
    if (clean.includes("nonmetal")) return t("tableLegend.otherNonmetal");
    return category;
  };

  // Helper to localize element phase at STP dynamically using eit.propertyVal keys
  const localizePhase = (phase: string) => {
    if (!phase) return "";
    const clean = phase.toLowerCase().trim();
    if (clean === "solid") return t("eit.propertyVal.Solid");
    if (clean === "liquid") return t("eit.propertyVal.Liquid");
    if (clean === "gas") return t("eit.propertyVal.Gas");
    if (clean === "unknown") return t("eit.propertyVal.Unknown");
    return phase;
  };

  // Labels for the levels
  const levels = [
    { num: 1, label: t("nav.standard") },
    { num: 2, label: t("elementL2.atomicParticles") },
    { num: 3, label: t("nav.advanced") },
    { num: 4, label: t("elementL4.history") },
  ];

  // Active level colors mapping
  const levelColors = [
    "bg-zinc-950 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-125",
    "bg-zinc-950 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-125",
    "bg-zinc-950 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-125",
    "bg-zinc-950 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-125"
  ];

  // Block & Theme Calculation
  const blockVal = (element.level1_basic.block || getElementBlock(element)).toLowerCase();
  const blockColorMap: Record<string, { text: string; bg: string; border: string; accent: string; line: string }> = {
    s: { 
      text: "text-red-750 dark:text-red-400", 
      bg: "bg-red-500/10", 
      border: "border-red-500/20", 
      accent: "bg-red-500/10 dark:bg-red-500/20 text-red-950 dark:text-red-300 border-red-500/20 dark:border-red-500/30", 
      line: "border-red-500/50" 
    },
    p: { 
      text: "text-blue-750 dark:text-blue-400", 
      bg: "bg-blue-500/10", 
      border: "border-blue-500/20", 
      accent: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-950 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30", 
      line: "border-blue-500/50" 
    },
    d: { 
      text: "text-yellow-850 dark:text-yellow-400", 
      bg: "bg-yellow-500/10", 
      border: "border-yellow-500/20", 
      accent: "bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-950 dark:text-yellow-300 border-yellow-500/20 dark:border-yellow-500/30", 
      line: "border-yellow-500/50" 
    },
    f: { 
      text: "text-purple-750 dark:text-purple-400", 
      bg: "bg-purple-500/10", 
      border: "border-purple-500/20", 
      accent: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-950 dark:text-purple-300 border-purple-500/20 dark:border-purple-500/30", 
      line: "border-purple-500/50" 
    }
  };
  const theme = blockColorMap[blockVal] || { text: "text-zinc-800 dark:text-zinc-200", bg: "bg-zinc-100 dark:bg-zinc-950/45", border: "border-zinc-200 dark:border-zinc-800/60", accent: "bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/50", line: "border-zinc-300 dark:border-zinc-700/50" };

  // Slide 1 computations
  const groupVal = element.level1_basic.group;
  const periodVal = element.level1_basic.period;
  const groupPeriodText = groupVal ? `${groupVal} / ${periodVal}` : periodVal;
  const ionsText = element.level1_basic.commonIons || "";
  const hasIons = ionsText && !ionsText.toLowerCase().includes("no common ions");

  // Slide 2 computations
  const protonsCount = Number(element.level2_atomic.protons) || 0;
  const massConventional = Math.round(parseFloat(element.level2_atomic.mass.highSchool || "0"));
  const calculatedNeutrons = massConventional ? massConventional - protonsCount : 0;
  const electronsCount = element.level2_atomic.electronsNeutral;

  return (
    <div className="flex flex-col h-full w-full justify-between">
      
      {/* 3D sliding cards frame container */}
      <div className="relative flex-1 overflow-hidden min-h-[350px] py-1">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{
            transform: `translate3d(calc(-${activeLevel * 100}% - ${activeLevel * 24}px), 0, 0)`,
            gap: "24px",
          }}
        >
          {/* Card 1: Level 1 Basic (Standard Insights) */}
          <div
            className="w-full flex-shrink-0 flex flex-col justify-between bg-white dark:bg-zinc-950/40 border border-zinc-205 dark:border-zinc-800/50 rounded-2xl p-5 backdrop-blur-md overflow-y-auto transition-all duration-500 shadow-sm dark:shadow-none"
            style={{
              transform: `perspective(1000px) rotateY(${(activeLevel - 0) * -15}deg) scale(${
                1 - Math.abs(activeLevel - 0) * 0.05
              })`,
              opacity: activeLevel === 0 ? 1 : 0.4,
            }}
          >
            {/* Header info */}
            <div>
              <h3 className="text-sm font-semibold uppercase text-zinc-550 dark:text-zinc-400 tracking-widest mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                {locale === "km" ? "ព័ត៌មានទូទៅ" : `${t("nav.standard")} Insights`}
              </h3>
              
              {/* Properties List Rows */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL1.type")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-sm capitalize text-right">
                    {localizeCategory(element.level1_basic.type)}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL1.groupPeriod")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-sm font-mono text-right">
                    {groupPeriodText}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL1.phaseSTP")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-sm capitalize text-right">
                    {localizePhase(element.level1_basic.phaseAtSTP)}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL1.electronBlock")}
                  </span>
                  <span className={`font-bold text-sm font-mono capitalize text-right ${theme.text}`}>
                    {t(`eit.propertyVal.${blockVal}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Common Ions Sub-card */}
            <div className="mt-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 p-4 rounded-xl">
              <span className="text-zinc-550 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-widest block text-center mb-3">
                {t("elementL1.commonIons")}
              </span>
              <div className="flex flex-col gap-2">
                {hasIons ? (
                  ionsText.split(/,\s*/).map((ionRaw, idx) => {
                    const parsed = parseCommonIon(ionRaw);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${theme.accent}`}
                      >
                        <span className="font-bold font-mono text-sm">{parsed.symbol}</span>
                        {parsed.name && (
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
                            {parsed.name}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-600 font-medium italic text-xs block text-center">
                    {t("elementL1.noCommonIons")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Level 2 Atomic (Atomic Particles) */}
          <div
            className="w-full flex-shrink-0 flex flex-col justify-between bg-white dark:bg-zinc-950/40 border border-zinc-205 dark:border-zinc-800/50 rounded-2xl p-5 backdrop-blur-md overflow-y-auto transition-all duration-500 shadow-sm dark:shadow-none"
            style={{
              transform: `perspective(1000px) rotateY(${(activeLevel - 1) * -15}deg) scale(${
                1 - Math.abs(activeLevel - 1) * 0.05
              })`,
              opacity: activeLevel === 1 ? 1 : 0.4,
            }}
          >
            {/* Header info */}
            <div>
              <h3 className="text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-widest mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                {t("elementL2.atomicParticles")}
              </h3>

              {/* Properties List Rows */}
              <div className="space-y-3.5 mb-5">
                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL2.avgAtomicMass")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-sm font-mono text-right">
                    {element.level2_atomic.mass.highSchool} u
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL2.configuration")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-xs font-mono select-all text-right">
                    {element.level3_properties.electronic.configuration}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL1.valenceElectrons")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-sm font-mono text-right">
                    {element.level1_basic.valenceElectrons || "N/A"}
                  </span>
                </div>
              </div>

              {/* Subatomic Horizontal Counters Column block */}
              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-4 pb-1">
                <div className="flex-1 text-center border-r border-zinc-200 dark:border-zinc-800/60 last:border-r-0">
                  <span className="text-red-650 dark:text-red-400 font-black text-xl block leading-none font-mono mb-1.5">
                    {protonsCount}
                  </span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                    {t("elementL2.protonsShort")}
                  </span>
                </div>

                <div className="flex-1 text-center border-r border-zinc-200 dark:border-zinc-800/60 last:border-r-0">
                  <span className="text-zinc-700 dark:text-zinc-300 font-black text-xl block leading-none font-mono mb-1.5">
                    {calculatedNeutrons}
                  </span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                    {t("elementL2.neutronsShort")}
                  </span>
                </div>

                <div className="flex-1 text-center border-r border-zinc-200 dark:border-zinc-800/60 last:border-r-0">
                  <span className="text-blue-650 dark:text-blue-400 font-black text-xl block leading-none font-mono mb-1.5">
                    {electronsCount}
                  </span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                    {t("elementL2.electronsShort")}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Isotopes Sub-card */}
            {element.level2_atomic.naturalIsotopes && element.level2_atomic.naturalIsotopes.length > 0 && (
              <div className="mt-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-205 dark:border-zinc-800/40 p-4 rounded-xl">
                <span className="text-zinc-550 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-widest block text-center mb-3">
                  {t("elementL2.keyIsotopes")}
                </span>
                <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {element.level2_atomic.naturalIsotopes.map((iso: IsotopeData) => (
                    <div
                      key={iso.name}
                      className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900/40 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0"
                    >
                      <div>
                        {formatIsotopeName(iso.name)}
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                          {iso.neutron} n⁰
                        </span>
                        <span className="text-[9px] uppercase font-bold text-emerald-605 dark:text-emerald-400 font-sans tracking-wide">
                          {localizePercent(iso.percent)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Level 3 Advanced (Physical Trends) */}
          <div
            className="w-full flex-shrink-0 flex flex-col justify-between bg-white dark:bg-zinc-950/40 border border-zinc-205 dark:border-zinc-800/50 rounded-2xl p-5 backdrop-blur-md overflow-y-auto transition-all duration-500 shadow-sm dark:shadow-none"
            style={{
              transform: `perspective(1000px) rotateY(${(activeLevel - 2) * -15}deg) scale(${
                1 - Math.abs(activeLevel - 2) * 0.05
              })`,
              opacity: activeLevel === 2 ? 1 : 0.4,
            }}
          >
            {/* Oxidation States Nested Subcard */}
            <div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 p-3.5 rounded-xl mb-4">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-zinc-550 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                    {t("elementL3.oxidationStates")}
                  </span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-sans">
                    ● {t("elementL3.common")}  o {t("elementL3.possible")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {element.level3_properties.electronic.oxidationStates.common.map((st) => (
                    <span
                      key={st}
                      className={`px-2 py-0.5 rounded-md font-bold font-mono text-xs ${theme.accent}`}
                    >
                      {st}
                    </span>
                  ))}
                  {element.level3_properties.electronic.oxidationStates.possible.map((st) => (
                    <span
                      key={st}
                      className="px-2 py-0.5 rounded-md font-medium font-mono text-xs border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              {/* Physical properties 2-column grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                {/* Column 1 properties */}
                <div className={`border-l-2 ${theme.line} pl-2.5`}>
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest block mb-0.5">
                    {t("elementL3.firstIonization")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-xs font-mono">
                    {formatEnergy(element.level3_properties.physical.firstIonization, energyUnit)}
                  </span>
                </div>

                <div className={`border-l-2 ${theme.line} pl-2.5`}>
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest block mb-0.5">
                    {t("elementL3.electronAffinity")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-xs font-mono">
                    {formatEnergy(element.level3_properties.physical.electronAffinity, energyUnit)}
                  </span>
                </div>

                <div className={`border-l-2 ${theme.line} pl-2.5`}>
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest block mb-0.5">
                    {t("elementL3.electronegativity")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-xs font-mono">
                    {element.level3_properties.physical.electronegativity || "N/A"}
                  </span>
                </div>

                <div className={`border-l-2 ${theme.line} pl-2.5`}>
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest block mb-0.5">
                    {t("elementL3.density")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-xs font-mono">
                    {formatDensity(element.level3_properties.physical.density, densityUnit)}
                  </span>
                </div>

                <div className={`border-l-2 ${theme.line} pl-2.5`}>
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest block mb-0.5">
                    {t("elementL3.meltingPoint")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-xs">
                    {formatTemperature(element.level3_properties.physical.meltingPoint, tempUnit)}
                  </span>
                </div>

                <div className={`border-l-2 ${theme.line} pl-2.5`}>
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest block mb-0.5">
                    {t("elementL3.boilingPoint")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-xs">
                    {formatTemperature(element.level3_properties.physical.boilingPoint, tempUnit)}
                  </span>
                </div>

                <div className={`border-l-2 ${theme.line} pl-2.5`}>
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest block mb-0.5">
                    {t("elementL3.atomicRadius")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-xs font-mono">
                    {formatRadius(element.level3_properties.physical.atomicRadius, radiusUnit)}
                  </span>
                </div>

                <div className={`border-l-2 ${theme.line} pl-2.5`}>
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest block mb-0.5">
                    {t("elementL3.specificHeat")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-xs font-mono">
                    {formatSpecificHeat(element.level3_properties.physical.specificHeat, heatUnit)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Spacer to align bottom pagination */}
            <div />
          </div>

          {/* Card 4: Level 4 History & STSE */}
          <div
            className="w-full flex-shrink-0 flex flex-col justify-between bg-white dark:bg-zinc-950/40 border border-zinc-205 dark:border-zinc-800/50 rounded-2xl p-5 backdrop-blur-md overflow-y-auto transition-all duration-500 shadow-sm dark:shadow-none"
            style={{
              transform: `perspective(1000px) rotateY(${(activeLevel - 3) * -15}deg) scale(${
                1 - Math.abs(activeLevel - 3) * 0.05
              })`,
              opacity: activeLevel === 3 ? 1 : 0.4,
            }}
          >
            {/* Header and list info */}
            <div>
              <h3 className="text-sm font-semibold uppercase text-zinc-550 dark:text-zinc-400 tracking-widest mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                {t("elementL4.history")}
              </h3>

              {/* Discovery Details */}
              <div className="space-y-3.5 mb-5">
                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL4.discoveryYear")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-sm font-mono text-right">
                    {element.level4_history_stse.history.discoveryYear || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL4.discoveredBy")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-sm text-right">
                    {element.level4_history_stse.history.discoveredBy || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                    {t("elementL4.namedBy")}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-bold text-sm text-right">
                    {element.level4_history_stse.history.namedBy || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* STSE Context Bullet Capsules */}
            <div className="space-y-3 mt-1">
              {element.level4_history_stse.stseContext && element.level4_history_stse.stseContext.length > 0 && (
                <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-250 dark:border-emerald-500/20 border-l-2 border-l-emerald-500 p-3 rounded-r-xl">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[8px] tracking-widest block mb-1">
                    {t("elementL4.stseContext")}
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium text-xs leading-relaxed">
                    {element.level4_history_stse.stseContext.join(", ")}
                  </p>
                </div>
              )}

              {element.level4_history_stse.commonUses && element.level4_history_stse.commonUses.length > 0 && (
                <div className="bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 border-l-2 border-l-zinc-500 p-3 rounded-r-xl">
                  <span className="text-zinc-550 dark:text-zinc-450 font-bold uppercase text-[8px] tracking-widest block mb-1">
                    {t("elementL4.commonUses")}
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium text-xs leading-relaxed">
                    {element.level4_history_stse.commonUses.join(", ")}
                  </p>
                </div>
              )}

              {element.level4_history_stse.hazards && element.level4_history_stse.hazards.length > 0 && (
                <div className="bg-rose-500/5 dark:bg-rose-500/5 border border-rose-250 dark:border-rose-500/20 border-l-2 border-l-rose-500 p-3 rounded-r-xl">
                  <span className="text-rose-700 dark:text-rose-400 font-bold uppercase text-[8px] tracking-widest block mb-1">
                    {t("elementL4.hazards")}
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium text-xs leading-relaxed">
                    {element.level4_history_stse.hazards.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom pagination dots & lock button */}
      <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-4 mt-6 select-none">
        
        {/* Glowing Chevron Controls + Color Dots Pagination */}
        <div className="flex items-center gap-3">
          {/* Previous Arrow Button */}
          <button
            onClick={() => onChangeLevel(Math.max(activeLevel - 1, 0))}
            disabled={activeLevel === 0}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
              activeLevel === 0
                ? "border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-950/20 text-zinc-350 dark:text-zinc-700 cursor-not-allowed"
                : "border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-white hover:border-zinc-350 hover:dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 cursor-pointer"
            }`}
            title={t("common.previousSlide")}
            aria-label={t("common.previousSlide")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2 px-1">
            {levels.map((lvl, index) => {
              const isActive = activeLevel === index;
              return (
                <button
                  key={lvl.num}
                  onClick={() => onChangeLevel(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? levelColors[index]
                      : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-450 dark:hover:bg-zinc-500 hover:scale-110"
                  }`}
                  title={lvl.label}
                  aria-label={`Go to slide ${lvl.num}`}
                />
              );
            })}
          </div>

          {/* Next Arrow Button */}
          <button
            onClick={() => onChangeLevel(Math.min(activeLevel + 1, 3))}
            disabled={activeLevel === 3}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
              activeLevel === 3
                ? "border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-950/20 text-zinc-355 dark:text-zinc-700 cursor-not-allowed"
                : "border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-white hover:border-zinc-350 hover:dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 cursor-pointer"
            }`}
            title={t("common.nextSlide")}
            aria-label={t("common.nextSlide")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Persist Lock Button */}
        <button
          onClick={handleToggleLock}
          className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 cursor-pointer ${
            isCurrentLevelLocked
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
              : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
          }`}
          title={t("tutorial.step3Title")}
        >
          {isCurrentLevelLocked ? (
            <>
              <Lock className="w-3 h-3 text-yellow-500 dark:text-yellow-400 animate-pulse" />
              <span>{t("common.locked")}</span>
            </>
          ) : (
            <>
              <Unlock className="w-3 h-3 text-zinc-450 dark:text-zinc-500" />
              <span>{t("common.lockView")}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
