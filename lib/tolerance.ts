import { BEATS } from "./beats";

const TOLERANCE = BEATS.find((b) => b.id === "tolerance")!;

const START_MM = 12;
const TARGET_MM = 0.4;
// Exponential decay rate — chosen so the asymptotic value is already within
// ~0.03mm of TARGET_MM by SNAP_AT, making the guarded snap read as a small
// final correction rather than a jarring jump.
const DECAY_K = 6;
// The final 2% of the beat's own scroll range is where the guarded snap
// happens — the readout jumps directly to TARGET_MM instead of continuing
// the exponential approach, which mathematically never quite reaches it.
const SNAP_AT = 0.98;

function localProgress(progress: number): number | null {
  if (progress <= TOLERANCE.start) return 0;
  if (progress >= TOLERANCE.end) return 1;
  return (progress - TOLERANCE.start) / (TOLERANCE.end - TOLERANCE.start);
}

/**
 * Millimetre readout for Beat 4 — Tolerance: 12mm asymptotically closing
 * toward 0.4mm as scroll crosses the beat, then a guarded snap to exactly
 * 0.4mm in the final 2%. Used by Beat4Tolerance.tsx's live readout.
 */
export function toleranceValueMm(progress: number): number {
  const local = localProgress(progress);
  if (local === null || local <= 0) return START_MM;
  if (local >= SNAP_AT) return TARGET_MM;
  return TARGET_MM + (START_MM - TARGET_MM) * Math.exp(-DECAY_K * local);
}

/**
 * 1 (fully exploded) -> 0 (fully closed) gap fraction, driven by the same
 * decay curve as toleranceValueMm so components/canvas/BezelAssembly.tsx's
 * parts visually converge in lockstep with the numeric readout rather than
 * being independently tuned.
 */
export function toleranceGapFraction(progress: number): number {
  const local = localProgress(progress);
  if (local === null || local <= 0) return 1;
  if (local >= SNAP_AT) return 0;
  return Math.exp(-DECAY_K * local);
}
