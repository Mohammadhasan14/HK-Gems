"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "@/store/useScroll";
import { getQualityURLOverride, resolveInitialQuality } from "@/lib/quality";
import { hud } from "@/lib/hud";

// Let layout/paint settle before sampling frame times.
const PROBE_WARMUP_MS = 400;
// Sustained sample window — this is the whole point: one bad frame must
// never demote quality, only a genuinely poor average over real time.
const PROBE_WINDOW_MS = 1800;
const LOW_FPS_THRESHOLD = 42;

/**
 * Resolves the initial quality tier on mount, then runs a one-shot frame-time
 * probe to (maybe) step HIGH down to LOW on measured evidence — never on
 * userAgent alone. This is the fix for the previous attempt's core failure:
 * quality falsely reported LOW on a capable desktop and transmission/bloom/
 * particles never ran.
 *
 * Also keeps lib/hud.ts's live FPS reading current for the dev HUD, for as
 * long as the page is open (not just during the initial probe window).
 */
export function QualityController() {
  const probedRef = useRef(false);

  useEffect(() => {
    useScroll.getState().setQuality(resolveInitialQuality());
  }, []);

  useEffect(() => {
    let rafId: number;
    const start = performance.now();
    let last = start;
    let frames = 0;
    let sum = 0;

    function tick(now: number) {
      const delta = now - last;
      last = now;

      // Rolling FPS for the dev HUD — always on, independent of probing.
      hud.fps = hud.fps === 0 ? 1000 / delta : hud.fps * 0.9 + (1000 / delta) * 0.1;

      const elapsed = now - start;
      const probeEnd = PROBE_WARMUP_MS + PROBE_WINDOW_MS;

      if (!probedRef.current && elapsed > PROBE_WARMUP_MS && elapsed < probeEnd) {
        frames += 1;
        sum += delta;
      } else if (!probedRef.current && elapsed >= probeEnd) {
        probedRef.current = true;
        const state = useScroll.getState();
        // Only step HIGH down to LOW here. Never touch an explicit
        // ?quality= override or the accessibility STATIC tier.
        if (!getQualityURLOverride() && state.quality === "high" && frames > 0) {
          const avgFps = 1000 / (sum / frames);
          if (avgFps < LOW_FPS_THRESHOLD) {
            state.setQuality("low");
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return null;
}
