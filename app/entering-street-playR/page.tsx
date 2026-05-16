"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EnteringStreetPlayR() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => router.push("/home"), 600);
  };

  const handleVideoEnd = () => {
    setIsExiting(true);
    setTimeout(() => router.push("/home"), 600);
  };

  return (
    <div className={`video-page ${isExiting ? "exit" : ""}`}>
      <video
        className="preloader-video"
        autoPlay
        muted
        onEnded={handleVideoEnd}
      >
        <source src="/videos/entering-street-playR.mp4" type="video/mp4" />
      </video>

      <button className="skip-button" onClick={handleSkip}>
        SKIP
      </button>
    </div>
  );
}
