"use client";

interface EnterButtonProps {
  label: string;
  onClick: () => void;
  size?: "small" | "large";
  className?: string;
}

export default function EnterButton({ label, onClick, size = "large", className = "" }: EnterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${className} cursor-pointer`}
      style={{
        border: "1px solid rgba(255,255,255,0.14)",
        background: "transparent",
        color: "#f5f5f5",
        padding: size === "small" ? "10px 24px" : "14px 32px",
        borderRadius: 8,
        fontSize: size === "small" ? 12 : 14,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: size === "small" ? "0.05em" : "0.08em",
        textShadow: "none",
        boxShadow: "none",
        transition: "all 0.3s ease",
        opacity: size === "small" ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = "rgba(255,255,255,0.08)";
        el.style.textShadow = "none";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(-1px)";
        el.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = "transparent";
        el.style.textShadow = "none";
        el.style.boxShadow = "none";
        el.style.transform = "scale(1)";
        el.style.opacity = size === "small" ? "0.7" : "1";
      }}
    >
      {label}
    </button>
  );
}
