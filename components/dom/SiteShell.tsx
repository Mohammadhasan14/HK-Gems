"use client";
import type { ReactNode } from "react";
import { ScrollProvider } from "./ScrollProvider";
export function SiteShell({ children }: { children: ReactNode }) {
  return <ScrollProvider>
    <main>{children}</main>
  </ScrollProvider>;
}
