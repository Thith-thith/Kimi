"use client";

import { Ion } from "@kimi/data";

interface IonCardProps {
  ion: Ion;
  onClick: () => void;
}

// Unicode formatter for chemical formulas and charges
export function formatChem(str: string): string {
  if (!str) return "";
  const subMap: Record<string, string> = {
    "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
    "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9"
  };
  const supMap: Record<string, string> = {
    "⁺": "+", "⁻": "-", "⁰": "0", "¹": "1", "²": "2",
    "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7",
    "⁸": "8", "⁹": "9"
  };

  return str
    .split("")
    .map((char) => {
      if (subMap[char]) return `<sub>${subMap[char]}</sub>`;
      if (supMap[char]) return `<sup>${supMap[char]}</sup>`;
      return char;
    })
    .join("");
}

// Map groups to modern glassmorphic Tailwind colors
const ION_GROUP_COLORS: Record<string, { bg: string; text: string; border: string; hoverBg: string }> = {
  // Cations
  basic_cat1: { bg: "bg-red-100 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20", text: "text-red-900 dark:text-red-300", hoverBg: "hover:bg-red-200 dark:hover:bg-red-500/20" },
  basic_cat2: { bg: "bg-orange-100 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20", text: "text-orange-900 dark:text-orange-300", hoverBg: "hover:bg-orange-200 dark:hover:bg-orange-500/20" },
  basic_cat3: { bg: "bg-amber-100 dark:bg-yellow-500/10", border: "border-amber-200 dark:border-yellow-500/20", text: "text-amber-900 dark:text-yellow-300", hoverBg: "hover:bg-amber-200 dark:hover:bg-yellow-500/20" },
  // Anions
  basic_an1: { bg: "bg-blue-100 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", text: "text-blue-900 dark:text-blue-300", hoverBg: "hover:bg-blue-200 dark:hover:bg-blue-500/20" },
  basic_an2: { bg: "bg-emerald-100 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", text: "text-emerald-900 dark:text-emerald-300", hoverBg: "hover:bg-emerald-200 dark:hover:bg-emerald-500/20" },
  basic_an3: { bg: "bg-green-100 dark:bg-green-500/10", border: "border-green-200 dark:border-green-500/20", text: "text-green-900 dark:text-green-300", hoverBg: "hover:bg-green-200 dark:hover:bg-green-500/20" },
  // Core Polyatomics
  core_c: { bg: "bg-amber-100/80 dark:bg-yellow-500/8", border: "border-amber-200 dark:border-yellow-500/15", text: "text-amber-900 dark:text-yellow-300", hoverBg: "hover:bg-amber-200 dark:hover:bg-yellow-500/15" },
  core_n: { bg: "bg-purple-100 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", text: "text-purple-900 dark:text-purple-300", hoverBg: "hover:bg-purple-200 dark:hover:bg-purple-500/20" },
  core_s: { bg: "bg-pink-100 dark:bg-pink-500/10", border: "border-pink-200 dark:border-pink-500/20", text: "text-pink-900 dark:text-pink-300", hoverBg: "hover:bg-pink-200 dark:hover:bg-pink-500/20" },
  core_p: { bg: "bg-violet-100 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20", text: "text-violet-900 dark:text-violet-300", hoverBg: "hover:bg-violet-200 dark:hover:bg-violet-500/20" },
  core_cl: { bg: "bg-lime-100 dark:bg-lime-500/10", border: "border-lime-200 dark:border-lime-500/20", text: "text-lime-900 dark:text-lime-300", hoverBg: "hover:bg-lime-200 dark:hover:bg-lime-500/20" },
  // Transitions
  trans_cu: { bg: "bg-amber-100 dark:bg-amber-600/10", border: "border-amber-200 dark:border-amber-600/20", text: "text-amber-950 dark:text-amber-300", hoverBg: "hover:bg-amber-200 dark:hover:bg-amber-600/20" },
  trans_fe: { bg: "bg-stone-100 dark:bg-stone-500/10", border: "border-stone-200 dark:border-stone-500/20", text: "text-stone-900 dark:text-stone-300", hoverBg: "hover:bg-stone-200 dark:hover:bg-stone-500/20" },
  trans_pb: { bg: "bg-zinc-100 dark:bg-zinc-600/10", border: "border-zinc-200 dark:border-zinc-600/20", text: "text-zinc-900 dark:text-zinc-300", hoverBg: "hover:bg-zinc-200 dark:hover:bg-zinc-600/20" },
  trans_mn: { bg: "bg-fuchsia-100 dark:bg-fuchsia-500/10", border: "border-fuchsia-200 dark:border-fuchsia-500/20", text: "text-fuchsia-900 dark:text-fuchsia-300", hoverBg: "hover:bg-fuchsia-200 dark:hover:bg-fuchsia-500/20" },
  trans_cr: { bg: "bg-yellow-100 dark:bg-yellow-600/10", border: "border-yellow-200 dark:border-yellow-600/20", text: "text-yellow-950 dark:text-yellow-300", hoverBg: "hover:bg-yellow-200 dark:hover:bg-yellow-600/20" },
  // Special
  spec_pair: { bg: "bg-teal-100 dark:bg-teal-500/10", border: "border-teal-200 dark:border-teal-500/20", text: "text-teal-900 dark:text-teal-300", hoverBg: "hover:bg-teal-200 dark:hover:bg-teal-500/20" },
  spec_acid: { bg: "bg-sky-100 dark:bg-sky-500/10", border: "border-sky-200 dark:border-sky-500/20", text: "text-sky-900 dark:text-sky-300", hoverBg: "hover:bg-sky-200 dark:hover:bg-sky-500/20" },
  spec_org: { bg: "bg-orange-100 dark:bg-orange-600/10", border: "border-orange-200 dark:border-orange-600/20", text: "text-orange-950 dark:text-orange-300", hoverBg: "hover:bg-orange-200 dark:hover:bg-orange-600/20" },
};

function getGroupStyles(groupId: string) {
  return ION_GROUP_COLORS[groupId] || { bg: "bg-zinc-100 dark:bg-zinc-800/30", border: "border-zinc-200 dark:border-zinc-700/30", text: "text-zinc-800 dark:text-zinc-400", hoverBg: "hover:bg-zinc-200 dark:hover:bg-zinc-700/20" };
}

export default function IonCard({ ion, onClick }: IonCardProps) {
  const styles = getGroupStyles(ion.group);

  const parsedSymbol = formatChem(ion.symbol);
  const parsedCharge = formatChem(ion.charge);

  // Stacked notation for ions with subscripts
  const hasSubscript = /[₀₁₂₃₄₅₆₇₈₉]/.test(ion.symbol);
  let symbolContent = "";

  if (hasSubscript) {
    // Extract base parts and last subscripts
    const match = parsedSymbol.match(/^(.+)<sub>([^<]+)<\/sub>$/);
    if (match) {
      const baseSymbol = match[1];
      const subText = match[2];
      symbolContent = `${baseSymbol}<span className="inline-flex flex-col text-[10px] align-middle ml-0.5 leading-none"><sup>${parsedCharge}</sup><sub>${subText}</sub></span>`;
    } else {
      symbolContent = `${parsedSymbol}<sup>${parsedCharge}</sup>`;
    }
  } else {
    symbolContent = `${parsedSymbol}<sup>${parsedCharge}</sup>`;
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-2xl border aspect-square cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-lg ${styles.bg} ${styles.border} ${styles.text} ${styles.hoverBg}`}
    >
      <span
        className="text-md md:text-xl font-bold tracking-tighter leading-none mb-1.5"
        dangerouslySetInnerHTML={{ __html: symbolContent }}
      />
      <span className="text-[10px] text-zinc-550 dark:text-zinc-400 text-center truncate w-full font-semibold capitalize">
        {ion.name}
      </span>
    </button>
  );
}
