"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ions, Ion } from "@kimi/data";
import IonCard from "./IonCard";
import IonModal from "./IonModal";

const SECTIONS_ORDER = ["basic", "core", "trans", "special"];

const SECTION_I18N_MAP: Record<string, string> = {
  basic: "ionSection.basicMonatomic",
  core: "ionSection.corePolyatomic",
  trans: "ionSection.transitionMetals",
  special: "ionSection.specialOrganic",
};

const GROUP_I18N_MAP: Record<string, string> = {
  // Monatomics
  basic_cat1: "ionGroup.plus1Cations",
  basic_cat2: "ionGroup.plus2Cations",
  basic_cat3: "ionGroup.plus3Cations",
  basic_an1: "ionGroup.minus1Anions",
  basic_an2: "ionGroup.minus2Anions",
  basic_an3: "ionGroup.minus3Anions",
  // Core Polyatomics
  core_c: "ionGroup.carbonPolyatomic",
  core_n: "ionGroup.nitrogenPolyatomic",
  core_s: "ionGroup.sulfurPolyatomic",
  core_p: "ionGroup.phosphorusPolyatomic",
  core_cl: "ionGroup.chlorinePolyatomic",
  // Transition Metal Groups
  trans_cu: "ionGroup.copperTransition",
  trans_fe: "ionGroup.ironTransition",
  trans_pb: "ionGroup.leadTransition",
  trans_mn: "ionGroup.manganeseTransition",
  trans_cr: "ionGroup.chromiumTransition",
  // Special
  spec_pair: "ionGroup.commonPairs",
  spec_acid: "ionGroup.acidRelated",
  spec_org: "ionGroup.organic",
};

export default function IonsGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const [selectedIon, setSelectedIon] = useState<Ion | null>(null);
  const [localizedIons, setLocalizedIons] = useState<Record<string, any>>({});

  useEffect(() => {
    if (locale === "en") {
      setLocalizedIons({});
      return;
    }
    const loadTranslations = async () => {
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
          setLocalizedIons(module[key] || {});
        }
      } catch (err) {
        console.error("Failed to load localized ions:", err);
      }
    };
    loadTranslations();
  }, [locale]);

  // Group ions by section and then by group
  const groupedData: Record<string, Record<string, Ion[]>> = {};

  const displayIons = ions.map((ion) => {
    const loc = localizedIons[ion.id];
    if (loc && loc.name) {
      return { ...ion, name: loc.name };
    }
    return ion;
  });

  displayIons.forEach((ion) => {
    if (!groupedData[ion.section]) {
      groupedData[ion.section] = {};
    }
    if (!groupedData[ion.section][ion.group]) {
      groupedData[ion.section][ion.group] = [];
    }
    groupedData[ion.section][ion.group].push(ion);
  });

  return (
    <div className="w-full flex flex-col items-center select-none animate-in fade-in slide-in-from-top-4 duration-500 max-w-7xl mx-auto px-4 pt-4">
      {/* Structured Sections list */}
      <div className="w-full flex flex-col gap-8 md:gap-12">
        {SECTIONS_ORDER.map((sectionKey) => {
          const sectionGroups = groupedData[sectionKey];
          if (!sectionGroups) return null;

          const sectionLabel = t(SECTION_I18N_MAP[sectionKey]) || sectionKey;

          return (
            <section key={sectionKey} className="w-full">
              {/* Section Header */}
              <h2 className="text-lg md:text-xl font-extrabold text-zinc-850 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-6 tracking-wide uppercase">
                {sectionLabel}
              </h2>

              {/* Grid of groups in this section */}
              <div className="flex flex-col gap-6">
                {Object.keys(sectionGroups).map((groupKey) => {
                  const groupIons = sectionGroups[groupKey];
                  const groupLabel = t(GROUP_I18N_MAP[groupKey]) || groupKey;

                  return (
                    <div key={groupKey} className="bg-zinc-100/50 dark:bg-zinc-900/25 border border-zinc-200 dark:border-zinc-900/60 rounded-3xl p-5 md:p-6 backdrop-blur-sm">
                      {/* Group title */}
                      <h3 className="text-xs md:text-sm font-bold text-zinc-500 dark:text-zinc-400 tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800/40 pb-1.5 uppercase">
                        {groupLabel}
                      </h3>

                      {/* Ions cell list */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {groupIons.map((ion) => (
                          <IonCard
                            key={ion.id}
                            ion={ion}
                            onClick={() => setSelectedIon(ion)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Selected Ion Details Dialog Modal */}
      {selectedIon && (
        <IonModal
          ion={selectedIon}
          isOpen={true}
          onClose={() => setSelectedIon(null)}
        />
      )}
    </div>
  );
}
