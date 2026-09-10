"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScroll } from "@/store/useScroll";
import { getLenis, destroyLenis } from "@/lib/lenisBridge";
import { TOTAL_SCROLL_VH } from "@/lib/beats";

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = getLenis();
    // Section heights, DOM navigation and the renderer use the same denominator.
    // Lenis.progress uses scrollHeight - innerHeight, which shifts every boundary.
    const sync = () => {
      const height = document.getElementById("arrival")?.offsetHeight || window.innerHeight;
      useScroll.getState().setScroll(window.scrollY / (height * TOTAL_SCROLL_VH / 100), lenis.velocity);
      ScrollTrigger.update();
    };
    const resize = () => { lenis.resize(); sync(); };
    lenis.on("scroll", sync);
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", resize);
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    sync();
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", resize);
      lenis.off("scroll", sync);
      gsap.ticker.remove(update);
      destroyLenis();
    };
  }, []);
  return <>{children}</>;
}
