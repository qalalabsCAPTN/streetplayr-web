"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { useWindowWidth } from "@/hooks/useWindowWidth";

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
  const width = useWindowWidth();
  const viewportAmount = width < 768 ? 0.1 : width < 1024 ? 0.15 : 0.18;

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
