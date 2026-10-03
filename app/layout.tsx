import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "re:learn · Turn mistakes into mastery",
  description: "A playful learning path that turns Python misconceptions into targeted mini-games.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
