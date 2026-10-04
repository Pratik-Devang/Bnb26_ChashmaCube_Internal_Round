import type { Metadata } from "next";
import { ChurchMap } from "@/components/game/church/ChurchMap";

export const metadata: Metadata = {
  title: "The Ruined Church · Re:Learn",
  description: "Explore the ruined church, the future home of the Conditions learning journey.",
};

export default function ChurchPage() {
  return <ChurchMap />;
}
