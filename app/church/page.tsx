import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "The Chapel of Choices · Re:Learn",
  description: "Learn Python conditions by exploring the Chapel of Choices.",
};

export default function ChurchPage() {
  redirect("/game/church");
}
