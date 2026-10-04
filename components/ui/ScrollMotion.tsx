"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Progressive enhancement: content stays visible if motion or JS is unavailable. */
export function ScrollMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const container = root.current;
    if (!container || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const animations = new Map<Element, Animation>();

    const configure = () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      if (preference.matches) return;

      const offsets = new WeakMap<Element, number>();
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            offsets.set(entry.target, entry.boundingClientRect.bottom <= 0 ? -24 : 24);
            return;
          }
          animations.get(entry.target)?.cancel();
          const animation = entry.target.animate([
            { opacity: 0.35, translate: `0 ${offsets.get(entry.target) ?? 24}px` },
            { opacity: 1, translate: "0 0" },
          ], { duration: 580, easing: "cubic-bezier(.2,.7,.2,1)" });
          animations.set(entry.target, animation);
          animation.onfinish = () => animations.delete(entry.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });

      container.querySelectorAll(
        ".page-heading, .adventure-hero-copy, .adventure-section-heading, .plan-workspace, .today-panel, .surface-card, .diagnosis-spotlight, .progress-hero, .profile-card, .insight-summary > article, [data-scroll-reveal]",
      ).forEach((element) => observer?.observe(element));
    };

    configure();
    preference.addEventListener("change", configure);
    return () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener("change", configure);
    };
  }, [pathname]);

  return <div ref={root} className="page-stage">{children}</div>;
}
