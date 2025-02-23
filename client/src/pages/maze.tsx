import type React from "react";
import { useEffect, useRef } from "react";

const NeonIsometricMaze: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = canvas.getContext("2d", { alpha: false }); // Optimization 1: Disable alpha
    if (!x) return;

    let t = 0;
    let animationFrameId: number;
    let lastFrame = 0;
    const FPS = 30; // Optimization 2: Limit FPS
    const frameInterval = 1000 / FPS;

    const r = () => {
      if (!canvas) return;
      // Optimization 3: Reduce canvas size
      canvas.width = window.innerWidth / 1.5;
      canvas.height = window.innerHeight / 1.5;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      d();
    };

    const d = () => {
      if (!canvas || !x) return;
      // Optimization 4: Increase cell size (reduce grid density)
      const s = Math.min(canvas.width, canvas.height) / 12;
      // Optimization 5: Reduce grid size
      const g = Math.ceil(canvas.width / s);
      const h = Math.ceil(canvas.height / (s * 0.5));
      const w = canvas.width / 2;
      const v = canvas.height / 2;

      // Clear canvas with solid color instead of transparent
      x.fillStyle = "#E3D8F1";
      x.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = -h; y < h; y += 2) {
        // Optimization 6: Skip cells
        for (let i = -g; i < g; i += 2) {
          const p = w + ((i - y) * s) / 2;
          const q = v + ((i + y) * s) / 4;
          const m = Math.sqrt(i * i + y * y);
          const n = Math.sqrt(g * g + h * h);
          const e = 1 - m / n;
          // Optimization 7: Simplify animation
          const f = s * e * Math.sin(m * 0.3 + t);

          // Optimization 8: Simplified shapes
          x.beginPath();
          x.moveTo(p, q - f);
          x.lineTo(p + s / 2, q - s / 2 - f);
          x.lineTo(p + s, q - f);
          x.lineTo(p + s, q);
          x.lineTo(p + s / 2, q + s / 2);
          x.lineTo(p, q);
          x.closePath();

          // Optimization 9: Simpler colors
          x.fillStyle = `rgba(0,${Math.floor(255 * e)},255,0.5)`;
          x.fill();

          // Optimization 10: Reduced line drawing
          if (m < n / 2) {
            // Only draw lines for closer cells
            x.strokeStyle = "rgba(255,255,255,0.2)";
            x.stroke();
          }
        }
      }
    };

    const a = (timestamp: number) => {
      if (!canvas || !x) return;

      // Optimization 11: Frame rate limiting
      if (timestamp - lastFrame >= frameInterval) {
        lastFrame = timestamp;
        d();
        t += 0.02; // Optimization 12: Slower animation
      }

      animationFrameId = requestAnimationFrame(a);
    };

    // Optimization 13: Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(r, 250);
    };

    window.addEventListener("resize", handleResize);
    r();
    animationFrameId = requestAnimationFrame(a);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block fixed inset-0 -z-10" // Optimization 14: Better positioning
      style={{
        imageRendering: "pixelated", // Optimization 15: Better scaling
      }}
    />
  );
};

export default NeonIsometricMaze;
