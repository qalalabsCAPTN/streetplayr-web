"use client";
/* eslint-disable react-hooks/set-state-in-effect */


import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import styles from "@/styles/enter-the-play.module.css";

const NinjaStar = dynamic(() => import("@/components/ui/NinjaStar"), {
  ssr: false,
  loading: () => <div className={styles["star-loader"]} />,
});

export default function EnterThePlay() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getStarScale = () => {
    if (windowWidth === null) return 0.95;
    if (windowWidth < 768) return 0.65;
    if (windowWidth < 1024) return 0.8;
    return 0.95;
  };
  const starScale = getStarScale();

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 14 + 4;
      if (p >= 100) {
        p = 100;
        setReady(true);
        clearInterval(id);
      }
      setProgress(p);
    }, 180);
    return () => clearInterval(id);
  }, []);

  const [particles, setParticles] = useState<Array<{ left: number; delay: number; dur: number; size: number }>>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 28 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 5,
        dur: 4 + Math.random() * 6,
        size: 1 + Math.random() * 2,
      })),
    );
  }, []);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => router.push("/entering-street-playR"), 600);
  };

  return (
    <div className={`${styles["container"]} ${theme === 'light' ? styles["light"] : ""} ${isExiting ? styles["exit"] : ""}`}>
      {/* Theme Toggle Button */}
      <button 
        className={styles["theme-toggle"]}
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </button>

      {/* Background layers */}
      <div className={styles["bg-stage"]}>
        <div className={styles["bg-grid"]} />
        <div className={styles["bg-blob-purple"]} />
        <div className={styles["bg-blob-green"]} />
        <div className={styles["bg-noise"]} />
        <div className={styles["bg-scanline"]} />
      </div>

      {/* Particles */}
      <div className={styles["particles"]}>
        {particles.map((p, i) => (
          <span
            key={i}
            className={styles["particle"]}
            style={{
              left: `${p.left}%`,
              bottom: "-10px",
              width: p.size,
              height: p.size,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Content */}
      <div className={styles["content"]}>
        <div className={styles["star-container"]}>
          <NinjaStar scale={starScale} scrollReactive={false} />
        </div>

        <div className={styles["brand"]}>
          <Image
            src="/assets/streetplayr-logo.png"
            alt="StreetplayR"
            width={540}
            height={100}
            className={styles["brand-logo"]}
            priority
          />
        </div>

        {ready ? (
          <button className={styles["enter-bracketed"]} onClick={handleEnter}>
            [ CLICK TO ENTER ]
          </button>
        ) : (
          <div className={styles["loading-state"]}>
            <div className={styles["loading-bar"]}>
              <div
                className={styles["loading-bar-fill"]}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
