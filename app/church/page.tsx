import type { Metadata } from "next";
import { ChurchWorld } from "@/components/game/ChurchWorld";

export const metadata: Metadata = {
  title: "The Ruined Church · Re:Learn",
  description: "Explore the ruined church with WASD movement.",
};

export default function ChurchPage() {
  return <ChurchWorld />;
}
