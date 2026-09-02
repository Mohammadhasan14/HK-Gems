"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getQualityURLOverride, prefersReducedMotion } from "@/lib/quality";
import { loaderBridge } from "@/lib/loader";
import { getLenis } from "@/lib/lenisBridge";

// How long the wordmark tracking opens (0 -> 0.3em) and the counter runs
// (0 -> 100), in seconds. Not scroll-driven — this is a one-time load/
// entrance sequence that plays before scroll is even relevant, so it's the
// one animation in the app allowed to run on a plain GSAP timeline instead
// of a scroll-scrubbed ScrollTrigger (every other ScrollTrigger in the app
// must be scrubbed — see the rule in ScrollProvider).
const COUNT_DURATION = 2.2;
const COLLAPSE_DURATION = 0.9;
const OVERLAY_FADE_DURATION = 0.5;

/**
 * Beat 1's loader. Runs once on mount: wordmark tracking opens 0 -> 0.3em
 * while a counter runs 0 -> 100, then the counter digits collapse toward
 * whatever screen position components/canvas/LightPoint.tsx is projecting
 * that frame (via lib/loader.ts) — the same mesh that then persists as the
 * stone's specular highlight. Because LightPoint is mounted and rendering
 * from the very first frame (not created when the loader finishes), the
 * digits are always collapsing toward a real, already-live point — this is
 * what makes the handoff a continuous object rather than a timed crossfade
 * between a DOM element and a WebGL one.
 *
 * Locks scroll (via lib/lenisBridge.ts) for the duration, since this is a
 * one-time entrance sequence, not part of the scroll-driven site — control
 * is handed back to Lenis the moment it completes.
 */
export function Loader() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  // Computed once, synchronously, independent of components/dom/
  // QualityController.tsx's own async resolution — that component's tier
  // only reaches this component through a store update one render late,
  // which would either delay this decision or force starting the animated
  // timeline and immediately killing it. Reduced-motion and the ?quality=
  // override are both synchronously readable, so there's no reason to wait.
  const [skipAnimation] = useState(
    () => getQualityURLOverride() === "static" || prefersReducedMotion(),
  );

  // useLayoutEffect (not useEffect) specifically so the STATIC/reduced-
  // motion branch can flip `done` before the browser paints — otherwise
  // that first frame briefly renders the un-animated loader overlay before
  // instantly unmounting it. The animated branch doesn't need this, but
  // there's no reason for it to differ.
  useLayoutEffect(() => {
    if (skipAnimation) {
      loaderBridge.progress = 1;
      setDone(true);
      return;
    }

    const lenis = getLenis();
    lenis.stop();

    const counterState = { value: 0 };
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        lenis.start();
        setDone(true);
      },
    });

    tl.to(
      wordmarkRef.current,
      { letterSpacing: "0.3em", duration: COUNT_DURATION },
      0,
    );

    tl.to(
      counterState,
      {
        value: 100,
        duration: COUNT_DURATION,
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = String(
              Math.round(counterState.value),
            ).padStart(3, "0");
          }
        },
      },
      0,
    );

    // Pin the counter to its current screen position with `fixed` +
    // percentage centring right before collapsing it, so the collapse tween
    // can animate plain `left`/`top` pixels straight to
    // loaderBridge.screenX/Y instead of fighting normal document flow.
    tl.call(() => {
      const el = counterRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      gsap.set(el, {
        position: "fixed",
        left: rect.left + rect.width / 2,
        top: rect.top + rect.height / 2,
        xPercent: -50,
        yPercent: -50,
      });
    });

    tl.to(counterRef.current, {
      // Function values are read once, when this tween starts — by then
      // LightPoint (mounted from frame 1) has written several frames of
      // real screen coordinates. Fall back to a fixed point near the key
      // light's on-screen side on the off chance it hasn't yet, so a
      // pathologically slow first WebGL frame can't send the digits to the
      // (0, 0) default in lib/loader.ts instead.
      left: () =>
        loaderBridge.ready ? loaderBridge.screenX : window.innerWidth * 0.58,
      top: () =>
        loaderBridge.ready ? loaderBridge.screenY : window.innerHeight * 0.42,
      scale: 0.06,
      opacity: 0,
      duration: COLLAPSE_DURATION,
      ease: "power3.in",
      onUpdate: function onUpdate(this: gsap.core.Tween) {
        loaderBridge.progress = this.progress();
      },
      onComplete: () => {
        loaderBridge.progress = 1;
      },
    });

    tl.to(
      overlayRef.current,
      { opacity: 0, duration: OVERLAY_FADE_DURATION },
      `>-${OVERLAY_FADE_DURATION * 0.6}`,
    );

    return () => {
      tl.kill();
      lenis.start();
    };
  }, [skipAnimation]);

  if (done) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08080A]"
      aria-hidden="true"
    >
      <span
        ref={wordmarkRef}
        style={{ letterSpacing: "0em" }}
        className="font-sans text-sm font-light uppercase text-[#C9A227]"
      >
        HK Gems
      </span>
      <span
        ref={counterRef}
        className="mt-6 font-mono text-xs tabular-nums text-white/40"
      >
        000
      </span>
    </div>
  );
}
