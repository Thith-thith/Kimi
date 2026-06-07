"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { GridElement } from "@kimi/data";

interface ElementCellProps {
  element: GridElement;
  eitProperty: string;
  eitMode: "color" | "filter";
  eitValue: number | null;
  eitValueFormatted: string;
  inRange: boolean;
  hasData: boolean;
  cellColor: string | null; // HSL color if EIT is active
  dimmed: boolean;
  focused: boolean;
  highlighted: boolean;
  isAnyHighlighted: boolean;
  onHover: (num: number | string | null) => void;
  onClick: () => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; hoverBg: string }> = {
  "alkali metal": {
    bg: "bg-red-100 dark:bg-red-500/15",
    text: "text-red-900 dark:text-red-300",
    border: "border-red-200 dark:border-red-500/25",
    hoverBg: "hover:bg-red-200 dark:hover:bg-red-500/25",
  },
  "alkaline earth metal": {
    bg: "bg-orange-100 dark:bg-orange-500/15",
    text: "text-orange-900 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-500/25",
    hoverBg: "hover:bg-orange-200 dark:hover:bg-orange-500/25",
  },
  "transition metal": {
    bg: "bg-yellow-100/80 dark:bg-yellow-500/15",
    text: "text-yellow-950 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-500/25",
    hoverBg: "hover:bg-yellow-200 dark:hover:bg-yellow-500/25",
  },
  "post-transition metal": {
    bg: "bg-blue-100 dark:bg-blue-500/15",
    text: "text-blue-900 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-500/25",
    hoverBg: "hover:bg-blue-200 dark:hover:bg-blue-500/25",
  },
  "metalloid": {
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-900 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-500/25",
    hoverBg: "hover:bg-emerald-200 dark:hover:bg-emerald-500/25",
  },
  "other nonmetal": {
    bg: "bg-green-100 dark:bg-green-500/15",
    text: "text-green-900 dark:text-green-300",
    border: "border-green-200 dark:border-green-500/25",
    hoverBg: "hover:bg-green-200 dark:hover:bg-green-500/25",
  },
  "nonmetal": {
    bg: "bg-green-100 dark:bg-green-500/15",
    text: "text-green-900 dark:text-green-300",
    border: "border-green-200 dark:border-green-500/25",
    hoverBg: "hover:bg-green-200 dark:hover:bg-green-500/25",
  },
  "halogen": {
    bg: "bg-teal-100 dark:bg-teal-500/15",
    text: "text-teal-900 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-500/25",
    hoverBg: "hover:bg-teal-200 dark:hover:bg-teal-500/25",
  },
  "noble gas": {
    bg: "bg-purple-100 dark:bg-purple-500/15",
    text: "text-purple-900 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-500/25",
    hoverBg: "hover:bg-purple-200 dark:hover:bg-purple-500/25",
  },
  "lanthanide": {
    bg: "bg-pink-100 dark:bg-pink-500/15",
    text: "text-pink-900 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-500/25",
    hoverBg: "hover:bg-pink-200 dark:hover:bg-pink-500/25",
  },
  "actinide": {
    bg: "bg-rose-100 dark:bg-rose-500/15",
    text: "text-rose-900 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-500/25",
    hoverBg: "hover:bg-rose-200 dark:hover:bg-rose-500/25",
  },
  "unknown": {
    bg: "bg-zinc-200/60 dark:bg-zinc-800/30",
    text: "text-zinc-700 dark:text-zinc-400",
    border: "border-zinc-300 dark:border-zinc-700/30",
    hoverBg: "hover:bg-zinc-300 dark:hover:bg-zinc-700/20",
  },
};

function getCategoryStyles(category?: string) {
  if (!category) return CATEGORY_STYLES["unknown"];
  return CATEGORY_STYLES[category.toLowerCase()] || CATEGORY_STYLES["unknown"];
}

export default function ElementCell({
  element,
  eitProperty,
  eitMode,
  eitValue,
  eitValueFormatted,
  inRange,
  hasData,
  cellColor,
  dimmed,
  focused,
  highlighted,
  isAnyHighlighted,
  onHover,
  onClick,
}: ElementCellProps) {
  const locale = useLocale();
  const [localizedName, setLocalizedName] = useState(element.name);

  // Load translations for element names dynamically
  useEffect(() => {
    const loadLocalizedName = async () => {
      if (locale === "en") {
        setLocalizedName(element.name);
        return;
      }
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
          const elNum = Number(element.number);
          if (!isNaN(elNum) && localizedElements[elNum]?.name) {
            setLocalizedName(localizedElements[elNum].name);
            return;
          }
        }
        setLocalizedName(element.name);
      } catch (err) {
        setLocalizedName(element.name);
      }
    };
    loadLocalizedName();
  }, [locale, element]);

  const catStyles = getCategoryStyles(element.category);
  const isPlaceholder = typeof element.number === "string";

  // Position based on row and column in CSS Grid
  const gridStyle = {
    gridColumnStart: element.column,
    gridRowStart: element.row,
  };

  // Compute cell classes and inline styles based on EIT and highlight states
  let bgClass = catStyles.bg;
  let textClass = catStyles.text;
  let borderClass = catStyles.border;
  let inlineStyles: React.CSSProperties = {};

  const isEITActive = eitProperty !== "category";

  if (isEITActive) {
    if (!hasData) {
      // Stripped grey pattern for elements with no EIT property data
      bgClass = "bg-zinc-100 dark:bg-zinc-900/60 bg-[repeating-linear-gradient(-45deg,rgba(161,161,170,0.15)_0,rgba(161,161,170,0.15)_6px,transparent_6px,transparent_12px)] dark:bg-[repeating-linear-gradient(-45deg,rgba(82,82,91,0.15)_0,rgba(82,82,91,0.15)_6px,transparent_6px,transparent_12px)]";
      textClass = "text-zinc-500 dark:text-zinc-400";
      borderClass = "border-zinc-300 dark:border-zinc-800/80";
    } else if (cellColor) {
      inlineStyles = {
        backgroundColor: cellColor,
        color: "#18181b", // dark text for high visibility against color gradient
      };
      borderClass = "border-zinc-950/20";
    }
  }

  // Active EIT dimming states
  const isDimmed =
    dimmed ||
    (isAnyHighlighted && !highlighted) ||
    (isEITActive && eitMode === "filter" && hasData && !inRange);

  const isFocused =
    focused ||
    (isAnyHighlighted && highlighted) ||
    (isEITActive && hasData && inRange);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={() => onHover(element.number)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ ...gridStyle, ...inlineStyles }}
      className={`relative flex flex-col justify-between p-1.5 rounded-xl border aspect-square cursor-pointer transition-all duration-300 select-none group ${
        isPlaceholder
          ? "border-zinc-300/80 dark:border-zinc-800/40 bg-zinc-200/30 dark:bg-zinc-900/10 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/30 hover:scale-100 cursor-default"
          : `${bgClass} ${textClass} ${borderClass} ${catStyles.hoverBg} hover:scale-105 hover:z-20 hover:shadow-lg active:scale-95`
      } ${isDimmed ? "opacity-20 scale-95 blur-[0.5px]" : ""} ${
        isFocused ? "ring-2 ring-yellow-400 shadow-yellow-400/20 scale-[1.03] z-10" : ""
      }`}
    >
      {/* Atomic Number / Range */}
      <span className={`text-[9px] font-extrabold tracking-tight select-none leading-none opacity-60 ${isEITActive && hasData ? "text-zinc-950/80" : ""}`}>
        {element.number}
      </span>

      {/* Chemical Symbol */}
      <span
        className={`text-center font-bold tracking-tighter select-none leading-none scale-y-95 group-hover:scale-110 transition-transform duration-200 ${
          isPlaceholder
            ? "text-xs md:text-sm text-zinc-400 font-semibold"
            : "text-lg md:text-2xl"
        } ${isEITActive && hasData ? "text-zinc-950" : ""}`}
      >
        {element.symbol}
      </span>

      {/* Dynamic bottom label: shows property value if EIT active, else name */}
      <span
        className={`text-center truncate text-[8px] font-semibold tracking-tight uppercase leading-none select-none max-w-full ${
          isEITActive && hasData ? "text-zinc-950/70" : "opacity-75"
        }`}
      >
        {isEITActive && hasData ? eitValueFormatted : localizedName}
      </span>
    </div>
  );
}
