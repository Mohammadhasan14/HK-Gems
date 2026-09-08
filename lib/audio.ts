/**
 * Whether the visitor wants sound. Read by the hero's sound control
 * (components/dom/HeroFooter.tsx).
 *
 * IMPORTANT — there is no audio bed in the site yet, so nothing currently
 * reads this besides the control itself. It exists so the preference has a
 * real home the moment one lands, rather than the toggle being a decoration
 * that lies about what it does. Defaults to OFF, which is the only
 * defensible default: audio that starts itself is hostile, and browsers
 * block autoplay anyway.
 *
 * Non-reactive on purpose, same as lib/hud.ts and lib/vitrine.ts — an audio
 * bed would read it inside a frame loop, not through React.
 */
export const audio = {
  /** TODO(audio): have the ambient bed observe this once it exists. */
  enabled: false,
};
