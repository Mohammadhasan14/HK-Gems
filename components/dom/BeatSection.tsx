import type { ReactNode } from "react";
import { BEATS, type BeatId } from "@/lib/beats";

/**
 * Shared wrapper for every beat's DOM content. Height comes directly from
 * lib/beats.ts's `pinVh` — this is what actually produces the scroll
 * distance that progress/0-1 is measured against, so beats.ts stays the
 * single place pacing is tuned.
 *
 * The copy is STICKY inside that height, held one viewport tall and centred.
 * That is the difference between a scene and a passing caption: the beats
 * are long on purpose (The Cut runs 260vh so the carve has room to read),
 * and statically-placed copy scrolls out of frame within the first third,
 * leaving the rest of the beat as a silent object with nothing naming it.
 * Sticky copy holds while the stone changes underneath it, which is what
 * the art direction is doing — one statement per scene, present for the
 * whole scene.
 *
 * No background colour here on purpose: the persistent Canvas sits fixed
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
   * Where the copy sits within the viewport. "top" keeps it in the upper
   * part on NARROW viewports only, reverting to centred from `sm` up. On a
   * phone the canvas has no free column beside the stone the way a desktop
   * window does, so centred copy lands on top of it; stacking type above the
   * stone is the mobile composition rather than a shrunk desktop one.
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
      className="relative"
    >
      <div
        // Left padding on lg clears the fixed journey rail
        // (components/dom/StoryNav.tsx) and sets the copy column on the same
        // vertical the art direction uses — roughly 15% in, far enough from
        // the rail to read as its own column rather than as the rail's
        // captions. Right padding clears the progress hairline.
        className={`sticky top-0 flex min-h-screen flex-col px-6 sm:px-10 sm:pr-24 lg:pl-[15%] ${
          align === "top"
            ? "justify-start pt-28 sm:justify-center sm:pt-0"
            : "justify-center"
        } ${className}`}
      >
        {children}
      </div>
    </section>
  );
}
