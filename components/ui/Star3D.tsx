"use client";

export default function Star3D({ size = 340 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        perspective: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          animation: "starSpin 25s linear infinite, starFloat 3s ease-in-out infinite",
          filter: "drop-shadow(0 18px 48px rgba(0,0,0,0.45))",
        }}
      >
        {/* Layer 1 - front */}
        <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, transform: "translateZ(12px)" }}>
          <path
            d="M100 5 L118 72 L190 72 L132 112 L152 180 L100 140 L48 180 L68 112 L10 72 L82 72 Z"
            fill="url(#starGrad)"
            stroke="#b8a1ff"
            strokeWidth="1.5"
            opacity="0.95"
          />
        </svg>
        {/* Layer 2 - mid */}
        <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, transform: "translateZ(0)" }}>
          <path
            d="M100 0 L120 70 L195 70 L135 115 L155 185 L100 145 L45 185 L65 115 L5 70 L80 70 Z"
            fill="url(#starGrad2)"
            stroke="#b8a1ff"
            strokeWidth="1"
            opacity="0.7"
          />
        </svg>
        {/* Layer 3 - back */}
        <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, transform: "translateZ(-12px)" }}>
          <path
            d="M100 10 L116 68 L185 68 L130 108 L148 175 L100 138 L52 175 L70 108 L15 68 L84 68 Z"
            fill="url(#starGrad3)"
            stroke="#7d728f"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>

        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="40%" stopColor="#d7d0e8" />
              <stop offset="100%" stopColor="#b8a1ff" />
            </linearGradient>
            <linearGradient id="starGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b8a1ff" />
              <stop offset="100%" stopColor="#7d728f" />
            </linearGradient>
            <linearGradient id="starGrad3" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#7d728f" />
              <stop offset="100%" stopColor="#3a3640" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
