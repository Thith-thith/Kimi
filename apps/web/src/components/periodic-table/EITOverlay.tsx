"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Settings, RefreshCw, Layers, Sliders, ChevronDown } from "lucide-react";
import { parseNumericMetric } from "./eitUtils";

interface EITOverlayProps {
  eitProperty: string;
  onChangeProperty: (prop: string) => void;
  eitMode: "color" | "filter";
  onChangeMode: (mode: "color" | "filter") => void;
  eitRange: { min: number; max: number } | null;
  eitBounds: { min: number; max: number } | null;
  onChangeRange: (min: number, max: number) => void;
  unitIndex: number;
  onCycleUnit: (prop: string) => void;
  isGridItem?: boolean;
}

export const EIT_PROPERTY_CONFIG = [
  { key: "category", label: "Category", type: "category", group: "classification" },
  { key: "block", label: "Block", type: "category", group: "classification" },
  { key: "metalType", label: "Metal Type", type: "category", group: "classification" },
  { key: "state", label: "State", type: "category", group: "classification" },
  {
    key: "meltingPoint",
    label: "Melting Point",
    type: "numeric",
    group: "property",
    unit: "°C",
    digits: 0,
    units: [
      { unit: "°C", digits: 0, convert: (v: number) => v },
      { unit: "°F", digits: 0, convert: (v: number) => (v * 9) / 5 + 32 },
      { unit: "K", digits: 0, convert: (v: number) => v + 273.15 },
    ],
  },
  {
    key: "density",
    label: "Density",
    type: "numeric",
    group: "property",
    unit: "g/cm³",
    digits: 2,
    units: [
      { unit: "g/cm³", digits: 2, convert: (v: number) => v },
      { unit: "kg/m³", digits: 0, convert: (v: number) => v * 1000 },
      { unit: "lb/ft³", digits: 2, convert: (v: number) => v * 62.42796 },
    ],
  },
  {
    key: "boilingPoint",
    label: "Boiling Point",
    type: "numeric",
    group: "property",
    unit: "°C",
    digits: 0,
    units: [
      { unit: "°C", digits: 0, convert: (v: number) => v },
      { unit: "°F", digits: 0, convert: (v: number) => (v * 9) / 5 + 32 },
      { unit: "K", digits: 0, convert: (v: number) => v + 273.15 },
    ],
  },
  {
    key: "electronegativity",
    label: "Electronegativity",
    type: "numeric",
    group: "property",
    unit: "",
    digits: 2,
  },
  {
    key: "firstIonization",
    label: "1st Ionization",
    type: "numeric",
    group: "property",
    unit: "kJ/mol",
    digits: 0,
    units: [
      { unit: "kJ/mol", digits: 0, convert: (v: number) => v },
      { unit: "eV", digits: 2, convert: (v: number) => v / 96.485 },
    ],
  },
  {
    key: "electronAffinity",
    label: "Electron Affinity",
    type: "numeric",
    group: "property",
    unit: "kJ/mol",
    digits: 0,
    units: [
      { unit: "kJ/mol", digits: 0, convert: (v: number) => v },
      { unit: "eV", digits: 2, convert: (v: number) => v / 96.485 },
    ],
  },
  {
    key: "atomicRadius",
    label: "Atomic Radius",
    type: "numeric",
    group: "property",
    unit: "pm",
    digits: 0,
    units: [
      { unit: "pm", digits: 0, convert: (v: number) => v },
      { unit: "Å", digits: 2, convert: (v: number) => v / 100 },
      { unit: "nm", digits: 3, convert: (v: number) => v / 1000 },
    ],
  },
  {
    key: "specificHeat",
    label: "Specific Heat",
    type: "numeric",
    group: "property",
    unit: "J/(g·°C)",
    digits: 3,
    units: [
      { unit: "J/(g·°C)", digits: 3, convert: (v: number) => v },
      { unit: "J/(kg·K)", digits: 0, convert: (v: number) => v * 1000 },
      { unit: "cal/(g·°C)", digits: 3, convert: (v: number) => v / 4.184 },
    ],
  },
];

export default function EITOverlay({
  eitProperty,
  onChangeProperty,
  eitMode,
  onChangeMode,
  eitRange,
  eitBounds,
  onChangeRange,
  unitIndex,
  onCycleUnit,
  isGridItem = true,
}: EITOverlayProps) {
  const t = useTranslations("eit");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeConfig = EIT_PROPERTY_CONFIG.find((cfg) => cfg.key === eitProperty)!;
  const isNumeric = activeConfig.type === "numeric";

  // Get active unit symbol for current active property
  const activeUnitConfig =
    activeConfig.units && activeConfig.units[unitIndex]
      ? activeConfig.units[unitIndex]
      : { unit: activeConfig.unit || "", digits: activeConfig.digits ?? 2 };

  const activeUnitLabel = activeUnitConfig.unit;
  const activeDigits = activeUnitConfig.digits;

  // Format value to target unit
  const formatVal = (val: number, withUnit = false) => {
    if (activeConfig.units && activeConfig.units[unitIndex]) {
      const converted = activeConfig.units[unitIndex].convert(val);
      const formatted = converted.toFixed(activeDigits);
      return withUnit && activeUnitLabel ? `${formatted} ${activeUnitLabel}` : formatted;
    }
    const formatted = val.toFixed(activeConfig.digits ?? 2);
    return withUnit && activeConfig.unit ? `${formatted} ${activeConfig.unit}` : formatted;
  };

  const handlePropertySelect = (key: string) => {
    if (eitProperty === key) {
      // Cycle unit if clicking the active one
      onCycleUnit(key);
    } else {
      onChangeProperty(key);
    }
    setDropdownOpen(false);
  };

  const handleMinSliderChange = (val: number) => {
    if (eitRange && eitBounds) {
      const newMin = Math.min(val, eitRange.max);
      onChangeRange(newMin, eitRange.max);
    }
  };

  const handleMaxSliderChange = (val: number) => {
    if (eitRange && eitBounds) {
      const newMax = Math.max(val, eitRange.min);
      onChangeRange(eitRange.min, newMax);
    }
  };

  const handleReset = () => {
    if (eitBounds) {
      onChangeRange(eitBounds.min, eitBounds.max);
    }
  };

  // Compute fill track percentages
  const leftPct =
    eitRange && eitBounds && eitBounds.max > eitBounds.min
      ? ((eitRange.min - eitBounds.min) / (eitBounds.max - eitBounds.min)) * 100
      : 0;

  const widthPct =
    eitRange && eitBounds && eitBounds.max > eitBounds.min
      ? ((eitRange.max - eitRange.min) / (eitBounds.max - eitBounds.min)) * 100
      : 100;

  return (
    <div
      style={isGridItem ? {
        gridColumn: "2 / 18",
        gridRow: "1",
      } : undefined}
      className={`flex items-center gap-3 w-full self-center h-12 relative z-40 bg-white/85 dark:bg-zinc-950/45 p-1 px-3 border border-zinc-200 dark:border-zinc-900 rounded-full backdrop-blur-md shadow-md ${isGridItem ? "hidden lg:flex" : ""}`}
    >
      {/* Property Selector Trigger */}
      <div ref={dropdownRef} className="relative flex-shrink-0">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 h-8 px-3.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:text-zinc-950 hover:dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95 shadow-sm dark:shadow-md"
          aria-expanded={dropdownOpen}
          aria-label={t("ariaController")}
        >
          <Layers className="w-3.5 h-3.5 text-zinc-500" />
          <span>
            {t(`property.${eitProperty}`)}
            {isNumeric && activeUnitLabel ? ` (${activeUnitLabel})` : ""}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Custom Dropdown Panel */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-3 z-50 flex gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Classification Group */}
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase px-2 mb-1.5">
                {t("group.classification")}
              </span>
              {EIT_PROPERTY_CONFIG.filter((cfg) => cfg.group === "classification").map((cfg) => (
                <button
                  key={cfg.key}
                  onClick={() => handlePropertySelect(cfg.key)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    eitProperty === cfg.key
                      ? "bg-zinc-100 dark:bg-white/10 text-zinc-950 dark:text-yellow-400 font-bold"
                      : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5"
                  }`}
                >
                  {t(`property.${cfg.key}`)}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-[1px] bg-zinc-200 dark:bg-zinc-800/80 self-stretch" />

            {/* Numeric Properties Group */}
            <div className="flex-1 flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
              <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase px-2 mb-1.5">
                {t("group.property")}
              </span>
              {EIT_PROPERTY_CONFIG.filter((cfg) => cfg.group === "property").map((cfg) => {
                const isActive = eitProperty === cfg.key;
                return (
                  <button
                    key={cfg.key}
                    onClick={() => handlePropertySelect(cfg.key)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-zinc-100 dark:bg-white/10 text-zinc-950 dark:text-yellow-400 font-bold"
                        : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{t(`property.${cfg.key}`)}</span>
                    {cfg.units && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isActive ? "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400" : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500"}`}>
                        {isActive
                          ? cfg.units[unitIndex]?.unit || cfg.unit
                          : cfg.unit}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slider Section for Numeric Properties */}
      {isNumeric && eitRange && eitBounds && (
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {/* Min value tooltip */}
          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-lg tabular-nums shadow-sm">
            {formatVal(eitRange.min)}
          </span>

          {/* Dual Range Input Slider */}
          <div className="relative flex-1 h-6 flex items-center group">
            {/* Underlay Track */}
            <div className="absolute inset-x-0 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />

            {/* Colored Fill */}
            <div
              className="absolute h-1.5 bg-gradient-to-r from-blue-400 via-emerald-400 via-yellow-400 to-red-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.2)]"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
              }}
            />

            {/* Left/Min Thumb Range Input */}
            <input
              type="range"
              min={eitBounds.min}
              max={eitBounds.max}
              step={(eitBounds.max - eitBounds.min) / 200}
              value={eitRange.min}
              onChange={(e) => handleMinSliderChange(parseFloat(e.target.value))}
              className="absolute inset-x-0 w-full h-full appearance-none bg-transparent pointer-events-none z-10 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-200 [&::-webkit-slider-thumb]:dark:border-zinc-900 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:active:scale-125 [&::-webkit-slider-thumb]:transition-transform"
            />

            {/* Right/Max Thumb Range Input */}
            <input
              type="range"
              min={eitBounds.min}
              max={eitBounds.max}
              step={(eitBounds.max - eitBounds.min) / 200}
              value={eitRange.max}
              onChange={(e) => handleMaxSliderChange(parseFloat(e.target.value))}
              className="absolute inset-x-0 w-full h-full appearance-none bg-transparent pointer-events-none z-10 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-200 [&::-webkit-slider-thumb]:dark:border-zinc-900 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:active:scale-125 [&::-webkit-slider-thumb]:transition-transform"
            />
          </div>

          {/* Max value tooltip */}
          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-lg tabular-nums shadow-sm">
            {formatVal(eitRange.max)}
          </span>

          {/* Mode Switcher Group */}
          <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-full flex-shrink-0">
            <button
              onClick={() => onChangeMode("color")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                eitMode === "color"
                  ? "bg-zinc-200/60 dark:bg-white/10 text-zinc-900 dark:text-white"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
              aria-pressed={eitMode === "color"}
            >
              <Layers className="w-3 h-3" />
              <span>{t("color")}</span>
            </button>
            <button
              onClick={() => onChangeMode("filter")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                eitMode === "filter"
                  ? "bg-zinc-200/60 dark:bg-white/10 text-zinc-900 dark:text-white"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
              aria-pressed={eitMode === "filter"}
            >
              <Sliders className="w-3 h-3" />
              <span>{t("filter")}</span>
            </button>
          </div>

          {/* Reset Action */}
          <button
            onClick={handleReset}
            className="flex items-center justify-center p-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer flex-shrink-0 shadow-sm"
            title={t("reset")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Informative description chips or labels for Discrete properties */}
      {!isNumeric && eitProperty !== "category" && (
        <span className="text-[10px] text-zinc-500 font-semibold tracking-tight truncate flex-1 pl-2">
          {t("categoryDiscrete")}
        </span>
      )}
    </div>
  );
}
