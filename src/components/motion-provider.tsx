"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { MotionConfig } from "motion/react";
import Lenis from "lenis";
import { settings } from "@/lib/content";

const MotionContext = createContext({
  enabled: true,
  reduced: false,
  toggle: () => {},
});
// This media-query syntax is a browser protocol, shared by one preference store.
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(changed: () => void) {
  const preference = window.matchMedia(REDUCED_MOTION_QUERY);
  preference.addEventListener("change", changed);
  return () => preference.removeEventListener("change", changed);
}
function reducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
function serverMotionSnapshot() {
  // React uses this identical snapshot for static HTML and its first hydration render.
  return false;
}
export function useSiteMotion() {
  return useContext(MotionContext);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    serverMotionSnapshot,
  );
  const [paused, setPaused] = useState(false);
  const enabled = !paused && !reduced;
  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? "on" : "off";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [enabled]);
  useEffect(() => {
    if (!enabled || reducedMotionSnapshot()) return;
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      lerp: settings.motion.scrollLerp,
    });
    return () => lenis.destroy();
  }, [enabled]);
  return (
    <MotionContext
      value={{
        enabled,
        reduced: !!reduced,
        toggle: () => setPaused((v) => !v),
      }}
    >
      <MotionConfig reducedMotion={enabled ? "user" : "always"}>
        {children}
      </MotionConfig>
    </MotionContext>
  );
}
