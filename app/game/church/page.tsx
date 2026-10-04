import type { Metadata } from "next";
import { ChurchWorld } from "@/components/game/ChurchWorld";
import { AdventureEntry } from "@/components/game/adventures/AdventureEntry";

export const metadata: Metadata = {
  title: "The Chapel of Choices · Re:Learn",
  description: "Choose a Python topic and difficulty in the Chapel of Choices.",
};

export default async function ChurchPage({ searchParams }: { searchParams: Promise<{ track?: string; legacy?: string }> }) {
  const query = await searchParams;
  if (query.legacy === "1") return <ChurchWorld />;
  return <AdventureEntry key={query.track ?? "setup"} world="chapel-of-choices" trackId={typeof query.track === "string" ? query.track : undefined} />;
}
