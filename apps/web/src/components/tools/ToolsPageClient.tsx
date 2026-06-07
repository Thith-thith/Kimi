"use client";

import { useTranslations } from "next-intl";
import { Scale, Calculator, Beaker, FlaskConical } from "lucide-react";
import { Link } from "../../i18n/routing";

const TOOLS = [
  {
    id: "equation-balancer",
    icon: Scale,
    titleKey: "balancerName",
    descKey: "balancerDesc",
    gradeKey: "balancerGrade",
    tagKey: "balancerTag",
    iconClass: "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
  },
  {
    id: "molar-mass",
    icon: Calculator,
    titleKey: "molarMassName",
    descKey: "molarMassDesc",
    gradeKey: "molarMassGrade",
    tagKey: "molarMassTag",
    iconClass: "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400"
  },
  {
    id: "solubility",
    icon: Beaker,
    titleKey: "solubilityName",
    descKey: "solubilityDesc",
    gradeKey: "solubilityGrade",
    tagKey: "solubilityTag",
    iconClass: "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 text-emerald-650 dark:text-emerald-400"
  },
  {
    id: "virtual-lab",
    icon: FlaskConical,
    titleKey: "virtualLabName",
    descKey: "virtualLabDesc",
    gradeKey: "balancerGrade",
    tagKey: "balancerTag",
    iconClass: "bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-650 dark:text-purple-400"
  }
];

export default function ToolsPageClient() {
  const t = useTranslations("tools");

  const getToolTitle = (tool: typeof TOOLS[0]) => {
    return t.has(tool.titleKey) ? t(tool.titleKey) : tool.titleKey;
  };

  const getToolDesc = (tool: typeof TOOLS[0]) => {
    return t.has(tool.descKey) ? t(tool.descKey) : tool.descKey;
  };

  const getToolGrade = (tool: typeof TOOLS[0]) => {
    return t.has(tool.gradeKey) ? t(tool.gradeKey) : tool.gradeKey;
  };

  const getToolTag = (tool: typeof TOOLS[0]) => {
    return t.has(tool.tagKey) ? t(tool.tagKey) : tool.tagKey;
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col items-center justify-start py-6 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl space-y-8">
        {/* Landing Header */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {t("pageTitle")}
          </h1>
          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            {t("pageSubtitle")}
          </p>
        </div>

        {/* Grid of Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={`/tools/${tool.id}`}
                className="w-full text-left bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 active:scale-[0.98] md:active:scale-100 md:hover:scale-[1.01] hover:border-zinc-350 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all duration-300 group flex flex-col justify-between min-h-[12rem] md:h-56 cursor-pointer relative overflow-hidden shadow-sm dark:shadow-none"
              >
                {/* Decorative background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/[0.01] dark:from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="space-y-4 relative z-10 w-full">
                  {/* Header */}
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-3 rounded-2xl transition-transform duration-300 group-hover:scale-105 ${tool.iconClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    {/* Badges */}
                    <div className="flex gap-2">
                      <span className="bg-zinc-100 dark:bg-zinc-955 border border-zinc-205 dark:border-zinc-800 text-[10px] font-semibold font-sans px-2.5 py-0.5 rounded-full text-zinc-650 dark:text-zinc-400">
                        {getToolGrade(tool)}
                      </span>
                      <span className="bg-zinc-100 dark:bg-zinc-955 border border-zinc-205 dark:border-zinc-800 text-[10px] font-semibold font-sans px-2.5 py-0.5 rounded-full text-zinc-650 dark:text-zinc-400 uppercase tracking-wider">
                        {getToolTag(tool)}
                      </span>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {getToolTitle(tool)}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                      {getToolDesc(tool)}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white group-active:text-zinc-900 dark:group-active:text-white transition-colors flex items-center gap-1 mt-4 relative z-10 font-sans">
                  Launch Tool
                  <span className="inline-block transition-transform group-hover:translate-x-1 duration-300">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
