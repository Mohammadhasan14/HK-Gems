/**
 * Small shared constants read by more than one canvas component. Kept
 * separate from any one component (rather than, say, exported from
 * Scene.tsx) specifically to avoid circular imports — LightPoint needs the
 * key light's position and Scene renders LightPoint, so Scene exporting it
 * would create a cycle.
 */

/** Position of the scene's key spotlight (components/canvas/Scene.tsx). */
export const KEY_LIGHT_POSITION: [number, number, number] = [4, 6, 5];
