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
    <div className="relative pt-8 pb-3 w-full">
      <motion.label
        htmlFor={id}
        animate={{
          y: isFocused || hasValue ? -28 : 0,
          scale: isFocused || hasValue ? 0.8 : 1,
          opacity: isFocused || hasValue ? 0.4 : 0.2,
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-0 top-8 font-mono text-[10px] uppercase tracking-[0.2em] text-white origin-left pointer-events-none"
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
        className="w-full bg-transparent border-b border-white/5 pb-3 text-white/80 font-mono text-sm focus:outline-none transition-colors duration-1000 rounded-none"
        {...props}
      />
      
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isFocused ? 1 : 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-3 left-0 right-0 h-[1px] bg-white/20 origin-left pointer-events-none"
      />
    </div>
  );
}
