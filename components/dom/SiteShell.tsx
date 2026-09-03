"use client";

import type { ReactNode } from "react";
import { CanvasRoot } from "@/components/canvas/CanvasRoot";
import { DevHud } from "@/components/hud/DevHud";
import { ScrollProvider } from "./ScrollProvider";
import { QualityController } from "./QualityController";
import { Header } from "./Header";
import { Loader } from "./Loader";
import { WornExposure } from "./WornExposure";

/**
 * Mounted once at the layout level (app/layout.tsx). Owns the persistent
 * Canvas, the scroll/quality wiring, and the fixed header — everything that
 * must exist exactly once and survive the whole scroll. `children` is the
 * per-route DOM beat content (app/page.tsx).
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <ScrollProvider>
      <CanvasRoot />
      <WornExposure />
      <QualityController />
      <Header />
      <main className="relative z-0">{children}</main>
      <Loader />
      <DevHud />
    </ScrollProvider>
  );
}
