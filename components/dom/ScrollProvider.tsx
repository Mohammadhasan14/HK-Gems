"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScroll } from "@/store/useScroll";
import { getLenis, destroyLenis } from "@/lib/lenisBridge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Wires Lenis (smooth scroll) into the one Zustand scroll store, and shares
 * a single frame clock between Lenis and GSAP/ScrollTrigger.
 *
 * Lenis animates the real window scroll position (it's not a virtual
 * wrapper), so ScrollTrigger just needs `ScrollTrigger.update()` called on
 * every Lenis tick — no scrollerProxy required.
 *
 * Every ScrollTrigger created elsewhere in the app should run with
 * `scrub: 1` (or similar) to match this lag, per the brief: "Scroll is the
 * only clock. Nothing on a timer."
 *
 * Lenis itself is created lazily via lib/lenisBridge.ts's getLenis(), not
 * here directly — components/dom/Loader.tsx (a child of this component)
 * may need to stop scroll before this effect has even run, since child
 * effects fire before parent effects on mount. getLenis() lets whichever of
 * the two runs first do the actual construction.
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = getLenis();

    const onScroll = ({
      progress,
      velocity,
    }: {
      progress: number;
      velocity: number;
    }) => {
      useScroll.getState().setScroll(progress, velocity);
    };
    lenis.on("scroll", onScroll);
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from gsap.ticker (rather than its own rAF loop) so scroll
    // and every GSAP-driven animation share one clock.
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
