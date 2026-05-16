"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import EnterButton from "@/components/ui/EnterButton";
import ThreeStarScene from "@/components/ui/ThreeStarScene";

export default function EnterThePlayPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = async () => {
    if (isExiting) return;
    setIsExiting(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    router.push("/entering-street-playR");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0015",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "60px 20px 80px",
        overflow: "hidden",
        opacity: isExiting ? 0 : 1,
        transition: "opacity 0.6s ease-out",
      }}
    >
      {/* Particle field */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          opacity: 0.1,
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="entry-particle"
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              animationDelay: `${(i * 0.7) % 5}s`,
              animationDuration: `${4 + (i % 6)}s`,
              width: 2,
              height: 2,
              background: "#c77dff",
            }}
          />
        ))}
      </div>

      {/* Layer 1: Logo */}
      <div
        style={{
          opacity: show ? 1 : 0,
          transition: "opacity 0.6s ease-out",
        }}
      >
        <Image
          src="/assets/streetplayr-logo.png"
          alt="StreetplayR"
          width={280}
          height={80}
          style={{
            width: "280px",
            maxWidth: "90vw",
            height: "auto",
          }}
          priority
        />
      </div>

      {/* Layer 2: 3D Star */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: show ? 1 : 0,
          transition: "opacity 0.8s ease-out 0.2s",
        }}
      >
        <ThreeStarScene size={340} />
      </div>

      {/* Layer 3: Enter Button */}
      <div
        style={{
          opacity: show ? 1 : 0,
          transition: "opacity 0.6s ease-out 0.4s",
        }}
      >
        <EnterButton
          label="ENTER THE PLAY"
          onClick={handleEnter}
        />
      </div>
    </div>
  );
}
