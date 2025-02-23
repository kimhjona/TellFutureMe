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
      const gridWidth = Math.ceil(canvas.width / s); // renamed from g
      const h = Math.ceil(canvas.height / (s * 0.5));
      const w = canvas.width / 2;
      const v = canvas.height / 2;

      // Background color edit
      x.fillStyle = "#95B8D1";
      x.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = -h; y < h; y += 2) {
        for (let i = -gridWidth; i < gridWidth; i += 2) {
          // updated reference
          const p = w + ((i - y) * s) / 2;
          const q = v + ((i + y) * s) / 4;
          const m = Math.sqrt(i * i + y * y);
          const n = Math.sqrt(gridWidth * gridWidth + h * h); // updated reference
          const e = 1 - m / n;
          const f = s * e * Math.sin(m * 0.3 + t);

          x.beginPath();
          x.moveTo(p, q - f);
          x.lineTo(p + s / 2, q - s / 2 - f);
          x.lineTo(p + s, q - f);
          x.lineTo(p + s, q);
          x.lineTo(p + s / 2, q + s / 2);
          x.lineTo(p, q);
          x.closePath();

          // Cell fill style edit
          x.fillStyle = `rgba(${Math.floor(230 * e)},${Math.floor(
            180 * e
          )},${Math.floor(200 * e)},0.25)`;
          x.fill();

          // Line style edit
          if (m < n / 2) {
            x.strokeStyle = "rgba(255,200,200,0.08)";
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
