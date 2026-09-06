import type { ReactNode } from "react";
import { BEATS, type BeatId } from "@/lib/beats";

/**
 * Shared wrapper for every beat's DOM content. Height comes directly from
 * lib/beats.ts's `pinVh` — this is what actually produces the scroll
 * distance that progress/0-1 is measured against, so beats.ts stays the
 * single place pacing is tuned.
 *
 * No background color here on purpose: the persistent Canvas sits fixed
 * behind the whole page (components/canvas/CanvasRoot.tsx), and every beat
 * section needs to stay transparent for it to show through.
 */
export function BeatSection({
  id,
  className = "",
  children,
}: {
  id: BeatId;
  className?: string;
  children: ReactNode;
}) {
  const beat = BEATS.find((b) => b.id === id);
  if (!beat) throw new Error(`Unknown beat id: ${id}`);

  return (
    <section
      id={id}
      data-beat={id}
      style={{ minHeight: `${beat.pinVh}vh` }}
      // Left padding on lg clears the fixed journey rail
      // (components/dom/StoryNav.tsx); right padding clears the progress
      // hairline (components/dom/ScrollProgress.tsx). Applied here, once,
      // so every beat's text column stays out from under the chrome.
      className={`relative flex flex-col justify-center px-6 sm:px-10 sm:pr-20 lg:pl-44 ${className}`}
    >
      {children}
    </section>
  );
}
