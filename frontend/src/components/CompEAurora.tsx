"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";

type SwayKeyframes = "aura-sway-a" | "aura-sway-b" | "aura-sway-c";

type AuroraLayer = {
  id: string;
  background: string;
  left: string;
  top: string;
  width: string;
  aspectRatio: string;
  opacity: number;
  blur: number;
  /** Slow curtain sway (outer element). */
  sway: SwayKeyframes;
  swayDuration: number;
  swayDelay: number;
  direction?: "alternate" | "alternate-reverse";
  /** Faster brightness flicker (inner element). */
  shimmerDuration: number;
  shimmerDelay: number;
};

const EASE = "cubic-bezier(0.45, 0, 0.55, 1)";

/**
 * Bright core stays near the top. Depth comes from the tail: a short ellipse
 * dies early, a tall one keeps a faint column going.
 */
const pillar = (color: string, focal: number) =>
  `radial-gradient(ellipse 82% 100% at 50% ${focal}%, ${color} 0%, transparent 92%)`;

/**
 * Order matters with mix-blend-screen: violet sits after the greens so it is
 * not washed out into grey-blue by the larger cool layers.
 */
const LAYERS: AuroraLayer[] = [
  {
    id: "ocean",
    background: pillar("#0ea5e9", 16),
    left: "-16%",
    top: "-14%",
    width: "clamp(300px, 46vw, 680px)",
    aspectRatio: "1 / 0.7",
    opacity: 0.5,
    blur: 100,
    sway: "aura-sway-a",
    swayDuration: 14,
    swayDelay: -5,
    shimmerDuration: 6.5,
    shimmerDelay: -2,
  },
  {
    id: "emerald",
    background: pillar("#10b981", 28),
    left: "10%",
    top: "-6%",
    width: "clamp(240px, 32vw, 500px)",
    aspectRatio: "1 / 1.7",
    opacity: 0.5,
    blur: 90,
    sway: "aura-sway-b",
    swayDuration: 17,
    swayDelay: -9,
    shimmerDuration: 5.2,
    shimmerDelay: -1,
  },
  {
    id: "teal",
    background: pillar("#14b8a6", 24),
    left: "50%",
    top: "-10%",
    width: "clamp(220px, 30vw, 480px)",
    aspectRatio: "1 / 1.2",
    opacity: 0.42,
    blur: 100,
    sway: "aura-sway-c",
    swayDuration: 12,
    swayDelay: -3,
    shimmerDuration: 7.4,
    shimmerDelay: -4,
  },
  {
    id: "violet",
    background: pillar("#8b5cf6", 26),
    left: "28%",
    top: "-8%",
    width: "clamp(260px, 34vw, 540px)",
    aspectRatio: "1 / 1.35",
    opacity: 0.72,
    blur: 85,
    sway: "aura-sway-c",
    swayDuration: 15,
    swayDelay: -7,
    direction: "alternate-reverse",
    shimmerDuration: 4.8,
    shimmerDelay: -3,
  },
  {
    id: "purple",
    background: pillar("#a855f7", 20),
    left: "72%",
    top: "-12%",
    width: "clamp(220px, 30vw, 460px)",
    aspectRatio: "1 / 1.1",
    opacity: 0.6,
    blur: 90,
    sway: "aura-sway-b",
    swayDuration: 13,
    swayDelay: -4,
    direction: "alternate-reverse",
    shimmerDuration: 5.8,
    shimmerDelay: -2.5,
  },
  {
    id: "cyan",
    background: pillar("#06b6d4", 14),
    left: "84%",
    top: "-16%",
    width: "clamp(200px, 28vw, 440px)",
    aspectRatio: "1 / 0.8",
    opacity: 0.42,
    blur: 100,
    sway: "aura-sway-a",
    swayDuration: 11,
    swayDelay: -6,
    shimmerDuration: 6.8,
    shimmerDelay: -5,
  },
];

/** Vertical folds: thin light/dark strands that read as curtain pleats. */
const FOLDS_BACKGROUND =
  "repeating-linear-gradient(90deg, transparent 0px, rgba(167, 139, 250, 0.16) 14px, transparent 34px, rgba(45, 212, 191, 0.12) 58px, transparent 86px)";

function swayStyle(layer: AuroraLayer, paused: boolean): CSSProperties {
  return {
    left: layer.left,
    top: layer.top,
    width: layer.width,
    aspectRatio: layer.aspectRatio,
    opacity: layer.opacity,
    transformOrigin: "center top",
    animationName: layer.sway,
    animationDuration: `${layer.swayDuration}s`,
    animationTimingFunction: EASE,
    animationDelay: `${layer.swayDelay}s`,
    animationIterationCount: "infinite",
    animationDirection: layer.direction ?? "alternate",
    animationFillMode: "both",
    animationPlayState: paused ? "paused" : "running",
  };
}

function glowStyle(layer: AuroraLayer, paused: boolean): CSSProperties {
  return {
    background: layer.background,
    borderRadius: "9999px",
    filter: `blur(${layer.blur}px)`,
    animationName: "aura-shimmer",
    animationDuration: `${layer.shimmerDuration}s`,
    animationTimingFunction: "ease-in-out",
    animationDelay: `${layer.shimmerDelay}s`,
    animationIterationCount: "infinite",
    animationDirection: "alternate",
    animationFillMode: "both",
    animationPlayState: paused ? "paused" : "running",
  };
}

function foldsStyle(paused: boolean): CSSProperties {
  return {
    backgroundImage: FOLDS_BACKGROUND,
    WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 75%)",
    maskImage: "linear-gradient(180deg, #000 0%, transparent 75%)",
    filter: "blur(10px)",
    opacity: 0.55,
    transformOrigin: "center top",
    animationName: "aura-sway-b",
    animationDuration: "19s",
    animationTimingFunction: EASE,
    animationDelay: "-6s",
    animationIterationCount: "infinite",
    animationDirection: "alternate",
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
            /* Outer: sway + static layer opacity + blend (it owns the stacking
               context, so the blend has to live here). Inner: shimmer. */
            <div
              key={layer.id}
              className="absolute mix-blend-screen will-change-transform"
              style={swayStyle(layer, paused)}
            >
              <div
                className="h-full w-full will-change-[opacity]"
                style={glowStyle(layer, paused)}
              />
            </div>
          ))}
          <div
            className="absolute -inset-x-[10%] top-0 h-[70%] mix-blend-screen will-change-transform"
            style={foldsStyle(paused)}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
