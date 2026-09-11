"use client";
import { useScroll } from "@/store/useScroll";
import { CHAPTERS } from "@/lib/journey";
import { scrollToScene } from "@/lib/lenisBridge";
export function StoryNav() {
  const phase = useScroll((s) => s.scene);
  const active = phase < .5 ? 0 : phase < 1.5 ? 1 : phase < 3.5 ? 2 : 3;
  return <nav aria-label="Story chapters" className="story-nav" data-chapter={active}>
    <ol>{CHAPTERS.map((chapter, i) => <li key={chapter.anchor}>
      <button type="button" onClick={() => scrollToScene(`#${chapter.anchor}`)}
        aria-label={`${String(i + 1).padStart(2, "0")} ${chapter.label}`}
        aria-current={i === active ? "step" : undefined}>
        <span className="chapter-marker" aria-hidden="true" />
        <span><small>{String(i + 1).padStart(2, "0")}</small>{chapter.label}</span>
      </button>
    </li>)}</ol>
  </nav>;
}
