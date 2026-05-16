"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  ariaLabel?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-black hover:bg-neutral-200",
  secondary:
    "border border-white/55 bg-transparent text-white hover:border-white hover:bg-white/[0.08]",
  ghost:
    "bg-transparent text-white underline-offset-8 hover:text-[var(--sp-accent)] hover:underline",
};

const baseClass =
  "inline-flex min-h-[52px] items-center justify-center rounded-xl px-7 py-3 font-display text-base uppercase leading-none tracking-[0.16em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

export default function Button({
  children,
  className = "",
  href,
  type = "button",
  variant = "primary",
  ariaLabel,
  onClick,
}: ButtonProps) {
  const classes = `${baseClass} ${variants[variant]} ${className}`.trim();
  const colorStyle: CSSProperties =
    variant === "primary" ? { color: "#000000" } : {};

  if (href) {
    return (
      <motion.span
        className="inline-flex"
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
      >
        <Link
          aria-label={ariaLabel}
          className={classes}
          href={href}
          style={colorStyle}
        >
          {children}
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.button
      aria-label={ariaLabel}
      className={classes}
      onClick={onClick}
      style={colorStyle}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      type={type}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
}
