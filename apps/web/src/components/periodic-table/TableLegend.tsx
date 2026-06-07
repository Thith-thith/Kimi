"use client";

import { useTranslations } from "next-intl";

interface TableLegendProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  hoveredCategory: string | null;
  onHoverCategory: (category: string | null) => void;
  activeProperty: string;
}

const LEGEND_ITEMS = [
  { key: "alkali-metal", labelKey: "alkaliMetal", bg: "bg-red-100 dark:bg-red-500/20", border: "border-red-200 dark:border-red-500/30", text: "text-red-900 dark:text-red-300", dot: "bg-red-500" },
  { key: "alkaline-earth-metal", labelKey: "alkalineEarth", bg: "bg-orange-100 dark:bg-orange-500/20", border: "border-orange-200 dark:border-orange-500/30", text: "text-orange-900 dark:text-orange-300", dot: "bg-orange-500" },
  { key: "transition-metal", labelKey: "transitionMetal", bg: "bg-yellow-100/80 dark:bg-yellow-500/20", border: "border-yellow-200 dark:border-yellow-500/30", text: "text-yellow-950 dark:text-yellow-300", dot: "bg-yellow-500" },
  { key: "metalloid", labelKey: "metalloid", bg: "bg-emerald-100 dark:bg-emerald-500/20", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-900 dark:text-emerald-300", dot: "bg-emerald-500" },
  { key: "halogen", labelKey: "halogen", bg: "bg-teal-100 dark:bg-teal-500/20", border: "border-teal-200 dark:border-teal-500/30", text: "text-teal-900 dark:text-teal-300", dot: "bg-teal-500" },
  { key: "noble-gas", labelKey: "nobleGas", bg: "bg-purple-100 dark:bg-purple-500/20", border: "border-purple-200 dark:border-purple-500/30", text: "text-purple-900 dark:text-purple-300", dot: "bg-purple-500" },
  { key: "lanthanide", labelKey: "lanthanide", bg: "bg-pink-100 dark:bg-pink-500/20", border: "border-pink-200 dark:border-pink-500/30", text: "text-pink-900 dark:text-pink-300", dot: "bg-pink-500" },
  { key: "actinide", labelKey: "actinide", bg: "bg-rose-100 dark:bg-rose-500/20", border: "border-rose-200 dark:border-rose-500/30", text: "text-rose-900 dark:text-rose-300", dot: "bg-rose-500" },
  { key: "other-nonmetal", labelKey: "otherNonmetal", bg: "bg-green-100 dark:bg-green-500/20", border: "border-green-200 dark:border-green-500/30", text: "text-green-900 dark:text-green-300", dot: "bg-green-500", wide: true },
  { key: "post-transition-metal", labelKey: "postTransition", bg: "bg-blue-100 dark:bg-blue-500/20", border: "border-blue-200 dark:border-blue-500/30", text: "text-blue-900 dark:text-blue-300", dot: "bg-blue-500", wide: true },
];

const CUSTOM_LEGENDS: Record<string, { label: string; color: string; val: string }[]> = {
  block: [
    { label: "s Block", color: "bg-red-500", val: "s" },
    { label: "p Block", color: "bg-blue-500", val: "p" },
    { label: "d Block", color: "bg-yellow-500", val: "d" },
    { label: "f Block", color: "bg-green-500", val: "f" },
  ],
  metalType: [
    { label: "Metal", color: "bg-slate-400", val: "Metal" },
    { label: "Metalloid", color: "bg-amber-400", val: "Metalloid" },
    { label: "Nonmetal", color: "bg-emerald-400", val: "Nonmetal" },
  ],
  state: [
    { label: "Solid", color: "bg-slate-300", val: "Solid" },
    { label: "Liquid", color: "bg-blue-400", val: "Liquid" },
    { label: "Gas", color: "bg-red-400", val: "Gas" },
  ],
};

export default function TableLegend({
  selectedCategory,
  onSelectCategory,
  hoveredCategory,
  onHoverCategory,
  activeProperty,
}: TableLegendProps) {
  const t = useTranslations("tableLegend");

  // Determine if it is standard periodic table mode or EIT classification/property mode
  const isDefaultCategory = activeProperty === "category";

  if (activeProperty !== "category" && !CUSTOM_LEGENDS[activeProperty]) {
    // If a numeric property is active (electronegativity, radius, etc.), hide the legend
    return null;
  }

  const handleChipClick = (key: string) => {
    if (selectedCategory === key) {
      onSelectCategory(null);
    } else {
      onSelectCategory(key);
    }
  };

  const isEITCustom = !!CUSTOM_LEGENDS[activeProperty];

  return (
    <div
      style={{
        gridColumn: "3 / 13",
        gridRow: "1 / 4",
      }}
      className="flex flex-col items-center justify-center p-2 z-30 select-none pointer-events-none mt-2"
    >
      {isDefaultCategory ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 pointer-events-auto">
          {LEGEND_ITEMS.map((item) => {
            const isActive = selectedCategory === item.key;
            const isHovered = hoveredCategory === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleChipClick(item.key)}
                onMouseEnter={() => onHoverCategory(item.key)}
                onMouseLeave={() => onHoverCategory(null)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] md:text-xs font-semibold cursor-pointer backdrop-blur-md transition-all duration-200 ${
                  item.wide ? "col-span-2" : ""
                } ${
                  isActive
                    ? `${item.bg} ${item.text} ${item.border} ring-2 ring-yellow-400 scale-[1.04]`
                    : isHovered
                    ? `${item.bg} ${item.text} ${item.border} opacity-100 scale-[1.02] ring-1 ring-yellow-400/50`
                    : `${item.bg} ${item.text} ${item.border} opacity-70 hover:opacity-100 hover:scale-[1.02]`
                }`}
                aria-pressed={isActive}
              >
                <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      ) : isEITCustom ? (
        <div className="flex items-center justify-center gap-3 py-1.5 px-4 bg-white/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-full pointer-events-auto backdrop-blur-md shadow-lg">
          {CUSTOM_LEGENDS[activeProperty].map((item) => {
            const isActive = selectedCategory === item.val;
            const isHovered = hoveredCategory === item.val;
            return (
              <button
                key={item.val}
                onClick={() => handleChipClick(item.val)}
                onMouseEnter={() => onHoverCategory(item.val)}
                onMouseLeave={() => onHoverCategory(null)}
                className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-200/50 dark:bg-white/15 text-zinc-950 dark:text-white ring-2 ring-yellow-400 scale-105"
                    : isHovered
                    ? "bg-zinc-100/50 dark:bg-white/10 text-zinc-900 dark:text-white ring-1 ring-yellow-400/50 scale-102"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 hover:dark:text-zinc-200 hover:scale-102"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
