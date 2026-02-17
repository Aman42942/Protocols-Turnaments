import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";

export default function Home() {
  return (
    <div className="flex flex-col gap-0">
      <HeroSection />
      <FeatureSection />
      {/* Tournament List will go here */}
    </div>
  );
}
