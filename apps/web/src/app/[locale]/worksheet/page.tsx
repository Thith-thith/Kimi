import { setRequestLocale } from "next-intl/server";
import WorksheetClient from "../../../components/worksheet/WorksheetClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function WorksheetPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WorksheetClient />;
}
