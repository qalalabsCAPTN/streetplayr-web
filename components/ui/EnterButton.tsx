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
        border: "1px solid #c77dff",
        background: "transparent",
        color: "#c77dff",
        padding: size === "small" ? "10px 24px" : "14px 32px",
        borderRadius: 8,
        fontSize: size === "small" ? 12 : 14,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: size === "small" ? "0.05em" : "0.08em",
        textShadow: "0 0 8px #9d4edd",
        boxShadow: "0 4px 20px rgba(157, 78, 221, 0.3)",
        transition: "all 0.3s ease",
        opacity: size === "small" ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = "rgba(157, 78, 221, 0.1)";
        el.style.textShadow = "0 0 16px #9d4edd";
        el.style.boxShadow = "0 6px 30px rgba(157, 78, 221, 0.5)";
        el.style.transform = "scale(1.05)";
        el.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = "transparent";
        el.style.textShadow = "0 0 8px #9d4edd";
        el.style.boxShadow = "0 4px 20px rgba(157, 78, 221, 0.3)";
        el.style.transform = "scale(1)";
        el.style.opacity = size === "small" ? "0.7" : "1";
      }}
    >
      {label}
    </button>
  );
}
