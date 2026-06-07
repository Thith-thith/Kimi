import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Table, FlaskConical, Sparkles } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutPage");

  const techStack = [
    { name: "Next.js 16 (App Router)", type: "Frontend Framework" },
    { name: "React 19", type: "UI Library" },
    { name: "TailwindCSS v4", type: "Styling" },
    { name: "TypeScript", type: "Type Safety" },
    { name: "Matter.js", type: "2D Physics Engine" },
    { name: "Three.js (WebGL)", type: "3D Graphics" },
    { name: "Hono", type: "Backend API Framework" },
    { name: "Bun", type: "Runtime & Workspaces" }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto pt-8 md:pt-12 pb-16 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 p-8 md:p-12 text-center space-y-4 shadow-sm dark:shadow-none">
        {/* Glow Effects */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Educational Chemistry Lab
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-amber-700 to-orange-600 dark:from-white dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-zinc-500 dark:text-zinc-400 font-medium">
            {t("heroSubtitle")}
          </p>
        </div>
      </div>

      {/* Intro section */}
      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 md:p-8 space-y-4 shadow-sm dark:shadow-none">
        <p className="text-sm md:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {t("introText")}
        </p>
      </div>

      {/* Core Features Grid */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">
          {t("pillarsTitle")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="group bg-zinc-50/50 dark:bg-zinc-950/30 hover:bg-white dark:hover:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-amber-500/30 dark:hover:border-amber-500/30 p-6 rounded-2xl space-y-3.5 transition-all duration-300 hover:shadow-lg dark:hover:shadow-none hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <Table className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-850 dark:text-white">
              {t("pillar1Title")}
            </h3>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("pillar1Desc")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-zinc-50/50 dark:bg-zinc-950/30 hover:bg-white dark:hover:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-amber-500/30 dark:hover:border-amber-500/30 p-6 rounded-2xl space-y-3.5 transition-all duration-300 hover:shadow-lg dark:hover:shadow-none hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-850 dark:text-white">
              {t("pillar2Title")}
            </h3>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("pillar2Desc")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-zinc-50/50 dark:bg-zinc-950/30 hover:bg-white dark:hover:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-amber-500/30 dark:hover:border-amber-500/30 p-6 rounded-2xl space-y-3.5 transition-all duration-300 hover:shadow-lg dark:hover:shadow-none hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-850 dark:text-white">
              {t("pillar3Title")}
            </h3>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("pillar3Desc")}
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="space-y-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
            {t("techTitle")}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t("techSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {techStack.map((tech) => (
            <div 
              key={tech.name} 
              className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 p-4 rounded-xl text-center space-y-1.5 shadow-sm dark:shadow-none hover:border-amber-500/20 transition-colors"
            >
              <span className="block text-xs font-bold text-zinc-850 dark:text-white font-mono truncate">
                {tech.name}
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-450 dark:text-zinc-500">
                {tech.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-950/20 dark:to-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 p-6 md:p-8 rounded-2xl space-y-4 shadow-sm dark:shadow-none">
        <h2 className="text-sm font-bold text-zinc-950 dark:text-white border-b border-zinc-200/60 dark:border-zinc-800/50 pb-2">
          {t("creditsTitle")}
        </h2>
        <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-350 italic">
          {t.rich("creditsText", {
            link: (chunks) => (
              <a
                href="https://github.com/Zhilips/Zperiod"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 dark:text-blue-400 underline hover:text-blue-600 dark:hover:text-blue-300 font-bold"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>

    </div>
  );
}
