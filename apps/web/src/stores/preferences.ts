import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TempUnit = "C" | "F" | "K";
export type DensityUnit = "g/cm3" | "kg/m3" | "lb/ft3";
export type EnergyUnit = "kJ/mol" | "eV";
export type RadiusUnit = "pm" | "A" | "nm";
export type HeatUnit = "J/gC" | "J/kgK" | "cal/gC";

export interface PreferencesState {
  welcomed: boolean;
  onboardingCompleted: boolean;
  reduceMotion: boolean;
  animationPaused: boolean;
  animationSpeed: number;
  seenTutorials: Record<string, boolean>;

  // Locked Modal Card Index
  defaultCardIndex: number;
  isCardIndexLocked: boolean;

  // Unit Preferences
  tempUnit: TempUnit;
  densityUnit: DensityUnit;
  energyUnit: EnergyUnit;
  radiusUnit: RadiusUnit;
  heatUnit: HeatUnit;

  // Actions
  setWelcomed: (val: boolean) => void;
  setOnboardingCompleted: (val: boolean) => void;
  setReduceMotion: (val: boolean) => void;
  setAnimationPaused: (val: boolean) => void;
  setAnimationSpeed: (val: number) => void;
  markTutorialSeen: (tourId: string) => void;

  setDefaultCardIndex: (index: number) => void;
  setIsCardIndexLocked: (val: boolean) => void;

  setTempUnit: (unit: TempUnit) => void;
  setDensityUnit: (unit: DensityUnit) => void;
  setEnergyUnit: (unit: EnergyUnit) => void;
  setRadiusUnit: (unit: RadiusUnit) => void;
  setHeatUnit: (unit: HeatUnit) => void;

  resetAll: () => void;
}

const DEFAULT_STATE = {
  welcomed: false,
  onboardingCompleted: false,
  reduceMotion: false,
  animationPaused: false,
  animationSpeed: 1.0,
  seenTutorials: {},
  defaultCardIndex: 0,
  isCardIndexLocked: false,
  tempUnit: "C" as TempUnit,
  densityUnit: "g/cm3" as DensityUnit,
  energyUnit: "kJ/mol" as EnergyUnit,
  radiusUnit: "pm" as RadiusUnit,
  heatUnit: "J/gC" as HeatUnit,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setWelcomed: (val) => set({ welcomed: val }),
      setOnboardingCompleted: (val) => set({ onboardingCompleted: val }),
      setReduceMotion: (val) => set({ reduceMotion: val }),
      setAnimationPaused: (val) => set({ animationPaused: val }),
      setAnimationSpeed: (val) => set({ animationSpeed: val }),
      markTutorialSeen: (tourId) =>
        set((state) => ({
          seenTutorials: { ...state.seenTutorials, [tourId]: true },
        })),

      setDefaultCardIndex: (index) => set({ defaultCardIndex: index }),
      setIsCardIndexLocked: (val) => set({ isCardIndexLocked: val }),

      setTempUnit: (unit) => set({ tempUnit: unit }),
      setDensityUnit: (unit) => set({ densityUnit: unit }),
      setEnergyUnit: (unit) => set({ energyUnit: unit }),
      setRadiusUnit: (unit) => set({ radiusUnit: unit }),
      setHeatUnit: (unit) => set({ heatUnit: unit }),

      resetAll: () => set(DEFAULT_STATE),
    }),
    {
      name: "kimi_preferences",
      partialize: (state) => {
        // Exclude session-only card index locks from localStorage persistence
        const { defaultCardIndex, isCardIndexLocked, ...rest } = state;
        return rest;
      },
      merge: (persistedState, currentState) => {
        // Clean up any legacy persisted locks from user localStorage
        const typedPersisted = persistedState as any;
        if (typedPersisted) {
          delete typedPersisted.defaultCardIndex;
          delete typedPersisted.isCardIndexLocked;
        }
        return {
          ...currentState,
          ...typedPersisted,
        };
      },
    }
  )
);

