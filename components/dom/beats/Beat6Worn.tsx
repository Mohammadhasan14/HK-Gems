"use client";

import { useEffect, useRef } from "react";
import { BeatSection } from "../BeatSection";
import { BeatCopy } from "../BeatCopy";
import { chapterForBeat } from "@/lib/journey";
import { useScroll } from "@/store/useScroll";
import { exposureOpacity } from "@/lib/worn";

const CHAPTER = chapterForBeat("worn");

/** Copy colour at each end of the wash: light on the dark set, dark on it. */
const INK_DARK_SET = [245, 241, 232];
const INK_LIT_SET = [42, 33, 24];
const MUTED_MIX = 0.42;

function ink(t: number, muted: boolean): string {
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  const [r, g, b] = [0, 1, 2].map((i) => mix(INK_DARK_SET[i], INK_LIT_SET[i]));
  // Muted copy is the same ink at reduced contrast, rather than a second
  // colour — so eyebrow and body track the headline through the wash.
  return `rgba(${r}, ${g}, ${b}, ${muted ? 1 - MUTED_MIX : 1})`;
}

/**
 * Beat 6 — Worn. The 3D exits by overexposing to warm white
 * (components/dom/WornExposure.tsx); a photographic plate is what remains
 * once that lands.
 *
 * This is the only beat whose BACKGROUND inverts underneath its own copy:
 * it starts on the near-black set and ends on a full warm-white wash. A
 * fixed text colour cannot survive that — light copy reads at the start of
 * the beat and disappears completely by the end of it, which is exactly what
 * it did. So the ink is driven off the same curve as the wash (lib/worn.ts),
 * lerping from near-white to a dark warm brown as the frame blows out.
 *
 * Written to CSS custom properties from an rAF loop reading live scroll
 * state each frame, rather than through React state — same convention as
 * Beat4Tolerance and Beat5Object, and for the same reason: this changes
 * every frame and must not re-render the tree.
 */
export function Beat6Worn() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const t = exposureOpacity(useScroll.getState().progress);
        el.style.setProperty("--beat-ink", ink(t, false));
        el.style.setProperty("--beat-ink-muted", ink(t, true));
        // The shadow is what carries the copy through the MIDDLE of the
        // transition, where the wash is half-up and neither ink is high
        // contrast. It fades out as the wash completes, since a dark halo
        // on dark text over a light ground would only muddy it.
        el.style.setProperty(
          "--beat-ink-shadow",
          `0 2px 20px rgba(0,0,0,${(0.65 * (1 - t)).toFixed(3)})`,
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <BeatSection id="worn" align="top">
      {/* TODO(design): real photographic hand plate, ~2400x3000, warm-white
          grade matching the exposure wash this beat cuts to. */}
      <div ref={ref} style={{ textShadow: "var(--beat-ink-shadow)" }}>
        <BeatCopy
          eyebrow={CHAPTER.eyebrow}
          roman="Worn,"
          italic="not displayed."
          tone="adaptive"
          lines={["Made to be lived in.", "Not kept behind glass."]}
        >
          {/* TODO(product): needs a real enquiry destination — there is no
              #enquire section, so this anchor currently goes nowhere. */}
          <a
            href="#enquire"
            className="mt-9 inline-block border border-[#8a6d1f]/50 px-7 py-3 font-sans text-[10px] uppercase tracking-[0.3em] text-[color:var(--beat-ink)] transition-colors duration-300 hover:border-[#8a6d1f]"
          >
            Enquire
          </a>
        </BeatCopy>
      </div>
    </BeatSection>
  );
}
