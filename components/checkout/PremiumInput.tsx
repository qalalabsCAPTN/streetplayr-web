"use client";

import { motion } from "framer-motion";
import { InputHTMLAttributes, useState } from "react";

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function PremiumInput({ label, id, className = "", ...props }: PremiumInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(props.value) || Boolean(props.defaultValue);

  return (
    <div className="checkout-field w-full">
      <motion.label
        htmlFor={id}
        animate={{
          opacity: isFocused || hasValue ? 1 : 0.7,
        }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
        className={className}
        {...props}
      />
    </div>
  );
}
