/**
 * Quality tier resolution. This is where the previous attempt at this site
 * died: it gated features on userAgent sniffing and falsely detected LOW on
 * a capable desktop. The rule here is the opposite —
 *
 *   DEFAULT TO HIGH. Only step down on MEASURED evidence:
 *     - WebGL2 / float render targets are actually unavailable (checked once,
 *       synchronously, before first render — see supportsHighTierWebGL), or
 *     - sustained frame time is genuinely poor, measured after first paint
 *       (see the FPS probe in components/dom/QualityController.tsx).
 *   Never on userAgent string alone.
 *
 * `?quality=high|low|static` always wins over both of the above.
 */

export type Quality = "high" | "low" | "static";

const VALID: Quality[] = ["high", "low", "static"];

/** Reads the `?quality=` URL override. Null if absent or invalid. */
export function getQualityURLOverride(): Quality | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("quality");
  return raw && (VALID as string[]).includes(raw) ? (raw as Quality) : null;
}

/** Accessibility signal — always honored, independent of device capability. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hard capability check. Missing WebGL2 or float render target support is
 * measured evidence a device cannot run the HIGH-tier pipeline (transmission,
 * bloom), so — unlike the FPS probe — this is allowed to demote immediately
 * rather than waiting for a sustained sample.
 */
export function supportsHighTierWebGL(): boolean {
  if (typeof window === "undefined") return true; // resolved client-side before the first WebGL frame ever renders
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    return !!gl.getExtension("EXT_color_buffer_float");
  } catch {
    return false;
  }
}

/** Resolves the tier to start on, before any frame-time evidence exists. */
export function resolveInitialQuality(): Quality {
  const override = getQualityURLOverride();
  if (override) return override;
  if (prefersReducedMotion()) return "static";
  if (!supportsHighTierWebGL()) return "low";
  return "high"; // default — only the FPS probe may step this down later, see QualityController
}
