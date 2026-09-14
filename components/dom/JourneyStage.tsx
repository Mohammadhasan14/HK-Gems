"use client";
import type { ReactNode } from "react";
import { CanvasRoot } from "@/components/canvas/CanvasRoot";
import { SCENES } from "@/lib/journey";
import { StoryNav } from "./StoryNav";

/** One native sticky composition. Its containing block ends before the footer,
 * so the canvas, navigation and final copy leave the screen together. */
export function JourneyStage({ children }: { children: ReactNode }) {
  return <div className="journey-range">
    <div className="journey-stage">
      <CanvasRoot /><div className="scene-vignette" aria-hidden="true" />
      {children}<StoryNav />
    </div>
    <div className="journey-stops" aria-hidden="true">
      {SCENES.map(scene => <div key={scene.id} id={scene.id} className="journey-section" />)}
    </div>
  </div>;
}
