"use client";
import { useScroll } from "@/store/useScroll";
import { CHAPTERS, chapterIndexForBeat } from "@/lib/journey";
import { getLenis } from "@/lib/lenisBridge";
export function StoryNav() {
  const beat = useScroll((s) => s.beat);
  const activeIndex = chapterIndexForBeat(beat);
  return <nav aria-label="Story chapters" className="story-nav" data-active={beat}>
    <ol>{CHAPTERS.map((chapter, i) => <li key={chapter.anchor}>
      <button type="button" onClick={() => getLenis().scrollTo(`#${chapter.anchor}`, { duration: 1.1 })}
        aria-label={`${chapter.number} ${chapter.label}`}
        aria-current={i === activeIndex ? "step" : undefined}>
        <span className="chapter-marker">{chapter.number}</span><span>{chapter.label}</span>
      </button>
    </li>)}</ol>
  </nav>;
}
