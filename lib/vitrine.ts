/**
 * Non-reactive bridge for Beat 7's vitrine turntable — which stone (index
 * into lib/stones.ts's COLLECTION_ORDER) is currently facing "front",
 * written every frame by components/canvas/Vitrine.tsx and read by
 * components/dom/beats/Beat7Collection.tsx to highlight the matching
 * placard. Same pattern as loaderBridge/facetAnchor: routing this through
 * the Zustand store would re-render the placard list at scroll-tick
 * frequency for no reason.
 */
export const vitrine = {
  activeIndex: 0,
};
