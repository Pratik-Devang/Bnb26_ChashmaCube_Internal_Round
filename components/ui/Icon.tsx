import type { SVGProps } from "react";

export type IconName =
  | "book"
  | "bolt"
  | "chart"
  | "grid"
  | "trophy"
  | "settings"
  | "search"
  | "play"
  | "pause"
  | "chevron"
  | "lock"
  | "check"
  | "sparkles"
  | "menu"
  | "close"
  | "home"
  | "brain"
  | "user"
  | "flame"
  | "target";

const paths: Record<IconName, React.ReactNode> = {
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v15h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></>,
  bolt: <path d="m13 2-9 12h8l-1 8 9-12h-8z"/>,
  chart: <><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M12 13v5M8 21h8M6 6H3v2a4 4 0 0 0 4 4M18 6h3v2a4 4 0 0 1-4 4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3h4v.08a1.7 1.7 0 0 0 1.03 1.52 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.96 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  play: <path d="m9 7 8 5-8 5z"/>,
  pause: <><path d="M9 7v10M15 7v10"/></>,
  chevron: <path d="m8 10 4 4 4-4"/>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  brain: <><path d="M9.5 4.5A3 3 0 0 0 4 6.2a3 3 0 0 0 .4 5.6A3 3 0 0 0 7 17h2.5z"/><path d="M14.5 4.5A3 3 0 0 1 20 6.2a3 3 0 0 1-.4 5.6A3 3 0 0 1 17 17h-2.5zM9.5 8H7M14.5 8H17M9.5 13H7M14.5 13H17M12 4v16"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  flame: <path d="M12 22c4 0 7-3 7-7 0-3-2-6-5-9 0 3-2 4-3 4 0-3-1-6-3-8 0 5-3 7-3 12 0 5 3 8 7 8z"/>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
