import type { Metadata } from "next";
import { FirstIslandWorld } from "@/components/game/FirstIslandWorld";
import { AdventureEntry } from "@/components/game/adventures/AdventureEntry";

export const metadata: Metadata = {
  title: "The First Island · Re:Learn",
  description: "Choose a Python topic and difficulty, then explore The First Island.",
};

export default async function GamePage({ searchParams }: { searchParams: Promise<{ track?: string; legacy?: string }> }) {
  const query = await searchParams;
  if (query.legacy === "1") return <FirstIslandWorld />;
  return <AdventureEntry key={query.track ?? "setup"} world="first-island" trackId={typeof query.track === "string" ? query.track : undefined} />;
}
