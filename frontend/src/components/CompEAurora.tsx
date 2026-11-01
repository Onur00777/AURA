"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";

type AuroraKeyframes =
  | "aura-drift-a"
  | "aura-drift-b"
  | "aura-drift-c"
  | "aura-curtain";

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
  rounded?: string;
};

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

const orb = (color: string) =>
  `radial-gradient(closest-side, ${color}, transparent)`;

const LAYERS: AuroraLayer[] = [
  {
    id: "ocean",
    background: orb("#0ea5e9"),
    left: "-18%",
    top: "-38%",
    width: "clamp(300px, 56vw, 780px)",
    aspectRatio: "1 / 0.72",
    opacity: 0.4,
    blur: 110,
    keyframes: "aura-drift-a",
    duration: 18,
    delay: -4,
  },
  {
    id: "emerald",
    background: orb("#10b981"),
    left: "30%",
    top: "-44%",
    width: "clamp(280px, 50vw, 720px)",
    aspectRatio: "1 / 0.68",
    opacity: 0.38,
    blur: 120,
    keyframes: "aura-drift-b",
    duration: 20,
    delay: -9,
  },
  {
    id: "teal",
    background: orb("#14b8a6"),
    left: "54%",
    top: "-30%",
    width: "clamp(240px, 42vw, 620px)",
    aspectRatio: "1 / 0.7",
    opacity: 0.3,
    blur: 130,
    keyframes: "aura-drift-c",
    duration: 15,
    delay: -2,
  },
  {
    id: "cyan",
    background: orb("#06b6d4"),
    left: "74%",
    top: "-46%",
    width: "clamp(240px, 44vw, 620px)",
    aspectRatio: "1 / 0.75",
    opacity: 0.34,
    blur: 100,
    keyframes: "aura-drift-a",
    duration: 13,
    delay: -6,
    direction: "alternate-reverse",
  },
  {
    id: "curtain",
    background:
      "linear-gradient(90deg, #0ea5e9 0%, #14b8a6 35%, #10b981 60%, #06b6d4 100%)",
    left: "-20%",
    top: "-12%",
    width: "140%",
    aspectRatio: "1 / 0.16",
    opacity: 0.25,
    blur: 140,
    keyframes: "aura-curtain",
    duration: 17,
    delay: -7,
    rounded: "50%",
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
    borderRadius: layer.rounded ?? "9999px",
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
          className={`pointer-events-none absolute inset-x-0 top-0 z-0 isolate h-[clamp(320px,62vh,640px)] overflow-hidden [mask-image:linear-gradient(to_bottom,black_30%,transparent_100%)] ${className}`}
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
