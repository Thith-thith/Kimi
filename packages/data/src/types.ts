export interface IsotopeData {
  name: string;
  neutron: string;
  percent: string;
}

export interface ElementMass {
  highSchool: string;
  universityConventional: string | null;
  universityInterval: string | null;
}

export interface Level1Basic {
  type: string;
  group: number | string | null;
  period: string;
  phaseAtSTP: string;
  valenceElectrons: string | number;
  commonIons: string;
  commonOxidationStates?: string;
  block?: string;
  series?: string;
}

export interface Level2Atomic {
  mass: ElementMass;
  protons: number | string;
  electronsNeutral: number | string;
  naturalIsotopes?: IsotopeData[];
  naturallyOccurringRadioisotopes?: IsotopeData[];
  longestLivedIsotopes?: IsotopeData[];
}

export interface OxidationStates {
  common: string[];
  possible: string[];
}

export interface ElectronicConfig {
  configuration: string;
  oxidationStates: OxidationStates;
  configurationNote?: string;
}

export interface PhysicalProperties {
  electronegativity: number | null;
  firstIonization: string;
  density: string;
  meltingPoint: string;
  boilingPoint: string;
  electronAffinity: string;
  atomicRadius: string;
  specificHeat: string;
}

export interface Level3Properties {
  electronic: ElectronicConfig;
  physical: PhysicalProperties;
}

export interface HistoryData {
  discoveryYear: string;
  discoveredBy: string;
  namedBy: string;
}

export interface Level4HistorySTSE {
  history: HistoryData;
  stseContext: string[];
  commonUses: string[];
  hazards: string[];
}

export interface Element {
  id: number;
  symbol: string;
  name: string;
  level1_basic: Level1Basic;
  level2_atomic: Level2Atomic;
  level3_properties: Level3Properties;
  level4_history_stse: Level4HistorySTSE;
  chemistryNotes?: string | string[];
  isotopeNotes?: string;
  dataQualityNotes?: string | string[];
  biologicalRole?: string;
  uiLayout?: {
    fallbackDisplayRow: string;
    fallbackDisplayColumn: number;
  };
}

// Ion Types
export interface IonLevel1 {
  type: string;
  source: string;
  phase: string;
  valence: string;
  keyCompounds: string;
}

export interface IonSlot {
  label: string;
  result: string;
  desc: string;
}

export interface IonLevel2 {
  molarMass: string;
  subatomic: string;
  statusBanner: string;
  slotA: IonSlot;
  slotB: IonSlot;
}

export interface IonLevel3 {
  config: string;
  oxidation: string;
  ionicRadius: string;
  hydrationEnthalpy: string;
  coordination: string;
}

export interface IonLevel4 {
  discoveryYear: string;
  discoveredBy: string;
  namedBy: string;
  stse: string;
  commonUses: string;
  hazards: string;
}

export interface IonCustomData {
  level1: IonLevel1;
  level2: IonLevel2;
  level3: IonLevel3;
  level4: IonLevel4;
}

export interface Ion {
  id: string;
  symbol: string;
  charge: string;
  name: string;
  type: "Cation" | "Anion";
  category: "Monatomic" | "Polyatomic";
  colorClass: string;
  section: string;
  sectionName: string;
  group: string;
  groupName: string;
  customData: IonCustomData;
}

export interface GridElement {
  number: number | string;
  symbol: string;
  name: string;
  row: number;
  column: number;
  category: string;
  series?: string;
}

