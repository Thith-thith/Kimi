import { setRequestLocale } from "next-intl/server";
import IonsGrid from "../../../components/ions/IonsGrid";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function IonsPage({ params }: PageProps) {
  const { locale } = await params;

  // Set Request Locale for next-intl static rendering
  setRequestLocale(locale);

  return <IonsGrid />;
}
