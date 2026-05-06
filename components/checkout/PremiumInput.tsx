"use client";

import { motion } from "framer-motion";
import { InputHTMLAttributes, useState } from "react";

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function PremiumInput({ label, id, ...props }: PremiumInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(props.value) || Boolean(props.defaultValue);

  return (
    <div className="relative pt-6 pb-2 w-full">
      <motion.label
        htmlFor={id}
        animate={{
          y: isFocused || hasValue ? -24 : 0,
          scale: isFocused || hasValue ? 0.85 : 1,
          opacity: isFocused || hasValue ? 0.6 : 0.4,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-0 top-6 font-mono text-xs uppercase tracking-widest text-white origin-left pointer-events-none"
      >
        {label}
      </motion.label>
      
      <input
        id={id}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className="w-full bg-transparent border-b border-white/20 pb-2 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors duration-500 rounded-none"
        {...props}
      />
      
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isFocused ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-2 left-0 right-0 h-[1px] bg-white origin-left pointer-events-none"
      />
    </div>
  );
}
