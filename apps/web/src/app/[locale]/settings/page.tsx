import { setRequestLocale } from "next-intl/server";
import SettingsClient from "../../../components/settings/SettingsClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SettingsClient />;
}
