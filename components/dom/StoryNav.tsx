"use client";
import { useScroll } from "@/store/useScroll";
import { CHAPTERS } from "@/lib/journey";
import { scrollToScene } from "@/lib/lenisBridge";
export function StoryNav() {
  const activeScene = useScroll((s) => s.active);
  const active = CHAPTERS.findIndex(chapter => chapter.anchor === activeScene);
  return <nav aria-label="Story chapters" className="story-nav" data-chapter={active}>
    <ol>{CHAPTERS.map((chapter, i) => <li key={chapter.anchor}>
      <button type="button" onClick={() => scrollToScene(`#${chapter.anchor}`)}
        aria-label={`${String(i + 1).padStart(2, "0")} ${chapter.label}`}
        aria-current={i === active ? "step" : undefined}>
        <span className="chapter-marker" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
        <span>{chapter.label}</span>
      </button>
    </li>)}</ol>
  </nav>;
}
