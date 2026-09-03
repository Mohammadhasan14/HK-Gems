/**
 * Non-reactive bridge for the hero stone's screen-projected "facet edge"
 * anchor point, written every frame by components/canvas/HeroStone.tsx and
 * read by components/dom/beats/Beat5Object.tsx to draw its hairline gold
 * rule from the stone to whichever spec row is currently resolving.
 * Same pattern as lib/loader.ts's loaderBridge — routing this through the
 * Zustand store would re-render every subscriber at 60fps for no reason.
 */
export const facetAnchor = {
  screenX: 0,
  screenY: 0,
  /** True once HeroStone has rendered at least one frame and screenX/Y are meaningful. */
  ready: false,
};
