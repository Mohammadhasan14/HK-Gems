"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScroll } from "@/store/useScroll";

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
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ({ progress, velocity }: { progress: number; velocity: number }) => {
      useScroll.getState().setScroll(progress, velocity);
    });
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from gsap.ticker (rather than its own rAF loop) so scroll
    // and every GSAP-driven animation share one clock.
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
