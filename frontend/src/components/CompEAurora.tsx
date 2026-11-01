"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";

type AuroraKeyframes =
  | "aura-drift-a"
  | "aura-drift-b"
  | "aura-drift-c"
  | "aura-drift-d";

type AuroraLayer = {
  id: string;
  background: string;
  left: string;
  top: string;
  width: string;
  aspectRatio: string;
  opacity: number;
  blur: number;
  keyframes: AuroraKeyframes;
  duration: number;
  delay: number;
  direction?: "alternate" | "alternate-reverse";
};

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Bright core stays near the top. Depth comes from the tail: a short ellipse
 * dies early, a tall one keeps a faint column going.
 */
const pillar = (color: string, focal: number) =>
  `radial-gradient(ellipse 82% 100% at 50% ${focal}%, ${color} 0%, transparent 92%)`;

const LAYERS: AuroraLayer[] = [
  {
    id: "ocean",
    background: pillar("#0ea5e9", 16),
    left: "-16%",
    top: "-14%",
    width: "clamp(300px, 48vw, 700px)",
    aspectRatio: "1 / 0.6",
    opacity: 0.55,
    blur: 110,
    keyframes: "aura-drift-a",
    duration: 18,
    delay: -5,
  },
  {
    id: "emerald",
    background: pillar("#10b981", 30),
    left: "14%",
    top: "-6%",
    width: "clamp(250px, 36vw, 560px)",
    aspectRatio: "1 / 1.65",
    opacity: 0.52,
    blur: 120,
    keyframes: "aura-drift-b",
    duration: 24,
    delay: -11,
  },
  {
    id: "violet",
    background: pillar("#8b5cf6", 34),
    left: "32%",
    top: "-2%",
    width: "clamp(190px, 24vw, 380px)",
    aspectRatio: "1 / 1.2",
    opacity: 0.32,
    blur: 140,
    keyframes: "aura-drift-d",
    duration: 21,
    delay: -8,
  },
  {
    id: "teal",
    background: pillar("#14b8a6", 24),
    left: "46%",
    top: "-10%",
    width: "clamp(230px, 34vw, 520px)",
    aspectRatio: "1 / 1.1",
    opacity: 0.48,
    blur: 120,
    keyframes: "aura-drift-c",
    duration: 15,
    delay: -3,
  },
  {
    id: "cyan",
    background: pillar("#06b6d4", 14),
    left: "68%",
    top: "-16%",
    width: "clamp(240px, 36vw, 540px)",
    aspectRatio: "1 / 0.72",
    opacity: 0.5,
    blur: 100,
    keyframes: "aura-drift-a",
    duration: 13,
    delay: -6,
    direction: "alternate-reverse",
  },
];

function layerStyle(layer: AuroraLayer, paused: boolean): CSSProperties {
  return {
    left: layer.left,
    top: layer.top,
    width: layer.width,
    aspectRatio: layer.aspectRatio,
    opacity: layer.opacity,
    background: layer.background,
    borderRadius: "9999px",
    transformOrigin: "center top",
    filter: `blur(${layer.blur}px)`,
    animationName: layer.keyframes,
    animationDuration: `${layer.duration}s`,
    animationTimingFunction: EASE,
    animationDelay: `${layer.delay}s`,
    animationIterationCount: "infinite",
    animationDirection: layer.direction ?? "alternate",
    animationFillMode: "both",
    animationPlayState: paused ? "paused" : "running",
  };
}

type CompEAuroraProps = {
  /** Fades the curtain in/out instead of mounting abruptly. */
  active?: boolean;
  /** Freezes the drift (e.g. while a local model is generating). */
  paused?: boolean;
  className?: string;
};

export function CompEAurora({
  active = true,
  paused = false,
  className = "",
}: CompEAuroraProps) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="compe-aurora"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className={`aura-veil pointer-events-none absolute inset-x-0 top-0 z-0 isolate h-[clamp(520px,82vh,920px)] overflow-hidden ${className}`}
        >
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="absolute mix-blend-screen will-change-transform"
              style={layerStyle(layer, paused)}
            />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
