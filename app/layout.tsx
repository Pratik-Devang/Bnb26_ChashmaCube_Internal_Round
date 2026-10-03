import type { Metadata } from "next";
import "./globals.css";
import { AppFrame } from "@/components/navigation/AppFrame";

export const metadata: Metadata = {
  title: "re:learn · Turn mistakes into mastery",
  description: "A playful learning path that turns Python misconceptions into targeted mini-games.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppFrame>{children}</AppFrame></body>
    </html>
  );
}
