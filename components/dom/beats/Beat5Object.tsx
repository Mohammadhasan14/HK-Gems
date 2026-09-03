"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BeatSection } from "../BeatSection";
import { HERO_STONE } from "@/lib/stones";
import { BEATS } from "@/lib/beats";
import { useScroll } from "@/store/useScroll";
import { facetAnchor } from "@/lib/facetAnchor";

const OBJECT = BEATS.find((b) => b.id === "object")!;

const SPEC_ROWS: Array<[string, string]> = [
  ["Stone", HERO_STONE.name],
  ["Origin", HERO_STONE.origin],
  ["Carat", HERO_STONE.carat ?? "—"],
  ["Metal", HERO_STONE.metal ?? "—"],
  ["Finish", HERO_STONE.finish ?? "—"],
];

/**
 * Beat 5 — The Object. Rows resolve one at a time (masked-opacity reveal
 * scrubbed via GSAP ScrollTrigger, same convention as Beat2Origin) against a
 * hairline gold rule projected from a facet edge of the hero stone
 * (lib/facetAnchor.ts, written every frame by HeroStone.tsx) to whichever
 * row is currently resolving. The line is updated imperatively via its own
 * rAF loop rather than React state, so it can track sub-pixel screen
 * positions every frame without re-rendering the row list.
 */
export function Beat5Object() {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<SVGLineElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = document.querySelector('[data-beat="object"]');
    const rows = rowRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (!section || rows.length === 0) return;

    gsap.set(rows, { opacity: 0.15 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: "top 75%", end: "bottom 60%", scrub: 1 },
    });
    tl.to(rows, { opacity: 1, stagger: 0.5, ease: "none" });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const line = lineRef.current;
      const { progress } = useScroll.getState();
      const inBeat = progress > OBJECT.start && progress < OBJECT.end;
      if (line && facetAnchor.ready && inBeat) {
        const local = (progress - OBJECT.start) / (OBJECT.end - OBJECT.start);
        const activeIndex = Math.min(
          SPEC_ROWS.length - 1,
          Math.floor(local * SPEC_ROWS.length),
        );
        const rowEl = rowRefs.current[activeIndex];
        if (rowEl) {
          const rect = rowEl.getBoundingClientRect();
          line.setAttribute("x1", String(facetAnchor.screenX));
          line.setAttribute("y1", String(facetAnchor.screenY));
          line.setAttribute("x2", String(rect.left));
          line.setAttribute("y2", String(rect.top + rect.height / 2));
          line.style.opacity = "0.7";
        }
      } else if (line) {
        line.style.opacity = "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <BeatSection id="object">
      <svg className="pointer-events-none fixed inset-0 z-30 h-full w-full" aria-hidden="true">
        <line
          ref={lineRef}
          stroke="#C9A227"
          strokeWidth={1}
          style={{ opacity: 0, transition: "opacity 0.3s" }}
        />
      </svg>
      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
        {HERO_STONE.name}
      </p>
      <p dir="rtl" lang="ur" className="mt-1 font-display text-lg text-white/50">
        {HERO_STONE.urduName}
      </p>
      <dl className="mt-8 max-w-sm space-y-2 font-sans text-xs uppercase tracking-[0.15em] text-white/70">
        {SPEC_ROWS.map(([label, value], i) => (
          <div
            key={label}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className="flex justify-between border-b border-white/10 pb-2"
          >
            <dt className="text-white/40">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </BeatSection>
  );
}
