"use client";

import { useEffect, useState } from "react";
import { useScroll } from "@/store/useScroll";
import { hud } from "@/lib/hud";
import { BEATS } from "@/lib/beats";
import { getQualityURLOverride } from "@/lib/quality";

/**
 * Dev HUD — press `d` to toggle. Shows scroll progress, current beat,
 * active quality tier, FPS, and camera position, so it's possible to see
 * why something is wrong without reading source (per the brief).
 */
export function DevHud() {
  const [visible, setVisible] = useState(false);
  const [, forceTick] = useState(0);
  const progress = useScroll((s) => s.progress);
  const beatId = useScroll((s) => s.beat);
  const quality = useScroll((s) => s.quality);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "d" || e.key === "D") setVisible((v) => !v);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // hud.fps / hud.cameraPosition update every rendered frame outside React
  // (see lib/hud.ts) — poll them at a low, UI-appropriate rate instead of
  // subscribing to something that changes 60x/sec.
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => forceTick((t) => t + 1), 150);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const beatName = BEATS.find((b) => b.id === beatId)?.name ?? beatId;
  const probe = hud.qualityProbe;
  // The probe is intentionally skipped (never "pending") when quality was
  // already decided by ?quality= or STATIC — say so, rather than showing a
  // "pending…" that would never resolve.
  const probeSkipped = getQualityURLOverride() !== null || quality === "static";

  return (
    <div
      className="fixed bottom-3 left-3 z-50 w-72 select-none rounded border border-white/10 bg-black/80 p-3 font-mono text-[11px] leading-relaxed text-[#C9A227] backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="mb-1 text-white/50">DEV HUD — press d to hide</div>
      <div>progress&nbsp;&nbsp;{progress.toFixed(3)}</div>
      <div>beat&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{beatName}</div>
      <div>quality&nbsp;&nbsp;&nbsp;{quality}</div>
      <div>fps&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{hud.fps.toFixed(0)}</div>
      <div>
        camera&nbsp;&nbsp;&nbsp;{hud.cameraPosition.x.toFixed(2)},{" "}
        {hud.cameraPosition.y.toFixed(2)}, {hud.cameraPosition.z.toFixed(2)}
      </div>
      <div className="mt-1 border-t border-white/10 pt-1 text-white/60">
        probe&nbsp;&nbsp;&nbsp;&nbsp;
        {probe
          ? `${probe.avgFps.toFixed(1)}fps / ${probe.sampledFrames}f -> ${
              probe.demoted
                ? "DEMOTED"
                : probe.belowThreshold
                  ? "ok (below thr, override held)"
                  : "ok"
            } (thr ${probe.thresholdFps})`
          : probeSkipped
            ? "skipped (override/static)"
            : "pending…"}
      </div>
    </div>
  );
}
