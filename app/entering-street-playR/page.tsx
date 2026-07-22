"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/styles/video-page.module.css";

export default function EnteringStreetPlayR() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => router.push("/home"), 600);
  };

  const handleVideoEnd = () => {
    handleSkip();
  };

  return (
    <div className={`${styles["video-page"]} ${isExiting ? styles["exit"] : ""}`}>
      <video
        className={styles["preloader-video"]}
        autoPlay
        muted
        playsInline
        controls={false}
        onEnded={handleVideoEnd}
      >
        <source src="/assets/videos/WebAnimation_V1.mp4" type="video/mp4" />
      </video>

      <button className={styles["skip-button"]} onClick={handleSkip}>
        [ CLICK TO ENTER ]
      </button>
    </div>
  );
}
