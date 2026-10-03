"use client";

import { useState } from "react";
import type { Learner } from "@/types/learning";
import { Icon } from "@/components/ui/Icon";

interface Props {
  learner: Learner;
  xp: number;
  active: string;
  onNavigate: (item: string) => void;
}

const items = ["Learning Path", "Quests", "Progress", "Library"];

export function TopNavigation({ learner, xp, active, onNavigate }: Props) {
  const [open, setOpen] = useState(false);

  const navigate = (item: string) => {
    onNavigate(item);
    setOpen(false);
  };

  return (
    <header className="topbar">
      <button className="wordmark" onClick={() => navigate("Learning Path")} aria-label="Go to learning path">
        re:<span>learn</span><i>↻</i>
      </button>
      <nav className="topnav" aria-label="Main navigation">
        {items.map((item) => (
          <button key={item} className={active === item ? "is-active" : ""} onClick={() => navigate(item)}>{item}</button>
        ))}
      </nav>
      <div className="learner-strip">
        <span className="xp-chip">⚡ {xp.toLocaleString()} XP</span>
        <span className="streak-chip">🔥 {learner.streak} days</span>
        <div className="learner-profile">
          <span className="avatar" aria-hidden="true">{learner.avatar}</span>
          <span><strong>{learner.name}</strong><small>Level {learner.level} learner</small></span>
        </div>
      </div>
      <button className="mobile-menu" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close navigation" : "Open navigation"}>
        <Icon name={open ? "close" : "menu"} />
      </button>
      {open ? (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {items.map((item) => <button key={item} onClick={() => navigate(item)}>{item}</button>)}
          <div><span>⚡ {xp.toLocaleString()} XP</span><span>🔥 {learner.streak} days</span></div>
        </nav>
      ) : null}
    </header>
  );
}
