import { create } from "zustand";
import { scenePhase } from "@/lib/sceneTimeline";
import { SCENES, type SceneId } from "@/lib/journey";
interface ScrollStore {
  scene: number;
  active: SceneId;
  progress: number;
  reducedMotion: boolean;
  setScroll: (viewports: number, reducedMotion: boolean) => void;
}
export const useScroll = create<ScrollStore>((set) => ({
  scene: 0, active: "earth", progress: 0, reducedMotion: false,
  setScroll: (viewports, reducedMotion) => {
    const scene = scenePhase(viewports, reducedMotion);
    set({ scene, active: SCENES[Math.round(scene)].id,
      progress: Math.min(1, viewports / (SCENES.length - 1)), reducedMotion });
  },
}));
