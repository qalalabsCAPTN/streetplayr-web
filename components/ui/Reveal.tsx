"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode, useState, useEffect } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: RevealProps) {
  const [viewportAmount, setViewportAmount] = useState(0.18);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setViewportAmount(0.1);
      } else if (w < 1024) {
        setViewportAmount(0.15);
      } else {
        setViewportAmount(0.18);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <motion.div
      className={className}
      custom={delay}
      initial="hidden"
      variants={revealVariants}
      viewport={{ once: true, amount: viewportAmount }}
      whileInView="visible"
    >
      {children}
    </motion.div>
  );
}
