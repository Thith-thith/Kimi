import { setRequestLocale } from "next-intl/server";
import ToolsPageClient from "../../../components/tools/ToolsPageClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ToolsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ToolsPageClient />;
}
