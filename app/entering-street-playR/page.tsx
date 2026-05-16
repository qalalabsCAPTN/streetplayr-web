"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import EnterButton from "@/components/ui/EnterButton";

export default function EnteringStreetPlayR() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleExit = () => {
    if (fading) return;
    setFading(true);
    setTimeout(() => router.push("/home"), 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.6s ease-out",
      }}
    >
      <video
        ref={videoRef}
        src="/assets/home-page-banner.mp4"
        autoPlay
        playsInline
        muted
        onEnded={handleExit}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />

      {/* Letterbox bars */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, #000 0%, transparent 15%, transparent 85%, #000 100%)",
          opacity: 0.3,
        }}
      />

      {showSkip && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            opacity: fading ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}
        >
          <EnterButton label="SKIP" onClick={handleExit} size="small" />
        </div>
      )}
    </div>
  );
}
