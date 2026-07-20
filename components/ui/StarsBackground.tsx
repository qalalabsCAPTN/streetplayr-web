"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleDir: number;
  speedY: number;
  spikes: number;
  isGlowy: boolean;
}

/**
 * Ported from Bluorng 2. NOT wired into app/layout.tsx by default — it duplicates
 * GlobalParticles.tsx's job and renders at z-9999 (foreground), which conflicts with
 * the documented layering contract (body -3 -> overlays -2 -> GlobalParticles -1 ->
 * content 0+). Mounting both at once will stack two particle systems and this one
 * will visually sit on top of all page content. If enabling, lower its z-index to
 * match the -1 layer convention and remove GlobalParticles first, or scope it to a
 * page that explicitly wants a foreground effect (excluded from CLAUDE.md's rule).
 */
export default function StarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId: number;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const drawStar = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number
    ) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      context.beginPath();
      context.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        context.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        context.lineTo(x, y);
        rot += step;
      }
      context.lineTo(cx, cy - outerRadius);
      context.closePath();
    };

    const numStars = 65;
    const stars: Star[] = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.85 + 0.15,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        speedY: -(Math.random() * 0.4 + 0.1),
        spikes: 4,
        isGlowy: Math.random() > 0.4,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.04)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.01)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < numStars; i++) {
        const star = stars[i];

        star.alpha += star.twinkleSpeed * star.twinkleDir;
        if (star.alpha >= 1) {
          star.alpha = 1;
          star.twinkleDir = -1;
        } else if (star.alpha <= 0.1) {
          star.alpha = 0.1;
          star.twinkleDir = 1;
        }

        star.y += star.speedY;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        drawStar(ctx, star.x, star.y, star.spikes, star.radius * 3.5, star.radius * 1.0);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;

        if (star.isGlowy) {
          ctx.shadowBlur = star.radius * 7;
          ctx.shadowColor = "#ffffff";
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
