import { setRequestLocale } from "next-intl/server";
import { routing } from "../../../../i18n/routing";
import SingleToolPageClient from "../../../../components/tools/SingleToolPageClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; toolId: string }>;
}

const VALID_TOOLS = ["equation-balancer", "molar-mass", "solubility", "virtual-lab"];

export function generateStaticParams() {
  const params: { locale: string; toolId: string }[] = [];
  for (const locale of routing.locales) {
    for (const toolId of VALID_TOOLS) {
      params.push({ locale, toolId });
    }
  }
  return params;
}

export default async function ToolSubPage({ params }: PageProps) {
  const { locale, toolId } = await params;
  
  if (!VALID_TOOLS.includes(toolId)) {
    notFound();
  }
  
  setRequestLocale(locale);
  
  return <SingleToolPageClient toolId={toolId} />;
}
