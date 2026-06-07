import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["km", "en", "zh", "zh-Hant", "fr", "ru", "fa", "ur", "tl"],

  // Used when no locale matches
  defaultLocale: "km",
});

// Lightweight wrappers around Next.js' navigation APIs
// that will automatically consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
