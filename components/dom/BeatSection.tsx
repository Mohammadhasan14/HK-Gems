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
  align = "center",
  children,
}: {
  id: BeatId;
  className?: string;
  /**
   * Where the copy sits in the section's own height. "top" keeps the text
   * in the upper part of the frame on NARROW viewports only, reverting to
   * centred from `sm` up. On a phone the canvas has no free column beside
   * the stone the way a desktop window does, so centred copy lands directly
   * on top of it; stacking type above the stone is the mobile composition
   * rather than a shrunk copy of the desktop one.
   */
  align?: "center" | "top";
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
      className={`relative flex flex-col px-6 sm:px-10 sm:pr-20 lg:pl-44 ${
        align === "top"
          ? "justify-start pt-28 sm:justify-center sm:pt-0"
          : "justify-center"
      } ${className}`}
    >
      {children}
    </section>
  );
}
