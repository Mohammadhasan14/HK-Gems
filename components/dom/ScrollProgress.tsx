"use client";
import { useEffect, useRef } from "react";
import { useScroll } from "@/store/useScroll";
import { CHAPTERS, chapterIndexForBeat } from "@/lib/journey";
import { BEATS } from "@/lib/beats";
const pad = (n: number) => String(n).padStart(2,"0");
export function ScrollProgress() {
  const beat = useScroll((s) => s.beat);
  const index = chapterIndexForBeat(beat);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const sync = () => {
      const state = useScroll.getState();
      const range = BEATS.find((b) => b.id === state.beat)!;
      const local = Math.max(0, Math.min(1, (state.progress - range.start) / (range.end - range.start)));
      if (ref.current) ref.current.style.top = `${local * 74}%`;
    };
    sync(); return useScroll.subscribe(sync);
  }, []);
  return <div className="scene-progress" data-active={beat} aria-hidden="true">
    <span>{pad(index)}</span><span className="progress-track"><span ref={ref} /></span>
    <span>{index === CHAPTERS.length - 1 ? "—" : pad(index + 1)}</span>
  </div>;
}
