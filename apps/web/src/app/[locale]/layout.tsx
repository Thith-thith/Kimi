import type { Metadata } from "next";
import { Inter, Kantumruy_Pro } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "../../i18n/routing";
import Navbar from "../../components/layout/Navbar";
import ThemeScript from "../../components/theme/ThemeScript";
import { Analytics } from "@vercel/analytics/react";
import "../globals.css";
import "../ion-animations.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const kantumruyPro = Kantumruy_Pro({
  variable: "--font-khmer",
  subsets: ["khmer"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  const title = t("title");
  const description = t("description");

  const isDev = process.env.NODE_ENV === "development";
  const baseUrl = isDev 
    ? "http://localhost:3000" 
    : (process.env.NEXT_PUBLIC_APP_URL || "https://kimi-chemistry.vercel.app");

  return {
    title: {
      template: "%s | Kimi",
      default: title,
    },
    description,
    metadataBase: new URL(baseUrl),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png", sizes: "32x32" },
      ],
      apple: [
        { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: "Kimi",
      images: [
        {
          url: "/images/og-share-preview.png",
          width: 1200,
          height: 630,
          alt: "Kimi — The Interactive 3D Periodic Table",
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/og-share-preview.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Set the locale for static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  const messages = await getMessages();

  // Determine reading direction (RTL for fa and ur)
  const dir = locale === "fa" || locale === "ur" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${kantumruyPro.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex-1 w-full max-w-[1400px] mx-auto pt-20 pb-24 md:pb-8 px-3 md:px-8 flex flex-col justify-start">
            {children}
          </main>
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

