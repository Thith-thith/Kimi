"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Ion } from "@kimi/data";
import { Dialog, DialogContent } from "../ui/dialog";
import { formatChem } from "./IonCard";
import { Lock, Unlock, Sparkles, AlertTriangle, ShieldCheck, X, ChevronLeft, ChevronRight } from "lucide-react";
import { usePreferencesStore } from "../../stores/preferences";
import { useHasHydrated } from "../../hooks/useHasHydrated";
import { IonAnimations } from "./IonAnimations";
import { formatEnergy, formatRadius } from "../../utils/unitConverter";

interface IonModalProps {
  ion: Ion;
  isOpen: boolean;
  onClose: () => void;
}

export default function IonModal({ ion, isOpen, onClose }: IonModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const hasHydrated = useHasHydrated();
  const {
    defaultCardIndex,
    isCardIndexLocked,
    setDefaultCardIndex,
    setIsCardIndexLocked,
    reduceMotion,
    animationPaused,
    energyUnit,
    radiusUnit,
  } = usePreferencesStore();

  const isPaused = reduceMotion || animationPaused;
  const playState = isPaused ? "paused" : "running";

  const [activeLevel, setActiveLevel] = useState(0);
  const [localizedIon, setLocalizedIon] = useState<Ion>(ion);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load translations for ion details dynamically
  useEffect(() => {
    setLocalizedIon(ion);
    if (locale === "en") {
      return;
    }
    const loadLocalizedData = async () => {
      try {
        const loaders: Record<string, () => Promise<any>> = {
          // @ts-ignore
          km: () => import("@kimi/data/src/locales/ions/km.js"),
          // @ts-ignore
          zh: () => import("@kimi/data/src/locales/ions/zh.js"),
          // @ts-ignore
          "zh-Hant": () => import("@kimi/data/src/locales/ions/zhHant.js"),
          // @ts-ignore
          fr: () => import("@kimi/data/src/locales/ions/fr.js"),
          // @ts-ignore
          ru: () => import("@kimi/data/src/locales/ions/ru.js"),
          // @ts-ignore
          fa: () => import("@kimi/data/src/locales/ions/fa.js"),
          // @ts-ignore
          ur: () => import("@kimi/data/src/locales/ions/ur.js"),
          // @ts-ignore
          tl: () => import("@kimi/data/src/locales/ions/tl.js"),
        };
        const loader = loaders[locale];
        if (loader) {
          const module = await loader();
          const key = `${locale === "zh-Hant" ? "zh_hant" : locale}_ions`;
          const localizedIons = module[key] || {};
          const ionId = ion.id;
          if (localizedIons[ionId]) {
            const locInfo = localizedIons[ionId];
            setLocalizedIon((prev) => {
              if (prev.id !== ion.id) return prev;
              return {
                ...prev,
                name: locInfo.name || prev.name,
                customData: {
                  ...prev.customData,
                  level1: {
                    ...prev.customData.level1,
                    type: locInfo.customData?.level1?.type || prev.customData.level1.type,
                    source: locInfo.customData?.level1?.source || prev.customData.level1.source,
                    phase: locInfo.customData?.level1?.phase || prev.customData.level1.phase,
                    valence: locInfo.customData?.level1?.valence || prev.customData.level1.valence,
                    keyCompounds: locInfo.customData?.level1?.keyCompounds || prev.customData.level1.keyCompounds,
                  },
                  level2: {
                    ...prev.customData.level2,
                    molarMass: locInfo.customData?.level2?.molarMass || prev.customData.level2.molarMass,
                    subatomic: locInfo.customData?.level2?.subatomic || prev.customData.level2.subatomic,
                    statusBanner: locInfo.customData?.level2?.statusBanner || prev.customData.level2.statusBanner,
                    slotA: {
                      ...prev.customData.level2.slotA,
                      label: locInfo.customData?.level2?.slotA?.label || prev.customData.level2.slotA.label,
                      result: locInfo.customData?.level2?.slotA?.result || prev.customData.level2.slotA.result,
                      desc: locInfo.customData?.level2?.slotA?.desc || prev.customData.level2.slotA.desc,
                    },
                    slotB: {
                      ...prev.customData.level2.slotB,
                      label: locInfo.customData?.level2?.slotB?.label || prev.customData.level2.slotB.label,
                      result: locInfo.customData?.level2?.slotB?.result || prev.customData.level2.slotB.result,
                      desc: locInfo.customData?.level2?.slotB?.desc || prev.customData.level2.slotB.desc,
                    },
                  },
                  level3: {
                    ...prev.customData.level3,
                    config: locInfo.customData?.level3?.config || prev.customData.level3.config,
                    oxidation: locInfo.customData?.level3?.oxidation || prev.customData.level3.oxidation,
                    ionicRadius: locInfo.customData?.level3?.ionicRadius || prev.customData.level3.ionicRadius,
                    hydrationEnthalpy: locInfo.customData?.level3?.hydrationEnthalpy || prev.customData.level3.hydrationEnthalpy,
                    coordination: locInfo.customData?.level3?.coordination || prev.customData.level3.coordination,
                  },
                  level4: {
                    ...prev.customData.level4,
                    discoveryYear: locInfo.customData?.level4?.discoveryYear || prev.customData.level4.discoveryYear,
                    discoveredBy: locInfo.customData?.level4?.discoveredBy || prev.customData.level4.discoveredBy,
                    namedBy: locInfo.customData?.level4?.namedBy || prev.customData.level4.namedBy,
                    stse: Array.isArray(locInfo.customData?.level4?.stse) 
                      ? locInfo.customData.level4.stse.join("; ") 
                      : (locInfo.customData?.level4?.stse || prev.customData.level4.stse),
                    commonUses: Array.isArray(locInfo.customData?.level4?.commonUses) 
                      ? locInfo.customData.level4.commonUses.join("; ") 
                      : (locInfo.customData?.level4?.commonUses || prev.customData.level4.commonUses),
                    hazards: Array.isArray(locInfo.customData?.level4?.hazards) 
                      ? locInfo.customData.level4.hazards.join("; ") 
                      : (locInfo.customData?.level4?.hazards || prev.customData.level4.hazards),
                  },
                },
              };
            });
          }
        }
      } catch (err) {
        console.error("Failed to load localized ion details:", err);
      }
    };
    loadLocalizedData();
  }, [locale, ion]);

  useEffect(() => {
    if (isOpen && hasHydrated && isCardIndexLocked) {
      setActiveLevel(defaultCardIndex);
    } else {
      setActiveLevel(0);
    }
  }, [isOpen, ion, isCardIndexLocked, defaultCardIndex, hasHydrated]);

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

  const parsedSymbol = formatChem(ion.symbol);
  const parsedCharge = formatChem(ion.charge);

  const levels = [
    { num: 1, label: t("nav.standard") },
    { num: 2, label: t("elementL2.atomicParticles") },
    { num: 3, label: t("nav.advanced") },
    { num: 4, label: t("elementL4.history") },
  ];

  // Dynamic color matching based on ion charge block category
  const isCation = ion.type === "Cation";
  const accentBorderColor = isCation ? "border-yellow-500/50" : "border-teal-500/50";
  const accentBgColor = isCation ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" : "bg-teal-500/10 text-teal-300 border-teal-500/20";
  const particleColor = isCation ? "text-yellow-400" : "text-teal-400";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        showCloseButton={false}
        className={cn(
          // Mobile responsive: anchored bottom-to-top drawer
          "max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:translate-x-0 max-md:translate-y-0",
          "max-md:max-w-full max-md:w-full max-md:h-[95vh] max-md:rounded-t-3xl max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0",
          
          // Desktop centered modal
          "md:max-w-[1360px] md:h-[800px] md:rounded-3xl",
          
          // Shared styles
          "p-0 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800/80 backdrop-blur-xl shadow-2xl overflow-hidden gap-0 select-none flex flex-col text-zinc-900 dark:text-white",
          
          // Animations: slide up on mobile, zoom on desktop
          "duration-350 ease-out",
          "data-open:animate-in data-open:fade-in-0 max-md:data-open:slide-in-from-bottom-full md:data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 max-md:data-closed:slide-out-to-bottom-full md:data-closed:zoom-out-95"
        )}
      >
        {/* Mobile Header with Drag Handle & Title */}
        {isMobile && (
          <div className="w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 relative flex-shrink-0">
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-2.5">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700/80" />
            </div>
            
            {/* Title & Close Row */}
            <div className="w-full flex items-center justify-between px-4 pb-3.5 pt-0.5 gap-2">
              {/* Left: Ion symbol and name */}
              <div className="flex items-center gap-2 leading-none min-w-0">
                <span className="text-2xl font-black text-zinc-900 dark:text-white leading-none flex items-start">
                  <span dangerouslySetInnerHTML={{ __html: parsedSymbol }} />
                  <sup className={`text-sm font-bold font-mono ${particleColor} ml-0.5`} dangerouslySetInnerHTML={{ __html: parsedCharge }} />
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate max-w-[120px]">
                  {localizedIon.name}
                </span>
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
        <div className="flex flex-col md:flex-row h-full w-full min-w-0">
          
          {/* Left Details Pane: Card Details Slider (35% width) */}
          <div className="w-full md:w-[35%] min-w-0 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/40 md:border-r border-zinc-200 dark:border-zinc-800/60 border-b-0 h-full flex-1">
            
            {/* Header info - Symbol & Name (Desktop only) */}
            <div>
              {!isMobile && (
                <div className="flex items-center gap-3 mb-6 select-none pl-1">
                  <h2 className="text-5xl font-black text-zinc-950 dark:text-white tracking-tighter leading-none flex items-start">
                    <span dangerouslySetInnerHTML={{ __html: parsedSymbol }} />
                    <sup className={`text-2xl font-bold font-mono ${particleColor} ml-0.5`} dangerouslySetInnerHTML={{ __html: parsedCharge }} />
                  </h2>
                  <span className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-200 tracking-tight ml-2">
                    {localizedIon.name}
                  </span>
                </div>
              )}
 
              {/* Slider content frame */}
              <div className="relative overflow-hidden min-h-[350px] py-1">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    transform: `translate3d(calc(-${activeLevel * 100}% - ${activeLevel * 24}px), 0, 0)`,
                    gap: "24px",
                  }}
                >
                  {/* Card 1: Level 1 Basic Cation/Anion info */}
                  <div
                    className="w-full flex-shrink-0 flex flex-col justify-between bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md overflow-y-auto transition-all duration-500 shadow-sm dark:shadow-none"
                    style={{
                      transform: `perspective(1000px) rotateY(${(activeLevel - 0) * -15}deg) scale(${
                        1 - Math.abs(activeLevel - 0) * 0.05
                      })`,
                      opacity: activeLevel === 0 ? 1 : 0.4,
                    }}
                  >
                    <div>
                      <h3 className="text-sm font-semibold uppercase text-zinc-550 dark:text-zinc-400 tracking-widest mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        {t("ionModal.essentialDetails")}
                      </h3>
                      
                      {/* Properties List Rows */}
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.source")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-sm capitalize text-right">
                            {localizedIon.customData.level1.source}
                          </span>
                        </div>
 
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.valenceCharge")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-sm text-right">
                            {localizedIon.customData.level1.valence}
                          </span>
                        </div>
 
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.phaseInWater")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-sm capitalize text-right">
                            {localizedIon.customData.level1.phase}
                          </span>
                        </div>
 
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.stateInWater")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-sm text-right">
                            {t("ionModal.soluble")}
                          </span>
                        </div>
                      </div>
                    </div>
 
                    {/* Key Compounds Sub-card */}
                    <div className="mt-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 p-4 rounded-xl">
                      <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest block text-center mb-2">
                        {t("ionModal.keyCompounds")}
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300 font-medium text-xs leading-relaxed text-center">
                        {localizedIon.customData.level1.keyCompounds}
                      </p>
                    </div>
                  </div>
 
                  {/* Card 2: Level 2 Subatomic details */}
                  <div
                    className="w-full flex-shrink-0 flex flex-col justify-between bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md overflow-y-auto transition-all duration-500 shadow-sm dark:shadow-none"
                    style={{
                      transform: `perspective(1000px) rotateY(${(activeLevel - 1) * -15}deg) scale(${
                        1 - Math.abs(activeLevel - 1) * 0.05
                      })`,
                      opacity: activeLevel === 1 ? 1 : 0.4,
                    }}
                  >
                    <div>
                      <h3 className="text-sm font-semibold uppercase text-zinc-550 dark:text-zinc-400 tracking-widest mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        {t("ionModal.massStructure")}
                      </h3>
 
                      {/* Properties List Rows */}
                      <div className="space-y-3.5 mb-5">
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.molarMass")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-sm font-mono text-right">
                            {localizedIon.customData.level2.molarMass}
                          </span>
                        </div>
 
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.subatomicDelta")}
                          </span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium text-xs text-right leading-relaxed">
                            {localizedIon.customData.level2.subatomic}
                          </span>
                        </div>
                      </div>
                    </div>
 
                    {/* Subatomic Slots Details Sub-card */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 p-4 rounded-xl mt-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`border-l-2 ${accentBorderColor} pl-2.5 flex flex-col`}>
                          <span className="text-zinc-550 dark:text-zinc-500 font-bold uppercase text-[9px] tracking-wider block mb-0.5">
                            {localizedIon.customData.level2.slotA.label}
                          </span>
                          <div
                            className="w-20 h-20 flex items-center justify-center bg-zinc-200/50 dark:bg-zinc-950/40 border border-zinc-300 dark:border-zinc-800/60 rounded-xl overflow-hidden self-center my-2 shrink-0 select-none"
                            style={{ "--ion-anim-play-state": playState } as React.CSSProperties}
                            dangerouslySetInnerHTML={{
                              __html: IonAnimations.getAnimation(ion.id, "slotA"),
                            }}
                          />
                          <span className="text-zinc-900 dark:text-white font-bold text-xs block mb-0.5">
                            {localizedIon.customData.level2.slotA.result}
                          </span>
                          <p className="text-[9px] text-zinc-500 leading-tight">
                            {localizedIon.customData.level2.slotA.desc}
                          </p>
                        </div>
 
                        <div className={`border-l-2 ${accentBorderColor} pl-2.5 flex flex-col`}>
                          <span className="text-zinc-550 dark:text-zinc-500 font-bold uppercase text-[9px] tracking-wider block mb-0.5">
                            {localizedIon.customData.level2.slotB.label}
                          </span>
                          <div
                            className="w-20 h-20 flex items-center justify-center bg-zinc-200/50 dark:bg-zinc-950/40 border border-zinc-300 dark:border-zinc-800/60 rounded-xl overflow-hidden self-center my-2 shrink-0 select-none"
                            style={{ "--ion-anim-play-state": playState } as React.CSSProperties}
                            dangerouslySetInnerHTML={{
                              __html: IonAnimations.getAnimation(ion.id, "slotB"),
                            }}
                          />
                          <span className="text-zinc-900 dark:text-white font-bold text-xs block mb-0.5">
                            {localizedIon.customData.level2.slotB.result}
                          </span>
                          <p className="text-[9px] text-zinc-500 leading-tight">
                            {localizedIon.customData.level2.slotB.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
 
                  {/* Card 3: Level 3 Advanced Properties */}
                  <div
                    className="w-full flex-shrink-0 flex flex-col justify-between bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md overflow-y-auto transition-all duration-500 shadow-sm dark:shadow-none"
                    style={{
                      transform: `perspective(1000px) rotateY(${(activeLevel - 2) * -15}deg) scale(${
                        1 - Math.abs(activeLevel - 2) * 0.05
                      })`,
                      opacity: activeLevel === 2 ? 1 : 0.4,
                    }}
                  >
                    <div>
                      <h3 className="text-sm font-semibold uppercase text-zinc-550 dark:text-zinc-400 tracking-widest mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        {t("ionModal.physicalChemistry")}
                      </h3>
 
                      {/* Properties List Rows */}
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.ionicRadius")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-sm font-mono text-right">
                            {formatRadius(localizedIon.customData.level3.ionicRadius, radiusUnit)}
                          </span>
                        </div>
 
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.hydrationEnthalpy")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-sm font-mono text-right">
                            {formatEnergy(localizedIon.customData.level3.hydrationEnthalpy, energyUnit)}
                          </span>
                        </div>
 
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.configuration")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-xs font-mono text-right select-all">
                            {localizedIon.customData.level3.config}
                          </span>
                        </div>
                      </div>
                    </div>
 
                    {/* Reactivity notes container */}
                    <div className="mt-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 p-4 rounded-xl">
                      <span className="text-zinc-550 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-widest block text-center mb-2">
                        {t("ionModal.reactivityOxidation")}
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300 font-medium text-xs leading-relaxed text-center">
                        {localizedIon.customData.level3.oxidation}
                      </p>
                    </div>
                  </div>
 
                  {/* Card 4: Level 4 History & STSE context */}
                  <div
                    className="w-full flex-shrink-0 flex flex-col justify-between bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md overflow-y-auto transition-all duration-500 shadow-sm dark:shadow-none"
                    style={{
                      transform: `perspective(1000px) rotateY(${(activeLevel - 3) * -15}deg) scale(${
                        1 - Math.abs(activeLevel - 3) * 0.05
                      })`,
                      opacity: activeLevel === 3 ? 1 : 0.4,
                    }}
                  >
                    <div>
                      <h3 className="text-sm font-semibold uppercase text-zinc-550 dark:text-zinc-400 tracking-widest mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        {t("ionModal.stseEnv")}
                      </h3>
 
                      {/* Properties List Rows */}
                      <div className="space-y-3.5 mb-5">
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.discoveryYear")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-sm font-mono text-right">
                            {localizedIon.customData.level4.discoveryYear}
                          </span>
                        </div>
 
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-200/60 dark:border-zinc-900/60 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
                            {t("ionModal.discoveredBy")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold text-sm text-right">
                            {localizedIon.customData.level4.discoveredBy}
                          </span>
                        </div>
                      </div>
                    </div>
 
                    {/* STSE Context Banners Stack */}
                    <div className="space-y-3 mt-1">
                      {localizedIon.customData.level4.stse && (
                        <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 border-l-2 border-l-emerald-500 p-3 rounded-r-xl">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[8px] tracking-widest block mb-1">
                            {t("ionModal.stseContext")}
                          </span>
                          <p className="text-zinc-700 dark:text-zinc-300 font-medium text-xs leading-relaxed">
                            {localizedIon.customData.level4.stse}
                          </p>
                        </div>
                      )}
 
                      {localizedIon.customData.level4.commonUses && (
                        <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 border-l-2 border-l-zinc-400 dark:border-l-zinc-500 p-3 rounded-r-xl">
                          <span className="text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[8px] tracking-widest block mb-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                            {t("elementL4.commonUses")}
                          </span>
                          <p className="text-zinc-700 dark:text-zinc-300 font-medium text-xs leading-relaxed">
                            {localizedIon.customData.level4.commonUses}
                          </p>
                        </div>
                      )}
 
                      {localizedIon.customData.level4.hazards && (
                        <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 border-l-2 border-l-rose-500 p-3 rounded-r-xl">
                          <span className="text-rose-600 dark:text-rose-400 font-bold uppercase text-[8px] tracking-widest block mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                            {t("elementL4.hazards")}
                          </span>
                          <p className="text-zinc-700 dark:text-zinc-300 font-medium text-xs leading-relaxed">
                            {localizedIon.customData.level4.hazards}
                          </p>
                        </div>
                      )}
                    </div>
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
                  onClick={() => setActiveLevel(Math.max(activeLevel - 1, 0))}
                  disabled={activeLevel === 0}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    activeLevel === 0
                      ? "border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-950/20 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 cursor-pointer"
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
                        onClick={() => setActiveLevel(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          isActive
                            ? "bg-zinc-900 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-125"
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
                  onClick={() => setActiveLevel(Math.min(activeLevel + 1, 3))}
                  disabled={activeLevel === 3}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    activeLevel === 3
                      ? "border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-950/20 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 cursor-pointer"
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
                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                    : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700"
                }`}
              >
                {isCurrentLevelLocked ? (
                  <>
                    <Lock className="w-3 h-3 text-yellow-400 animate-pulse" />
                    <span>{t("common.locked")}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 text-zinc-500" />
                    <span>{t("common.lockView")}</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Visual Pane: 3D visual & Coming Soon message (65% width) - Desktop only */}
          {!isMobile && (
            <div className="relative w-full md:w-[65%] min-w-0 overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/10 p-6 flex flex-col items-center justify-between min-h-[350px] md:min-h-[500px]">
              
              {/* Custom Close Button overlay placed on visual pane top-right (Desktop only) */}
              {!isMobile && (
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 z-20 w-8 h-8 rounded-full bg-zinc-100/80 dark:bg-zinc-950/60 backdrop-blur-md border border-zinc-250 dark:border-zinc-800/80 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-905 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer active:scale-95"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Glowing Atomic particle visual placeholder */}
              <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                <div className={`w-24 h-24 rounded-full ${isCation ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-teal-500/10 border-teal-500/20'} absolute animate-ping duration-1000`} />
                <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 shadow-inner flex items-center justify-center relative z-10">
                  <span className={`text-2xl font-black font-mono ${particleColor}`}>
                    {ion.charge}
                  </span>
                </div>
                <span className={`text-[10px] font-bold mt-6 tracking-widest px-3 py-1 rounded-full uppercase ${isCation ? 'bg-yellow-400/15 border-yellow-400/25 text-yellow-400' : 'bg-teal-400/15 border-teal-400/25 text-teal-400'} mb-2`}>
                  {t("ionModal.comingSoonBadge")}
                </span>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 font-medium text-center max-w-xs px-4">
                  {t("ionModal.visualHint")}
                </p>
              </div>

              <div className="w-full text-center z-10 hidden md:block">
                <span className="text-[9px] text-zinc-500 dark:text-zinc-500 font-bold tracking-tight">
                  {t("ionModal.activeDevelopment")}
                </span>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
