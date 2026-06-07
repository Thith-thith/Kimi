"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "../../i18n/routing";
import Image from "next/image";
import ElementSearch from "./ElementSearch";
import LangDropdown from "./LangDropdown";
import { AnimatedThemeToggler } from "./AnimatedThemeToggler";
import { motion } from "framer-motion";
import { Table, Atom, Wrench, BookOpen, Settings, MoreHorizontal } from "lucide-react";
import Dock from "./Dock";

const NAV_ITEMS = [
  { path: "/", key: "table" },
  { path: "/ions", key: "ions" },
  { path: "/tools", key: "tools" },
  { path: "/worksheet", key: "worksheet" },
  { path: "/settings", key: "settings" },
  { path: "/about", key: "about" },
];

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  table: Table,
  ions: Atom,
  tools: Wrench,
  worksheet: BookOpen,
  settings: Settings,
  about: MoreHorizontal,
};

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();

  const dockItems = [
    { path: "/", label: t("table"), icon: Table },
    { path: "/ions", label: t("ions"), icon: Atom },
    { path: "/tools", label: t("tools"), icon: Wrench },
    { path: "/worksheet", label: t("worksheet"), icon: BookOpen },
    { path: "/settings", label: t("settings"), icon: Settings },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState<{
    width: number;
    left: number;
    opacity: number;
  }>({
    width: 0,
    left: 0,
    opacity: 0,
  });

  const [hoveredStyle, setHoveredStyle] = useState<{
    width: number;
    left: number;
    opacity: number;
  } | null>(null);

  // Calculate the active index
  const activePath = pathname === "" ? "/" : pathname;

  useEffect(() => {
    const updateSlider = () => {
      if (!containerRef.current) return;

      const activeEl = containerRef.current.querySelector(
        `[data-path="${activePath}"]`
      ) as HTMLElement;

      if (activeEl) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        setSliderStyle({
          width: activeRect.width,
          left: activeRect.left - containerRect.left,
          opacity: 1,
        });
      } else {
        setSliderStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateSlider();

    window.addEventListener("resize", updateSlider);
    return () => {
      window.removeEventListener("resize", updateSlider);
    };
  }, [activePath, locale]);

  return (
    <>
      {/* ═══ Top Navigation Bar ═══ */}
      <nav className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-7xl h-14 bg-white/70 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl rounded-full flex items-center justify-between px-4 md:px-6 shadow-2xl z-50 transition-all duration-300">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <Image
              src="/logo.png"
              alt="Kimi Logo"
              width={28}
              height={28}
              className="w-7 h-7 rounded-lg hover:scale-110 hover:-rotate-6 transition-all duration-300"
              priority
            />
            <span className="text-md font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-950 dark:from-white dark:to-zinc-200 bg-clip-text text-transparent">
              Kimi
            </span>
          </Link>
        </div>

        {/* Navigation center tabs — Desktop only */}
        <div
          ref={containerRef}
          onMouseLeave={() => setHoveredStyle(null)}
          className="relative hidden md:flex items-center bg-zinc-100/80 dark:bg-zinc-900/60 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 flex-shrink-0"
        >
          {/* Sliding Hover Capsule indicator */}
          <div
            className="absolute top-1 bottom-1 bg-zinc-200/50 dark:bg-white/5 rounded-full transition-all duration-200 ease-out pointer-events-none z-0"
            style={{
              width: hoveredStyle ? `${hoveredStyle.width}px` : "0px",
              left: hoveredStyle ? `${hoveredStyle.left}px` : "0px",
              opacity: hoveredStyle ? hoveredStyle.opacity : 0,
            }}
          />

          {/* Sliding Capsule indicator */}
          <div
            className="absolute top-1 bottom-1 bg-white dark:bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none rounded-full transition-all duration-300 ease-out pointer-events-none"
            style={{
              width: `${sliderStyle.width}px`,
              left: `${sliderStyle.left}px`,
              opacity: sliderStyle.opacity,
            }}
          />

          {NAV_ITEMS.map((item) => {
            const isActive = activePath === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                data-path={item.path}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  const container = containerRef.current;
                  if (container && target) {
                    const containerRect = container.getBoundingClientRect();
                    const targetRect = target.getBoundingClientRect();
                    setHoveredStyle({
                      width: targetRect.width,
                      left: targetRect.left - containerRect.left,
                      opacity: 1,
                    });
                  }
                }}
                className={`relative z-10 px-3.5 md:px-5 py-1.5 text-xs md:text-sm font-semibold rounded-full select-none cursor-pointer transition-colors duration-300 ${
                  isActive ? "text-zinc-950 dark:text-white active-pill" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </div>

        {/* Search, Language Dropdown, Theme Toggle */}
        <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
          <div className="hidden sm:block">
            <ElementSearch />
          </div>
          <LangDropdown />
          <AnimatedThemeToggler />
        </div>
      </nav>

      {/* ═══ Mobile Bottom Tab Bar ═══ */}
      <nav 
        className="fixed bottom-4 left-0 right-0 z-50 md:hidden animate-tab-slide-up pointer-events-none px-4 flex justify-center"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <Dock items={dockItems} activePath={activePath} className="w-auto" />
      </nav>
    </>
  );
}
