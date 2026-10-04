"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAccount } from "@/components/auth/AccountProvider";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { ScrollMotion } from "@/components/ui/ScrollMotion";

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/learn", label: "Learn", icon: "book" },
  { href: "/insights", label: "Insights", icon: "brain" },
  { href: "/progress", label: "Progress", icon: "chart" },
  { href: "/guide", label: "Guide", icon: "sparkles" },
];

export function AppFrame({ children }: { children: ReactNode }) {
  const { learner } = useAccount();
  const pathname = usePathname();

  if (pathname.startsWith("/game")) {
    return children;
  }

  return (
    <div className="product-shell">
      <header className="product-header">
        <span className="guild-emblem" aria-hidden="true">R</span>
        <Link href="/" className="brand" aria-label="Re:Learn home">
          re:<span>learn</span>
        </Link>

        <nav className="top-navigation" aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="header-status">
          <span className="header-chip" title={`${learner.streak} day streak`}><Icon name="flame" /><b>{learner.streak}</b></span>
          <span className="header-chip xp" title={`${learner.xp.toLocaleString()} XP`}><Icon name="bolt" /><b>{learner.xp.toLocaleString()}</b></span>
          <Link href="/profile" className={`mini-profile${pathname.startsWith("/profile") ? " active" : ""}`} aria-label="Open profile" aria-current={pathname.startsWith("/profile") ? "page" : undefined}>
            <span className="header-portrait"><PixelSprite /></span>
            <span className="profile-copy"><strong>{learner.name}</strong><small>Level {learner.level} explorer</small></span>
          </Link>
        </div>
      </header>

      <ScrollMotion>{children}</ScrollMotion>
      <footer className="guild-footer"><span>RE:LEARN / THE EXPLORER’S JOURNAL</span><span>Every mistake reveals a new path.</span></footer>

      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {[...navigation, { href: "/profile", label: "Profile", icon: "user" as IconName }].map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
