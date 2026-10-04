import type { Metadata } from "next";
import { FirstIslandWorld } from "@/components/game/FirstIslandWorld";

export const metadata: Metadata = {
  title: "The First Island · Re:Learn",
  description: "Learn variables and values by exploring The First Island.",
};

export default function GamePage() {
  return <FirstIslandWorld />;
}
