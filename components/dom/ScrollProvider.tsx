"use client";
import { useEffect } from "react";
import { useScroll } from "@/store/useScroll";
import { getLenis, destroyLenis, scrollToScene } from "@/lib/lenisBridge";
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = getLenis();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let previousHeight = document.getElementById("earth")?.offsetHeight || window.innerHeight;
    let viewportPosition = window.scrollY / previousHeight;
    // Lenis forwards native scrolling too. Its fractional position avoids
    // competing integer window-scroll updates during a smoothed wheel gesture.
    const sync = () => {
      const height = document.getElementById("earth")?.offsetHeight || window.innerHeight;
      // A smaller viewport can clamp native scroll before the resize event.
      // Keep the last valid chapter position until resize has restored it.
      if (height !== previousHeight) return;
      viewportPosition = lenis.animatedScroll / height;
      useScroll.getState().setScroll(viewportPosition, media.matches);
    };
    const resize = () => {
      const height = document.getElementById("earth")?.offsetHeight || window.innerHeight;
      const position = viewportPosition;
      previousHeight = height;
      lenis.resize(); lenis.scrollTo(position * height, { immediate: true }); sync();
    };
    const motion = () => { lenis.options.smoothWheel = !media.matches; sync(); };
    const anchor = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const href = link?.getAttribute("href");
      if (!href || !document.getElementById(href.slice(1))) return;
      event.preventDefault(); scrollToScene(href);
      history.replaceState(null, "", href);
    };
    let frame: number;
    const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf); };
    frame = requestAnimationFrame(raf);
    lenis.on("scroll", sync);
    window.addEventListener("resize", resize);
    document.addEventListener("click", anchor);
    media.addEventListener("change", motion);
    sync();
    return () => {
      cancelAnimationFrame(frame); lenis.off("scroll", sync);
      window.removeEventListener("resize", resize);
      document.removeEventListener("click", anchor); media.removeEventListener("change", motion);
      destroyLenis();
    };
  }, []);
  return <>{children}</>;
}
