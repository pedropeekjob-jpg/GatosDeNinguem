"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** What fades in as it scrolls into view: page sections, cards and the shelter carousel. */
const TARGETS = "main .gn-section, main .gn-card, main .gn-carousel, main [data-reveal]";

/**
 * Gentle fade-and-rise for content below the fold. Only content that starts out of view is
 * touched, so nothing is ever hidden without JavaScript, and nothing moves for people who
 * ask their device for reduced motion.
 */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("reveal--in");
          observer.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    const below = [...document.querySelectorAll<HTMLElement>(TARGETS)].filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    // Cards side by side arrive one after the other.
    below.forEach((el) => {
      const siblings = el.parentElement ? [...el.parentElement.children] : [];
      if (el.classList.contains("gn-card")) el.style.setProperty("--reveal-delay", `${Math.min(siblings.indexOf(el) % 3, 2) * 80}ms`);
      el.classList.add("reveal");
      observer.observe(el);
    });
    return () => {
      observer.disconnect();
      below.forEach((el) => el.classList.remove("reveal", "reveal--in"));
    };
  }, [pathname]);
  return null;
}
