"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "@/store/useScroll";
import { getQualityURLOverride, resolveInitialQuality } from "@/lib/quality";
import { hud } from "@/lib/hud";

// Real-world load jank — hydration, web font swap, first shader compile —
// can spike well past a second. Wait this long after mount before sampling
// anything, so a cold-start hitch can never factor into the decision.
const PROBE_WARMUP_MS = 800;
// Sustained sample window, in real elapsed time (not frame count), measured
// from when sampling actually starts (see the state machine below) — not
// from mount. A device slow enough that its first animation frame doesn't
// land for several seconds is exactly the case this probe exists to catch;
// anchoring the window to mount time would let a slow-starting device skip
// the window before a single sample was taken. Long enough that a one-off
// GC pause or tab-switch stall can't dominate the read; short enough to
// resolve before the user has scrolled far.
const PROBE_WINDOW_MS = 2500;
// Trim the slowest frames before averaging. A single 300ms hitch inside an
// otherwise-60fps window must never trigger a demotion on its own — only a
// window that's broadly, sustainedly slow should. This is what "ignore
// load-time hitches" means in practice: outlier frames are discarded, not
// just diluted into a mean.
const TRIM_FRACTION = 0.15;
const LOW_FPS_THRESHOLD = 42;

type ProbePhase = "warmup" | "sampling" | "done";

/**
 * Resolves the initial quality tier on mount, then runs exactly ONE
 * sustained frame-time probe to (maybe) step HIGH down to LOW. This is the
 * fix for the previous attempt's core failure: quality falsely reported LOW
 * on a capable desktop and transmission/bloom/particles never ran.
 *
 * Deliberately one-shot and one-directional:
 *   - `probedRef` latches after the single evaluation below — the probe
 *     never re-runs, so quality can never oscillate mid-scroll.
 *   - It can only ever move HIGH -> LOW. There is no auto-promotion back to
 *     HIGH; if a device measures poor once, it stays on the LOW-tier
 *     staging for the rest of the session rather than flickering between
 *     the two as frame time recovers (e.g. once heavy Phase-1 geometry
 *     finishes loading).
 *   - Skipped entirely if an explicit ?quality= override or the
 *     accessibility STATIC tier is already active — this can only touch a
 *     tier that started as the un-overridden HIGH default.
 *
 * The measured result — average fps, frame count, threshold, verdict — is
 * written to lib/hud.ts so the dev HUD shows exactly what the probe saw,
 * not just which tier it landed on.
 */
export function QualityController() {
  const probedRef = useRef(false);

  useEffect(() => {
    const initial = resolveInitialQuality();
    useScroll.getState().setQuality(initial);
    // Nothing to probe for — either an explicit override or STATIC already
    // decided the tier, and the probe must never touch either.
    if (initial !== "high") probedRef.current = true;
  }, []);

  useEffect(() => {
    if (probedRef.current) return; // override/STATIC already handled above

    let rafId: number;
    const mountTime = performance.now();
    let last = mountTime;
    let phase: ProbePhase = "warmup";
    let sampleStart = 0;
    const deltas: number[] = [];

    function finalize() {
      const sorted = [...deltas].sort((a, b) => a - b);
      const trimCount = Math.floor(sorted.length * TRIM_FRACTION);
      // Trim from the slow end only (largest deltas = slowest frames) — a
      // few long-tail hitches get discarded, but a broadly slow window
      // still reads as slow.
      const trimmed = sorted.slice(0, sorted.length - trimCount);
      const avgDelta = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
      const avgFps = 1000 / avgDelta;
      const belowThreshold = avgFps < LOW_FPS_THRESHOLD;
      const demoted =
        belowThreshold &&
        !getQualityURLOverride() &&
        useScroll.getState().quality === "high";

      hud.qualityProbe = {
        avgFps,
        sampledFrames: deltas.length,
        thresholdFps: LOW_FPS_THRESHOLD,
        belowThreshold,
        demoted,
      };

      if (demoted) useScroll.getState().setQuality("low");
    }

    function tick(now: number) {
      const delta = now - last;
      last = now;

      // Live rolling FPS for the HUD — always on, independent of probing.
      hud.fps = hud.fps === 0 ? 1000 / delta : hud.fps * 0.9 + (1000 / delta) * 0.1;

      if (phase === "warmup" && now - mountTime > PROBE_WARMUP_MS) {
        // Start the sampling clock now, whenever warmup actually finishes —
        // not at a fixed offset from mount. A tab that took 6s to deliver
        // its first animation frame still gets a full, real WINDOW_MS of
        // samples instead of the window being silently skipped.
        phase = "sampling";
        sampleStart = now;
      } else if (phase === "sampling") {
        deltas.push(delta);
        if (now - sampleStart >= PROBE_WINDOW_MS) {
          finalize();
          phase = "done";
          probedRef.current = true;
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return null;
}
