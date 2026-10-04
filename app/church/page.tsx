import type { Metadata } from "next";
import { ChurchWorld } from "@/components/game/ChurchWorld";

export const metadata: Metadata = {
  title: "The Chapel of Choices · Re:Learn",
  description: "Learn Python conditions by exploring the Chapel of Choices.",
};

export default function ChurchPage() {
  return <ChurchWorld />;
}
