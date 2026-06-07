"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePathname } from "../../i18n/routing";
import { finallyData, Element } from "@kimi/data";
import PeriodicGrid from "./PeriodicGrid";
import ElementModal from "./ElementModal";
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
      {/* Main Interactive Grid */}
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
