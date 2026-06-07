"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePathname } from "../../i18n/routing";
import { finallyData, Element } from "@kimi/data";
import { ChevronDown, ChevronUp } from "lucide-react";
import PeriodicGrid from "./PeriodicGrid";
import ElementModal from "./ElementModal";
import EITOverlay from "./EITOverlay";
import TableLegend from "./TableLegend";
import { parseNumericMetric } from "./eitUtils";
import { EIT_PROPERTY_CONFIG } from "./EITOverlay";

export default function PeriodicTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL-driven Element Modal Selection
  const elQuery = searchParams.get("el");
  const selectedElementNum = elQuery ? parseInt(elQuery, 10) : null;
  const selectedElement: Element | null =
    selectedElementNum && finallyData[selectedElementNum]
      ? finallyData[selectedElementNum]
      : null;

  // Visual/Grid states
  const [hoveredElement, setHoveredElement] = useState<number | string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // EIT visualization states
  const [eitProperty, setEitProperty] = useState<string>("category");
  const [eitMode, setEitMode] = useState<"color" | "filter">("color");
  const [eitBounds, setEitBounds] = useState<{ min: number; max: number } | null>(null);
  const [eitRange, setEitRange] = useState<{ min: number; max: number } | null>(null);
  const [unitIndex, setUnitIndex] = useState<number>(0);

  // Calculate and cache bounds whenever EIT property changes
  useEffect(() => {
    setSelectedCategory(null);
    setUnitIndex(0);

    const config = EIT_PROPERTY_CONFIG.find((cfg) => cfg.key === eitProperty);
    if (!config || config.type !== "numeric") {
      setEitBounds(null);
      setEitRange(null);
      return;
    }

    // Collect all numeric values for elements 1-118
    const values: number[] = [];
    for (let i = 1; i <= 118; i++) {
      const detail = finallyData[i];
      if (detail?.level3_properties?.physical) {
        const physical = detail.level3_properties.physical;
        const rawVal = physical[config.key as keyof typeof physical];
        const parsed = parseNumericMetric(rawVal, config.key);
        if (parsed) {
          values.push(parsed.value);
        }
      }
    }

    if (values.length > 0) {
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      setEitBounds({ min: minVal, max: maxVal });
      setEitRange({ min: minVal, max: maxVal });
    } else {
      setEitBounds(null);
      setEitRange(null);
    }
  }, [eitProperty]);

  const handleSelectElement = (num: number) => {
    // Open element detail modal by setting search params
    const params = new URLSearchParams(searchParams.toString());
    params.set("el", num.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCloseModal = () => {
    // Remove search param to close modal
    const params = new URLSearchParams(searchParams.toString());
    params.delete("el");
    const queryStr = params.toString();
    router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
  };

  const handleCycleUnit = (prop: string) => {
    const config = EIT_PROPERTY_CONFIG.find((cfg) => cfg.key === prop);
    if (config && config.units) {
      setUnitIndex((prev) => (prev + 1) % config.units.length);
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[600px] pt-3">
      {/* Mobile Controls & Legend Header (Visible only on mobile/tablet < lg) */}
      <div className="w-full lg:hidden bg-white/70 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl rounded-2xl p-3 mb-3 flex flex-col gap-3 shadow-md">
        {/* EIT Overlay without grid positioning */}
        <EITOverlay
          eitProperty={eitProperty}
          onChangeProperty={setEitProperty}
          eitMode={eitMode}
          onChangeMode={setEitMode}
          eitRange={eitRange}
          eitBounds={eitBounds}
          onChangeRange={(min, max) => setEitRange({ min, max })}
          unitIndex={unitIndex}
          onCycleUnit={handleCycleUnit}
          isGridItem={false}
        />

        {/* Table Legend toggle */}
        <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2 flex flex-col gap-2">
          <button
            onClick={() => setIsLegendExpanded(!isLegendExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:text-zinc-950 hover:dark:text-white transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Category Filters
            </span>
            {isLegendExpanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {isLegendExpanded && (
            <div className="w-full flex justify-center py-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <TableLegend
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                hoveredCategory={null}
                onHoverCategory={() => {}}
                activeProperty={eitProperty}
                isGridItem={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Grid (which scrolls horizontally on mobile) */}
      <div className="w-full overflow-hidden flex flex-col items-stretch">
        <PeriodicGrid
          hoveredElement={hoveredElement}
          onHoverElement={setHoveredElement}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          eitProperty={eitProperty}
          onChangeProperty={setEitProperty}
          eitMode={eitMode}
          onChangeMode={setEitMode}
          eitRange={eitRange}
          eitBounds={eitBounds}
          onChangeRange={(min, max) => setEitRange({ min, max })}
          unitIndex={unitIndex}
          onCycleUnit={handleCycleUnit}
          onSelectElement={handleSelectElement}
        />

        {/* Mobile scroll hint */}
        <p className="lg:hidden text-center text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 animate-pulse select-none">
          ← Scroll to explore →
        </p>
      </div>

      {/* Element Detail Modal */}
      {selectedElement && (
        <ElementModal
          element={selectedElement}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
