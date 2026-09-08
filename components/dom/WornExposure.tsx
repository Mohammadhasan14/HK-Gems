"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "@/store/useScroll";
import { exposureOpacity } from "@/lib/worn";

/**
 * Beat 6's "the 3D exits by overexposing to warm white" — a fixed
 * full-viewport wash between the persistent Canvas (z-0, CanvasRoot.tsx)
 * and the DOM text layer, opacity driven by scroll position within Worn
 * only. DOM-based rather than a real bloom/exposure postprocess pass
 * specifically so it costs the same (near nothing) on every quality tier —
 * this beat's read must survive LOW tier exactly as well as HIGH.
 *
 * Same z-0 + DOM-order stacking as CanvasRoot.tsx (not a higher z-index):
 * this renders between CanvasRoot and `<main>` in SiteShell.tsx, so at
 * equal z-index it paints above the canvas but still below the beat text —
 * a literal z-index above 0 would paint over the text instead.
 *
 * Beat6Worn.tsx's headline keeps a dark text-shadow so it stays legible
 * once the wash is bright, rather than needing a scroll-synced color swap.
 */
export function WornExposure() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (overlayRef.current) {
        const { progress } = useScroll.getState();
        overlayRef.current.style.opacity = String(exposureOpacity(progress));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-0 bg-[#fff4dd] opacity-0"
      aria-hidden="true"
    />
  );
}
