"use client";

import { useEffect, useState } from "react";

/**
 * Ambient video background for the hub scene panel.
 * Fills its (positioned) parent — used inside the left scene card, so it never
 * overlaps the footer. object-cover fills the framed panel cleanly.
 * prefers-reduced-motion → static poster.
 */
export default function HubBackground({
  poster = "/backgrounds/hub-bg.jpg",
  video = "/backgrounds/hub-bg.mp4",
}: {
  poster?: string;
  video?: string;
}) {
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) setMotionOk(false);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {motionOk ? (
        <video
          className="absolute inset-0 w-full h-full object-cover object-bottom"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={poster}
        >
          <source src={video} type="video/mp4" />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-bottom"
        />
      )}

      {/* Soft scrim — darker toward the bottom for dialogue readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />
    </div>
  );
}
