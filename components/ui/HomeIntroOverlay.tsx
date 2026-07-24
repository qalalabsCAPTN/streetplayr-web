"use client";

import { useEffect, useState } from "react";
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

function hasEntered(): boolean {
  try {
    if (localStorage.getItem(ENTRY_STORAGE_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${ENTRY_COOKIE}=1`));
}

/**
 * Full-screen homepage intro video. Shown once per visitor on `/home`.
 * Dismiss via prominent CLICK TO ENTER (or video end). Not a separate route.
 */
export default function HomeIntroOverlay() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (hasEntered()) return;
    setVisible(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const dismiss = () => {
    if (exiting) return;
    markEntered();
    setExiting(true);
    window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 600);
  };

  if (!visible) return null;

  return (
    <div
      className={`${styles["video-page"]} ${exiting ? styles["exit"] : ""}`}
      role="dialog"
      aria-label="Street PlayR intro"
    >
      <video
        className={styles["preloader-video"]}
        autoPlay
        muted
        playsInline
        controls={false}
        onEnded={dismiss}
      >
        <source src="/assets/videos/WebAnimation_V1.mp4" type="video/mp4" />
      </video>

      <button
        type="button"
        className={styles["enter-cta"]}
        onClick={dismiss}
        aria-label="Click to enter"
      >
        [ CLICK TO ENTER ]
      </button>
    </div>
  );
}
