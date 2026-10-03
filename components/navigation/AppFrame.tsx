"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { learner } from "@/lib/mock-data";
import { Icon, type IconName } from "@/components/ui/Icon";

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/learn", label: "Learn", icon: "book" },
  { href: "/insights", label: "Insights", icon: "brain" },
  { href: "/progress", label: "Progress", icon: "chart" },
  { href: "/profile", label: "Profile", icon: "user" },
];

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="product-shell">
      <header className="product-header">
        <Link href="/" className="brand" aria-label="Re:Learn home">
          re:<span>learn</span><i>↻</i>
        </Link>
        <div className="header-context">
          <span className="context-dot" aria-hidden="true" />
          Python foundations
        </div>
        <div className="header-status">
          <span className="header-chip"><Icon name="flame" />{learner.streak} day streak</span>
          <span className="header-chip xp"><Icon name="bolt" />{learner.xp.toLocaleString()} XP</span>
          <Link href="/profile" className="mini-profile" aria-label="Open profile">
            <span>{learner.avatar}</span>
            <strong>{learner.name}</strong>
          </Link>
        </div>
      </header>

      <div className="page-stage">{children}</div>

      <nav className="bottom-navigation" aria-label="Primary navigation">
        {navigation.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <span><Icon name={item.icon} /></span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
