"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import styles from "@/styles/enter-the-play.module.css";

const GLBStar = dynamic(() => import("@/components/ui/GLBStar"), {
  ssr: false,
  loading: () => <div className={styles["star-loader"]} />,
});

export default function EnterThePlay() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => router.push("/entering-street-playR"), 600);
  };

  return (
    <div className={`${styles["container"]} ${isExiting ? styles["exit"] : ""}`}>
      <div className={styles["logo"]}>
        <Image
          src="/assets/streetplayr-logo.png"
          alt="StreetplayR"
          width={280}
          height={100}
          priority
          unoptimized
        />
      </div>

      <div className={styles["star-container"]}>
        <GLBStar modelPath="/models/streetplayr-star/starchrome.glb" />
      </div>

      <button className={styles["enter-button"]} onClick={handleEnter}>
        ENTER THE PLAY
      </button>
    </div>
  );
}
