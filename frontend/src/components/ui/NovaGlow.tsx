"use client";

import { useCallback, useState, type CSSProperties } from "react";

type Blob = {
  left: number;
  top: number;
  size: number;
  color: string;
};

const NOVA_COLORS = ["#8b5cf6", "#a855f7", "#7c3aed", "#6366f1", "#c084fc"];

/** Fixed per slot: changing these mid-run would make the browser re-time the
    animation and pop the spot into view. Only position/size/color are random. */
const SLOT_DURATIONS = [4.2, 5.1, 3.7, 4.7, 5.5, 3.9];

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function makeBlob(minSize: number, maxSize: number): Blob {
  return {
    left: rand(8, 92),
    top: rand(10, 90),
    size: rand(minSize, maxSize),
    color: pick(NOVA_COLORS),
  };
}

type NovaGlowProps = {
  /** How many glow spots live at once. */
  count?: number;
  /** Diameter range in px. */
  minSize?: number;
  maxSize?: number;
  /** Blur radius in px. */
  blur?: number;
  className?: string;
};

/**
 * Soft violet blooms that fade in, pulse, and fade out. Each spot jumps to a
 * new random position only while fully invisible (on animation iteration),
 * so it never pops — it just "respawns" somewhere else on the next beat.
 */
export function NovaGlow({
  count = 3,
  minSize = 56,
  maxSize = 96,
  blur = 18,
  className = "",
}: NovaGlowProps) {
  const [blobs, setBlobs] = useState<Blob[]>(() =>
    Array.from({ length: count }, () => makeBlob(minSize, maxSize)),
  );

  const respawn = useCallback(
    (index: number) => {
      setBlobs((prev) =>
        prev.map((blob, i) => (i === index ? makeBlob(minSize, maxSize) : blob)),
      );
    },
    [minSize, maxSize],
  );

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 isolate overflow-hidden ${className}`}
    >
      {blobs.map((blob, index) => {
        const duration = SLOT_DURATIONS[index % SLOT_DURATIONS.length];
        const style: CSSProperties = {
          left: `${blob.left}%`,
          top: `${blob.top}%`,
          width: `${blob.size}px`,
          height: `${blob.size * 0.62}px`,
          background: blob.color,
          filter: `blur(${blur}px)`,
          translate: "-50% -50%",
          animationName: "nova-bloom",
          animationDuration: `${duration}s`,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          // Stagger so the spots never beat in sync.
          animationDelay: `${-(index * duration) / count}s`,
        };
        return (
          <span
            key={index}
            className="absolute rounded-full mix-blend-screen will-change-[opacity,transform]"
            style={style}
            onAnimationIteration={() => respawn(index)}
          />
        );
      })}
    </span>
  );
}
