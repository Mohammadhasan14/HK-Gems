"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { SCENES } from "@/lib/journey";
import { copyOpacity } from "@/lib/sceneTimeline";
import { useScroll } from "@/store/useScroll";
export function BeatSection({ index, children }: { index: number; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const sync = () => {
      if (!ref.current) return;
      const { scene, reducedMotion } = useScroll.getState();
      const opacity = copyOpacity(scene, index);
      ref.current.style.opacity = String(opacity);
      ref.current.style.visibility = opacity > .001 ? "visible" : "hidden";
      ref.current.inert = opacity < .5;
      ref.current.style.translate = reducedMotion ? "none" : `0 ${(index - scene) * 8}px`;
    };
    sync(); return useScroll.subscribe(sync);
  }, [index]);
  return <section ref={ref} data-scene={SCENES[index].id}
    className={`scene-copy-frame ${index === 0 ? "hero-copy" : ""}`}
    aria-labelledby={`${SCENES[index].id}-title`}
    style={{ visibility: index === 0 ? "visible" : "hidden" }}>{children}</section>;
}
