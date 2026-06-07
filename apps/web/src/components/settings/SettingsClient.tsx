"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePreferencesStore } from "../../stores/preferences";
import { 
  Settings, 
  Sparkles, 
  Trash2, 
  Send, 
  Eye,
  Sliders,
  Globe,
  User
} from "lucide-react";

export default function SettingsClient() {
  const t = useTranslations("settings");
  
  // Hydration protection
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Preferences from Zustand store
  const {
    reduceMotion,
    animationPaused,
    animationSpeed,
    tempUnit,
    densityUnit,
    energyUnit,
    radiusUnit,
    heatUnit,
    setReduceMotion,
    setAnimationPaused,
    setAnimationSpeed,
    setTempUnit,
    setDensityUnit,
    setEnergyUnit,
    setRadiusUnit,
    setHeatUnit,
    resetAll
  } = usePreferencesStore();

  if (!mounted) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 text-center text-zinc-500 font-medium">
        Loading preferences...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900/80 text-zinc-655 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Settings className="w-6 h-6 animate-spin duration-[10s]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {t("preferences")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Customize 3D models, units of measurement, UI motion, and send feedback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Visuals & Motion */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Appearance & Motion Section */}
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2">
              <Eye className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              {t("appearance")} & UI Performance
            </h3>

            {/* Reduce Motion */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <label htmlFor="motion-toggle" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {t("reduceMotion")}
                </label>
                <p className="text-xs text-zinc-500">
                  {t("motionHint")}
                </p>
              </div>
              <button
                id="motion-toggle"
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  reduceMotion ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    reduceMotion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 3D Animation Playback */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/50 pt-4 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 block">
                  {t("playback")}
                </span>
                <p className="text-xs text-zinc-500">
                  Pause or play 3D atomic orbits by default
                </p>
              </div>
              <button
                onClick={() => setAnimationPaused(!animationPaused)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !animationPaused ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    !animationPaused ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Speed Slider */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/50 pt-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                  {t("speed")}
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{animationSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Unit Prefs Section */}
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2">
              <Sliders className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              {t("globalUnits")}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Temperature */}
              <div className="space-y-1.5">
                <label htmlFor="temp-unit" className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                  {t("temperature")}
                </label>
                <select
                  id="temp-unit"
                  value={tempUnit}
                  onChange={(e) => setTempUnit(e.target.value as any)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 font-mono"
                >
                  <option value="C">°C (Celsius)</option>
                  <option value="F">°F (Fahrenheit)</option>
                  <option value="K">K (Kelvin)</option>
                </select>
              </div>

              {/* Density */}
              <div className="space-y-1.5">
                <label htmlFor="density-unit" className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                  {t("density")}
                </label>
                <select
                  id="density-unit"
                  value={densityUnit}
                  onChange={(e) => setDensityUnit(e.target.value as any)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 font-mono"
                >
                  <option value="g/cm3">g/cm³</option>
                  <option value="kg/m3">kg/m³</option>
                  <option value="lb/ft3">lb/ft³</option>
                </select>
              </div>

              {/* Energy */}
              <div className="space-y-1.5">
                <label htmlFor="energy-unit" className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                  {t("energy")}
                </label>
                <select
                  id="energy-unit"
                  value={energyUnit}
                  onChange={(e) => setEnergyUnit(e.target.value as any)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 font-mono"
                >
                  <option value="kJ/mol">kJ/mol</option>
                  <option value="eV">eV (Electron volts)</option>
                </select>
              </div>

              {/* Radius */}
              <div className="space-y-1.5">
                <label htmlFor="radius-unit" className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                  Radius
                </label>
                <select
                  id="radius-unit"
                  value={radiusUnit}
                  onChange={(e) => setRadiusUnit(e.target.value as any)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 font-mono"
                >
                  <option value="pm">pm (Picometers)</option>
                  <option value="A">Å (Angstroms)</option>
                  <option value="nm">nm (Nanometers)</option>
                </select>
              </div>

              {/* Heat */}
              <div className="space-y-1.5">
                <label htmlFor="heat-unit" className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                  Specific Heat
                </label>
                <select
                  id="heat-unit"
                  value={heatUnit}
                  onChange={(e) => setHeatUnit(e.target.value as any)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 font-mono"
                >
                  <option value="J/gC">J / (g·°C)</option>
                  <option value="J/kgK">J / (kg·K)</option>
                  <option value="cal/gC">cal / (g·°C)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Socials, Reset */}
        <div className="space-y-6">
          {/* About/Community */}
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-850 pb-2">
              Community Links
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://thith.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-205 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 px-3 py-2.5 rounded-xl text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all flex flex-col items-center gap-1.5 justify-center"
              >
                <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span>{t("who")}</span>
              </a>

              <a
                href="https://t.me/kimilab_official"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-205 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 px-3 py-2.5 rounded-xl text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all flex flex-col items-center gap-1.5 justify-center"
              >
                <Send className="w-5 h-5 text-sky-500" />
                <span>{t("telegram")}</span>
              </a>
            </div>
          </div>

          {/* Reset Box */}
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
              {t("clearData")}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-500 leading-normal">
              {t("clearHint")}
            </p>
            <button
              onClick={() => {
                resetAll();
                alert("All preferences reset to default values!");
              }}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold py-2 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              {t("clearButton")}
            </button>
        </div>
        </div>
      </div>
    </div>
  );
}
