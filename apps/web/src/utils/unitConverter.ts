// Kimi Chemistry App Unit Converter Utility
// Formats and converts physical raw data strings to the user's preferred units

export function formatTemperature(rawStr: string | null | undefined, unit: "C" | "F" | "K"): string {
  if (!rawStr || rawStr === "N/A" || rawStr === "-") return "N/A";
  
  // Extract number and unit
  const match = String(rawStr).match(/(-?\d+(?:\.\d+)?)\s*(°C|K)/);
  if (!match) return String(rawStr);
  
  const value = parseFloat(match[1]);
  const originalUnit = match[2]; // "°C" or "K"
  const suffix = String(rawStr).replace(match[0], "").trim();
  
  let valInC = value;
  if (originalUnit === "K") {
    valInC = value - 273.15;
  }
  
  let resultVal = valInC;
  let targetUnitStr = "°C";
  
  if (unit === "K") {
    resultVal = valInC + 273.15;
    targetUnitStr = "K";
  } else if (unit === "F") {
    resultVal = valInC * 1.8 + 32;
    targetUnitStr = "°F";
  }
  
  const formattedVal = Number(resultVal.toFixed(2));
  return `${formattedVal} ${targetUnitStr}${suffix ? " " + suffix : ""}`;
}

export function formatDensity(rawStr: string | null | undefined, unit: "g/cm3" | "kg/m3" | "lb/ft3"): string {
  if (!rawStr || rawStr === "N/A" || rawStr === "-") return "N/A";
  
  // Match number and unit
  const match = String(rawStr).match(/(-?\d+(?:\.\d+)?)\s*(g\/cm³|g\/L)/);
  if (!match) return String(rawStr);
  
  const value = parseFloat(match[1]);
  const originalUnit = match[2]; // "g/cm³" or "g/L"
  const suffix = String(rawStr).replace(match[0], "").trim();
  
  // Convert to g/cm3 as base
  let valInGcm3 = value;
  if (originalUnit === "g/L") {
    valInGcm3 = value / 1000;
  }
  
  let resultVal = valInGcm3;
  let targetUnitStr = "g/cm³";
  
  if (unit === "kg/m3") {
    resultVal = valInGcm3 * 1000;
    targetUnitStr = "kg/m³";
  } else if (unit === "lb/ft3") {
    resultVal = valInGcm3 * 62.42796;
    targetUnitStr = "lb/ft³";
  }
  
  let formatted = "";
  if (resultVal < 0.01) {
    formatted = resultVal.toExponential(4);
  } else {
    formatted = resultVal.toFixed(3);
  }
  
  return `${Number(formatted)} ${targetUnitStr}${suffix ? " " + suffix : ""}`;
}

export function formatEnergy(rawStr: string | null | undefined, unit: "kJ/mol" | "eV"): string {
  if (!rawStr || rawStr === "N/A" || rawStr === "-") return "N/A";
  
  const match = String(rawStr).match(/(-?\d+(?:\.\d+)?)\s*(kJ\/mol)/);
  if (!match) return String(rawStr);
  
  const value = parseFloat(match[1]);
  const suffix = String(rawStr).replace(match[0], "").trim();
  
  let resultVal = value;
  let targetUnitStr = "kJ/mol";
  
  if (unit === "eV") {
    resultVal = value / 96.4853;
    targetUnitStr = "eV";
  }
  
  const formatted = resultVal.toFixed(2);
  return `${Number(formatted)} ${targetUnitStr}${suffix ? " " + suffix : ""}`;
}

export function formatRadius(rawStr: string | null | undefined, unit: "pm" | "A" | "nm"): string {
  if (!rawStr || rawStr === "N/A" || rawStr === "-") return "N/A";
  
  const match = String(rawStr).match(/(-?\d+(?:\.\d+)?)\s*(pm)/);
  if (!match) return String(rawStr);
  
  const value = parseFloat(match[1]);
  const suffix = String(rawStr).replace(match[0], "").trim();
  
  let resultVal = value;
  let targetUnitStr = "pm";
  
  if (unit === "A") {
    resultVal = value * 0.01;
    targetUnitStr = "Å";
  } else if (unit === "nm") {
    resultVal = value * 0.001;
    targetUnitStr = "nm";
  }
  
  const formatted = resultVal.toFixed(3);
  return `${Number(formatted)} ${targetUnitStr}${suffix ? " " + suffix : ""}`;
}

export function formatSpecificHeat(rawStr: string | null | undefined, unit: "J/gC" | "J/kgK" | "cal/gC"): string {
  if (!rawStr || rawStr === "N/A" || rawStr === "-") return "N/A";
  
  const match = String(rawStr).match(/(-?\d+(?:\.\d+)?)\s*(J\/\(g·°C\))/);
  if (!match) return String(rawStr);
  
  const value = parseFloat(match[1]);
  const suffix = String(rawStr).replace(match[0], "").trim();
  
  let resultVal = value;
  let targetUnitStr = "J/(g·°C)";
  
  if (unit === "J/kgK") {
    resultVal = value * 1000;
    targetUnitStr = "J/(kg·K)";
  } else if (unit === "cal/gC") {
    resultVal = value / 4.184;
    targetUnitStr = "cal/(g·°C)";
  }
  
  const formatted = resultVal.toFixed(4);
  return `${Number(formatted)} ${targetUnitStr}${suffix ? " " + suffix : ""}`;
}
