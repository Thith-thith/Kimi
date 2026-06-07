"use client";

import { useState } from "react";
import { finallyData, elements } from "@kimi/data";
import ElementCell from "./ElementCell";
import EITOverlay, { EIT_PROPERTY_CONFIG } from "./EITOverlay";
import TableLegend from "./TableLegend";
import {
  parseNumericMetric,
  getColorForRatio,
  getNumericRatio,
  getElectronBlock,
  getMetalType,
} from "./eitUtils";
import { useTranslations } from "next-intl";

interface PeriodicGridProps {
  hoveredElement: number | string | null;
  onHoverElement: (num: number | string | null) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  eitProperty: string;
  onChangeProperty: (prop: string) => void;
  eitMode: "color" | "filter";
  onChangeMode: (mode: "color" | "filter") => void;
  eitRange: { min: number; max: number } | null;
  eitBounds: { min: number; max: number } | null;
  onChangeRange: (min: number, max: number) => void;
  unitIndex: number;
  onCycleUnit: (prop: string) => void;
  onSelectElement: (num: number) => void;
}

const CATEGORY_MAPS: Record<string, string> = {
  "alkali metal": "alkali-metal",
  "alkaline earth metal": "alkaline-earth-metal",
  "transition metal": "transition-metal",
  "post-transition metal": "post-transition-metal",
  "metalloid": "metalloid",
  "other nonmetal": "other-nonmetal",
  "nonmetal": "other-nonmetal",
  "halogen": "halogen",
  "noble gas": "noble-gas",
  "lanthanide": "lanthanide",
  "actinide": "actinide",
};

export default function PeriodicGrid({
  hoveredElement,
  onHoverElement,
  selectedCategory,
  onSelectCategory,
  eitProperty,
  onChangeProperty,
  eitMode,
  onChangeMode,
  eitRange,
  eitBounds,
  onChangeRange,
  unitIndex,
  onCycleUnit,
  onSelectElement,
}: PeriodicGridProps) {
  const t = useTranslations("eit");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const isEITActive = eitProperty !== "category";

  // Render elements and overlay
  return (
    <div className="w-full select-none overflow-x-auto scrollbar-hide scroll-smooth-touch scroll-shadow-x pt-3 pb-4">
      {/* 18-column Periodic Table CSS Grid container */}
      <div
        className="grid grid-cols-18 gap-1.5 md:gap-2 mx-auto min-w-[1000px] max-w-[1300px]"
        style={{
          gridTemplateRows: "repeat(7, minmax(0, 1fr)) 16px repeat(2, minmax(0, 1fr))",
        }}
      >
        {/* EIT Overlay Controls placed in Hydrogen/Helium Gap (Row 1, Cols 2-17) */}
        <EITOverlay
          eitProperty={eitProperty}
          onChangeProperty={onChangeProperty}
          eitMode={eitMode}
          onChangeMode={onChangeMode}
          eitRange={eitRange}
          eitBounds={eitBounds}
          onChangeRange={onChangeRange}
          unitIndex={unitIndex}
          onCycleUnit={onCycleUnit}
        />

        {/* Legend Panel placed in row 1-3 cols 3-12 */}
        <TableLegend
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          hoveredCategory={hoveredCategory}
          onHoverCategory={setHoveredCategory}
          activeProperty={eitProperty}
        />

        {/* Empty row gap placeholder inside CSS grid */}
        <div style={{ gridRow: "8", gridColumn: "1 / -1" }} className="h-4" />

        {/* Element cells */}
        {elements.map((el) => {
          const isPlaceholder = typeof el.number === "string";
          const elNum = Number(el.number);

          // Get detailed element structure from finallyData
          const detail = !isPlaceholder ? finallyData[elNum] : null;

          // EIT properties parsing
          let hasData = false;
          let eitValue: number | null = null;
          let eitValueFormatted = "";
          let cellColor: string | null = null;
          let inRange = true;
          let elementCategoryStyleClass = CATEGORY_MAPS[el.category.toLowerCase()] || "unknown";

          if (isEITActive && detail) {
            if (eitProperty === "block") {
              const block = getElectronBlock(elNum, el.column);
              hasData = true;
              eitValueFormatted = `${block} block`;
              // Assign s,p,d,f block discrete colors matching Zperiod CSS
              const blockColors: Record<string, string> = {
                s: "hsl(0, 80%, 70%)",
                p: "hsl(215, 80%, 70%)",
                d: "hsl(48, 80%, 65%)",
                f: "hsl(142, 70%, 65%)",
              };
              cellColor = blockColors[block] || null;
            } else if (eitProperty === "metalType") {
              const mType = getMetalType(el.category);
              hasData = true;
              eitValueFormatted = mType;
              const metalColors: Record<string, string> = {
                Metal: "hsl(215, 15%, 65%)",
                Metalloid: "hsl(45, 90%, 65%)",
                Nonmetal: "hsl(142, 60%, 70%)",
              };
              cellColor = metalColors[mType] || null;
            } else if (eitProperty === "state") {
              const state = detail.level1_basic.phaseAtSTP || "Unknown";
              hasData = true;
              eitValueFormatted = state;
              const stateColors: Record<string, string> = {
                Solid: "hsl(210, 15%, 70%)",
                Liquid: "hsl(210, 85%, 75%)",
                Gas: "hsl(0, 85%, 75%)",
              };
              cellColor = stateColors[state] || null;
            } else {
              // Numeric property (density, meltingPoint, radius, etc.)
              const physical = detail.level3_properties?.physical || {};
              const rawVal = physical[eitProperty as keyof typeof physical];
              const parsed = parseNumericMetric(rawVal, eitProperty);

              if (parsed) {
                hasData = true;
                eitValue = parsed.value;

                // Determine range bounds based on active units
                if (eitBounds && eitRange) {
                  inRange = eitValue >= eitBounds.min && eitValue <= eitBounds.max;
                  const ratio = getNumericRatio(eitValue, eitBounds.min, eitBounds.max);
                  if (ratio !== null) {
                    cellColor = getColorForRatio(ratio);
                  }
                }

                // Format display text using cycle units
                const activeConfig = EIT_PROPERTY_CONFIG.find((cfg) => cfg.key === eitProperty);
                if (activeConfig) {
                  const activeUnit =
                    activeConfig.units && activeConfig.units[unitIndex]
                      ? activeConfig.units[unitIndex]
                      : { unit: activeConfig.unit || "", convert: (v: number) => v, digits: activeConfig.digits ?? 2 };

                  const converted = activeUnit.convert(eitValue);
                  eitValueFormatted = `${converted.toFixed(activeUnit.digits)} ${activeUnit.unit}`;
                }
              }
            }
          }

          // Check highlighting states:
          // 1. Hover highlights
          const isHovered = hoveredElement === el.number;
          // 2. Legend category filter highlighting
          const activeHighlight = selectedCategory || hoveredCategory;
          const matchesCategoryHighlight =
            activeHighlight &&
            (isEITActive
              ? eitProperty === "block"
                ? getElectronBlock(elNum, el.column) === activeHighlight
                : eitProperty === "metalType"
                ? getMetalType(el.category) === activeHighlight
                : eitProperty === "state"
                ? (detail?.level1_basic.phaseAtSTP || "Unknown") === activeHighlight
                : elementCategoryStyleClass === activeHighlight
              : elementCategoryStyleClass === activeHighlight);

          const isAnyCategoryHighlighted = activeHighlight !== null;

          // Dim cells if category highlights are active and they don't match
          const isDimmed = isAnyCategoryHighlighted && !matchesCategoryHighlight;

          return (
            <ElementCell
              key={`${el.number}-${el.symbol}`}
              element={el}
              eitProperty={eitProperty}
              eitMode={eitMode}
              eitValue={eitValue}
              eitValueFormatted={eitValueFormatted}
              inRange={
                eitRange && eitValue !== null
                  ? eitValue >= eitRange.min && eitValue <= eitRange.max
                  : true
              }
              hasData={hasData}
              cellColor={cellColor}
              dimmed={isDimmed}
              focused={isHovered}
              highlighted={!!matchesCategoryHighlight}
              isAnyHighlighted={isAnyCategoryHighlighted}
              onHover={onHoverElement}
              onClick={() => {
                if (!isPlaceholder) {
                  onSelectElement(elNum);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
