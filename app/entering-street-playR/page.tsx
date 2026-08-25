"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/styles/video-page.module.css";
import { ENTRY_COOKIE, ENTRY_STORAGE_KEY } from "@/lib/social";

function markEntered() {
  try {
    localStorage.setItem(ENTRY_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${ENTRY_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Standalone intro route. Always plays when opened directly.
 * Enter / video-end → /home + sp-entry-seen=1.
 */
export default function EnteringStreetPlayR() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = () => {
    if (isExiting) return;
    markEntered();
    setIsExiting(true);
    window.setTimeout(() => router.push("/home"), 600);
  };

  return (
    <div
      className={`${styles["video-page"]} ${isExiting ? styles["exit"] : ""}`}
      role="dialog"
      aria-label="StreetplayR intro"
    >
      <video
        className={styles["preloader-video"]}
        autoPlay
        muted
        playsInline
        controls={false}
        onEnded={handleEnter}
      >
        <source src="/assets/videos/WebAnimation_V1.mp4" type="video/mp4" />
      </video>

      <button
        type="button"
        className={styles["enter-cta"]}
        onClick={handleEnter}
        aria-label="Click to enter"
      >
        [ CLICK TO ENTER ]
      </button>
    </div>
  );
}
