"use client";
import type { ReactNode } from "react";
import { CanvasRoot } from "@/components/canvas/CanvasRoot";
import { ScrollProvider } from "./ScrollProvider";
export function SiteShell({ children }: { children: ReactNode }) {
  return <ScrollProvider>
    <CanvasRoot /><div className="scene-vignette" aria-hidden="true" />
    <main>{children}</main>
  </ScrollProvider>;
}
