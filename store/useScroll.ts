import { create } from "zustand";
import { getBeatAt, type BeatId } from "@/lib/beats";
import type { Quality } from "@/lib/quality";

/**
 * The one scroll store. Lenis writes progress/velocity (via ScrollProvider);
 * QualityController writes quality. Every scene and every DOM beat reads
 * from here — nothing else owns scroll state, per the architecture rules.
 */
interface ScrollStore {
  /** 0-1, raw Lenis progress for the whole document. */
  progress: number;
  /** Signed scroll velocity from Lenis, px/frame. */
  velocity: number;
  /** Derived from progress via lib/beats.ts — never set directly. */
  beat: BeatId;
  quality: Quality;
  setScroll: (progress: number, velocity: number) => void;
  setQuality: (quality: Quality) => void;
}

export const useScroll = create<ScrollStore>((set) => ({
  progress: 0,
  velocity: 0,
  beat: "arrival",
  // SSR-safe default. QualityController resolves the real tier on mount —
  // this is "high" and not "unknown" specifically so nothing has to wait
  // for that resolution to start assuming capability (default-to-HIGH rule).
  quality: "high",
  setScroll: (progress, velocity) =>
    set({ progress, velocity, beat: getBeatAt(progress).id }),
  setQuality: (quality) => set({ quality }),
}));
