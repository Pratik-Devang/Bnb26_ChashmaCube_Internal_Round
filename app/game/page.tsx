import type { Metadata } from "next";
import { GameWorld } from "@/components/game/GameWorld";

export const metadata: Metadata = {
  title: "Starter Island · Re:Learn",
  description: "Explore a game-world prototype for Re:Learn.",
};

export default function GamePage() {
  return <GameWorld />;
}
