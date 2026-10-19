'use client';

import React, { useEffect, useRef } from 'react';

interface GlitchTransitionProps {
  active: boolean;
}

export const GlitchTransition: React.FC<GlitchTransitionProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let frame = 0;
    const colors = ['#ff9000', '#ff0055', '#00e5ff', '#ffffff', '#111116', '#ff4081'];

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Random chunky pixel blocks
      const blockCount = 35 + Math.floor(Math.random() * 25);
      for (let i = 0; i < blockCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const w = (Math.random() * 240) + 40;
        const h = (Math.random() * 45) + 8;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.65 + Math.random() * 0.35;
        ctx.fillRect(x, y, w, h);
      }

      // Horizontal RGB glitch stripes
      for (let i = 0; i < 5; i++) {
        const y = Math.random() * canvas.height;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 144, 0, 0.45)' : 'rgba(0, 229, 255, 0.4)';
        ctx.fillRect(0, y, canvas.width, 10 + Math.random() * 20);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="glitch-overlay active">
      <canvas ref={canvasRef} className="pixel-glitch-canvas" />
      <div className="glitch-pixel-matrix" />
      <div className="glitch-scanlines" />
      <div className="glitch-color-shift" />
      <div className="glitch-slices">
        <div className="glitch-bar pixel-bar-1" />
        <div className="glitch-bar pixel-bar-2" />
        <div className="glitch-bar pixel-bar-3" />
        <div className="glitch-bar pixel-bar-4" />
        <div className="glitch-bar pixel-bar-5" />
      </div>
    </div>
  );
};
