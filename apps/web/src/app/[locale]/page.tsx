import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import PeriodicTableClient from "../../components/periodic-table/PeriodicTableClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  // Set the locale for static rendering of this page
  setRequestLocale(locale);

  return (
    <Suspense fallback={<div className="text-zinc-500 text-center py-12">Loading Periodic Table...</div>}>
      <PeriodicTableClient />
    </Suspense>
  );
}
