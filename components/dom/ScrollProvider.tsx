"use client";
import { useEffect } from "react";
import { useScroll } from "@/store/useScroll";
import { getLenis, destroyLenis, scrollToScene } from "@/lib/lenisBridge";
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = getLenis();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const height = document.getElementById("earth")?.offsetHeight || window.innerHeight;
      useScroll.getState().setScroll(window.scrollY / height, media.matches);
    };
    let previousHeight = document.getElementById("earth")?.offsetHeight || window.innerHeight;
    const resize = () => {
      const height = document.getElementById("earth")?.offsetHeight || window.innerHeight;
      const position = window.scrollY / previousHeight;
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
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("click", anchor);
    media.addEventListener("change", motion);
    sync();
    return () => {
      cancelAnimationFrame(frame); lenis.off("scroll", sync);
      window.removeEventListener("scroll", sync); window.removeEventListener("resize", resize);
      document.removeEventListener("click", anchor); media.removeEventListener("change", motion);
      destroyLenis();
    };
  }, []);
  return <>{children}</>;
}
