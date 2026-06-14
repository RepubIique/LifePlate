import { PremiumCard } from "@/components/PremiumCard";
import type { PillarProgress } from "@lifeplate/shared";
import { PillarInsightContent } from "./PillarInsightContent";

type Props = {
  pillar: PillarProgress;
};

export function EssentialPillarCard({ pillar }: Props) {
  return (
    <PremiumCard>
      <PillarInsightContent pillar={pillar} />
    </PremiumCard>
  );
}
