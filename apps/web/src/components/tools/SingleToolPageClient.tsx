"use client";

import { useRouter } from "../../i18n/routing";
import EquationBalancer from "./EquationBalancer";
import MolarMassCalculator from "./MolarMassCalculator";
import SolubilityChecker from "./SolubilityChecker";
import VirtualLab from "./VirtualLab";

interface SingleToolPageClientProps {
  toolId: string;
}

export default function SingleToolPageClient({ toolId }: SingleToolPageClientProps) {
  const router = useRouter();

  const renderActiveTool = () => {
    switch (toolId) {
      case "equation-balancer":
        return <EquationBalancer onClose={() => router.push("/tools")} />;
      case "molar-mass":
        return <MolarMassCalculator onClose={() => router.push("/tools")} />;
      case "solubility":
        return <SolubilityChecker onClose={() => router.push("/tools")} />;
      case "virtual-lab":
        return <VirtualLab onClose={() => router.push("/tools")} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col items-center justify-start py-6 animate-in fade-in duration-300">
      <div className="w-full max-w-7xl mx-auto">
        {renderActiveTool()}
      </div>
    </div>
  );
}
