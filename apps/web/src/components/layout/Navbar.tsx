"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "../../i18n/routing";
import Image from "next/image";
import ElementSearch from "./ElementSearch";
import LangDropdown from "./LangDropdown";
import { AnimatedThemeToggler } from "./AnimatedThemeToggler";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight, Table, Atom, Wrench, BookOpen, Settings, Info } from "lucide-react";

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
  about: Info,
};

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
      type: "spring",
      stiffness: 260,
      damping: 26,
    } as any,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -15,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    } as any,
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    } as any,
  },
};

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      {/* Navigation center tabs */}
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

      {/* Search, Language Dropdown, Theme Toggle, GitHub */}
      <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
        <div className="hidden sm:block">
          <ElementSearch />
        </div>
        <LangDropdown />
        <AnimatedThemeToggler />

        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden flex items-center justify-center size-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 transition-all duration-200 cursor-pointer"
          aria-label="Toggle mobile menu"
          type="button"
        >
          {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-30 md:hidden"
            />

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] bg-white/90 dark:bg-zinc-950/90 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl z-40 flex flex-col gap-6 md:hidden"
            >
              {/* Search - visible only on screens smaller than sm */}
              <motion.div variants={itemVariants} className="block sm:hidden">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block mb-2">
                  {t("search") || "Search"}
                </span>
                <div className="w-full max-w-none">
                  <ElementSearch />
                </div>
              </motion.div>

              {/* Nav Links List */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block mb-2">
                  {t("navigation") || "Navigation"}
                </span>
                {NAV_ITEMS.map((item) => {
                  const isActive = activePath === item.path;
                  const Icon = NAV_ICONS[item.key] || ArrowRight;
                  return (
                    <motion.div key={item.path} variants={itemVariants}>
                      <Link
                        href={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                          isActive
                            ? "bg-zinc-100 dark:bg-white/10 text-zinc-950 dark:text-white"
                            : "text-zinc-600 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`size-4.5 transition-transform duration-200 ${isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400 group-hover:scale-110"}`} />
                          <span>{t(item.key)}</span>
                        </div>
                        <ArrowRight className="size-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom Actions Row */}
              <motion.div variants={itemVariants} className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-5 flex items-center justify-center">
                {/* Copyright Info */}
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  © {new Date().getFullYear()} Kimi
                </span>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
