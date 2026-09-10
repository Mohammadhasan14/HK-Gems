"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { BEATS, type BeatId } from "@/lib/beats";
import { SCENE_IDS, copyOpacity } from "@/lib/sceneTimeline";
import { useScroll } from "@/store/useScroll";

export function BeatSection({ id, className = "", children }: {
  id: BeatId; className?: string; align?: "center" | "top"; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const index = SCENE_IDS.findIndex((scene) => scene === id);
  const beat = BEATS.find((b) => b.id === id)!;
  useEffect(() => {
    if (index < 0) return;
    const sync = () => {
      if (!ref.current) return;
      const phase = useScroll.getState().scene;
      const opacity = copyOpacity(phase, index);
      ref.current.style.opacity = String(opacity);
      ref.current.style.visibility = opacity > 0.001 ? "visible" : "hidden";
      ref.current.inert = opacity < 0.5;
      ref.current.style.translate = `0 ${(index - phase) * 12}px`;
    };
    sync();
    return useScroll.subscribe(sync);
  }, [index]);
  return (
    <section id={id} data-beat={id} className={`beat-section ${index >= 0 ? "reference-scene" : "later-scene"}`} style={{ minHeight: `${beat.pinVh}svh` }}>
      <div ref={ref} className={`${index >= 0 ? "scene-copy-frame" : "later-copy-frame"} ${id === "arrival" ? "hero-copy" : ""} ${className}`}
        style={index >= 0 ? { visibility: index === 0 ? "visible" : "hidden" } : undefined}>
        {children}
      </div>
    </section>
  );
}
