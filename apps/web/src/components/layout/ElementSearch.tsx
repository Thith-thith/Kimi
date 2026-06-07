"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "../../i18n/routing";
import { elements, GridElement } from "@kimi/data";
import { Search } from "lucide-react";
import { Input } from "../ui/input";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "alkali metal": {
    bg: "bg-red-100 dark:bg-red-500/15",
    text: "text-red-900 dark:text-red-300",
    border: "border-red-200 dark:border-red-500/25",
  },
  "alkaline earth metal": {
    bg: "bg-orange-100 dark:bg-orange-500/15",
    text: "text-orange-900 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-500/25",
  },
  "transition metal": {
    bg: "bg-yellow-100/80 dark:bg-yellow-500/15",
    text: "text-yellow-950 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-500/25",
  },
  "post-transition metal": {
    bg: "bg-blue-100 dark:bg-blue-500/15",
    text: "text-blue-900 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-500/25",
  },
  "metalloid": {
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-900 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-500/25",
  },
  "other nonmetal": {
    bg: "bg-green-100 dark:bg-green-500/15",
    text: "text-green-900 dark:text-green-300",
    border: "border-green-200 dark:border-green-500/25",
  },
  "nonmetal": {
    bg: "bg-green-100 dark:bg-green-500/15",
    text: "text-green-900 dark:text-green-300",
    border: "border-green-200 dark:border-green-500/25",
  },
  "halogen": {
    bg: "bg-teal-100 dark:bg-teal-500/15",
    text: "text-teal-900 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-500/25",
  },
  "noble gas": {
    bg: "bg-purple-100 dark:bg-purple-500/15",
    text: "text-purple-900 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-500/25",
  },
  "lanthanide": {
    bg: "bg-pink-100 dark:bg-pink-500/15",
    text: "text-pink-900 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-500/25",
  },
  "actinide": {
    bg: "bg-rose-100 dark:bg-rose-500/15",
    text: "text-rose-900 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-500/25",
  },
  "unknown": {
    bg: "bg-zinc-200/60 dark:bg-zinc-800/30",
    text: "text-zinc-700 dark:text-zinc-400",
    border: "border-zinc-300 dark:border-zinc-700/30",
  },
};

function getCategoryStyles(category?: string) {
  if (!category) return CATEGORY_STYLES["unknown"];
  return CATEGORY_STYLES[category.toLowerCase()] || CATEGORY_STYLES["unknown"];
}

interface SearchIndexEntry {
  element: GridElement;
  number: number | string;
  symbol: string;
  displayName: string;
  englishName: string;
  symbolLower: string;
  searchableTerms: string[];
  searchableTermsLower: string[];
}

export default function ElementSearch() {
  const t = useTranslations("search");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchIndexRef = useRef<SearchIndexEntry[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // We load the localized element data dynamically from locales
  // Wait, let's load translations and map element names dynamically!
  useEffect(() => {
    // Rebuild the search index when locale changes
    const importLocaleData = async () => {
      let localizedNames: Record<number, { name: string }> = {};
      try {
        if (locale !== "en") {
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
            localizedNames = module[`${locale === 'zh-Hant' ? 'zh_hant' : locale}_elements`] || {};
          }
        }
      } catch (err) {
        console.warn("Could not load localized search names for locale", locale, err);
      }

      const getLocalizedName = (el: GridElement) => {
        const num = Number(el.number);
        if (isNaN(num)) return el.name;
        return (localizedNames as any)[num]?.name || el.name;
      };

      searchIndexRef.current = elements
        .filter((el) => typeof el.number === "number")
        .map((el) => {
          const localizedName = getLocalizedName(el);
          const searchableTerms = [
            el.symbol,
            String(el.number),
            el.name,
            localizedName,
          ]
            .filter(Boolean)
            .map((term) => String(term).trim())
            .filter((term, index, arr) => arr.indexOf(term) === index);

          return {
            element: el,
            number: el.number,
            symbol: el.symbol,
            displayName: localizedName,
            englishName: el.name,
            symbolLower: el.symbol.toLowerCase(),
            searchableTerms,
            searchableTermsLower: searchableTerms.map(t => t.toLowerCase()),
          };
        });
    };

    importLocaleData();
  }, [locale]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
    const q = val.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    const scored: any[] = [];
    for (const entry of searchIndexRef.current) {
      let score = 0;
      if (entry.symbolLower === q) {
        score = 100;
      } else if (entry.symbolLower.startsWith(q)) {
        score = 80;
      } else if (String(entry.number) === q) {
        score = 90;
      } else if (String(entry.number).startsWith(q)) {
        score = 50;
      } else {
        for (const term of entry.searchableTermsLower) {
          if (term === q) {
            score = Math.max(score, 70);
          } else if (term.startsWith(q)) {
            score = Math.max(score, 60);
          } else if (term.includes(q)) {
            score = Math.max(score, 40);
          }
        }
      }

      if (score > 0) {
        scored.push({ ...entry, score });
      }
    }

    scored.sort((a, b) => b.score - a.score || Number(a.number) - Number(b.number));
    setResults(scored.slice(0, 8));
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleSelectResult = (index: number) => {
    const result = results[index];
    if (!result) return;

    // Direct url update using search params (el=[number])
    const url = pathname === "/" ? `?el=${result.number}` : `/?el=${result.number}`;
    router.push(url);

    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = activeIndex < results.length - 1 ? activeIndex + 1 : 0;
      setActiveIndex(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = activeIndex > 0 ? activeIndex - 1 : results.length - 1;
      setActiveIndex(prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        handleSelectResult(activeIndex);
      } else {
        handleSelectResult(0);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        const inputEl = wrapperRef.current?.querySelector("input");
        inputEl?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-40 sm:focus-within:w-60 lg:w-48 lg:focus-within:w-64 transition-all duration-300 ease-in-out z-50">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
        <Input
          type="text"
          value={query}
          onFocus={() => query && setIsOpen(true)}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          className="w-full pl-10 pr-10 py-1.5 h-9 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-400 text-xs backdrop-blur-md transition-all duration-200"
        />
        <div className="absolute right-3.5 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[9px] font-semibold font-mono text-zinc-400 dark:text-zinc-500 pointer-events-none shadow-sm">
          <span>/</span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-zinc-950/90 border border-zinc-250 dark:border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length === 0 ? (
            <div className="px-4 py-3.5 text-xs text-zinc-500 text-center">
              {t("noResults")}
            </div>
          ) : (
            <div className="p-1">
              {results.map((r, i) => {
                const styles = getCategoryStyles(r.element.category);
                return (
                  <button
                    key={r.number}
                    onClick={() => handleSelectResult(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all duration-150 ${
                      i === activeIndex
                        ? "bg-zinc-100 dark:bg-white/10 text-zinc-950 dark:text-white"
                        : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-bold text-xs shadow-sm border ${styles.bg} ${styles.text} ${styles.border}`}
                    >
                      <span className="text-[9px] opacity-75 font-normal -mb-0.5">
                        {r.number}
                      </span>
                      {r.symbol}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold truncate leading-tight">
                        {r.displayName}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate capitalize">
                        {r.element.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
