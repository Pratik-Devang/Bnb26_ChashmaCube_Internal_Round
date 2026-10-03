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
];

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/game")) {
    return children;
  }

  return (
    <div className="product-shell">
      <header className="product-header">
        <div className="window-controls" aria-hidden="true"><i /><i /><i /></div>
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
            <span>{learner.avatar}</span>
            <span className="profile-copy"><strong>{learner.name}</strong><small>Python learner</small></span>
          </Link>
        </div>
      </header>

      <div className="page-stage">{children}</div>

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
