"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "../../i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Globe, Check } from "lucide-react";

const LANGUAGES = [
  { code: "km", label: "ភាសាខ្មែរ" },
  { code: "en", label: "English" },
  { code: "zh", label: "简体中文" },
  { code: "zh-Hant", label: "繁體中文" },
  { code: "fr", label: "Français" },
  { code: "ru", label: "Русский" },
  { code: "fa", label: "فارسی", rtl: true },
  { code: "ur", label: "اردو", rtl: true },
  { code: "tl", label: "Tagalog" },
];

export default function LangDropdown() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (langCode: string) => {
    // Navigate to the current path with the new locale
    router.replace(pathname, { locale: langCode });
  };

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 transition-all duration-200"
            aria-label="Change language"
          />
        }
      >
        <Globe className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
        <span className="text-xs font-medium tracking-wide hidden lg:inline">
          {currentLang.label}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 border border-zinc-200 dark:border-zinc-800 shadow-lg p-1 rounded-xl animate-in fade-in zoom-in-95 duration-200"
      >
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-900/80 transition-all duration-150 ${
              lang.code === locale ? "bg-zinc-100 dark:bg-zinc-900 font-semibold text-zinc-900 dark:text-yellow-400" : ""
            }`}
          >
            <span dir={lang.rtl ? "rtl" : "ltr"}>{lang.label}</span>
            {lang.code === locale && (
              <Check className="h-3.5 w-3.5 text-zinc-900 dark:text-yellow-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

