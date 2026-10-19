'use client';

import React, { useEffect, useRef } from 'react';

interface GlitchTransitionProps {
  active: boolean;
}

function playGlitchSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const duration = 1.7;

    // 1. Heavy White Noise Burst with multi-stage filter sweeps
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.8;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3200, ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.6);
    noiseFilter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 1.2);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.8);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(ctx.currentTime);

    // 2. 8-Bit Bitcrush Arpeggio
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'square';

    const pitches = [110, 880, 220, 1320, 160, 940, 260, 1760, 120, 520, 60];
    const stepTime = duration / pitches.length;

    pitches.forEach((freq, idx) => {
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * stepTime);
    });

    oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn('AudioContext glitch sound error:', err);
  }
}

export const GlitchTransition: React.FC<GlitchTransitionProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      document.body.classList.remove('glitching-screen');
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    // Play synthesized cyber glitch audio
    playGlitchSound();
    document.body.classList.add('glitching-screen');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ff9000', '#ff0055', '#00e5ff', '#ffffff', '#111116', '#ff4081'];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Random chunky pixel blocks
      const blockCount = 45 + Math.floor(Math.random() * 30);
      for (let i = 0; i < blockCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const w = Math.random() * 300 + 40;
        const h = Math.random() * 50 + 10;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.7 + Math.random() * 0.3;
        ctx.fillRect(x, y, w, h);
      }

      // Horizontal RGB glitch stripes
      for (let i = 0; i < 6; i++) {
        const y = Math.random() * canvas.height;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 144, 0, 0.55)' : 'rgba(0, 229, 255, 0.45)';
        ctx.fillRect(0, y, canvas.width, 10 + Math.random() * 25);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      document.body.classList.remove('glitching-screen');
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="glitch-overlay active" style={{ display: 'block', zIndex: 99999 }}>
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
        <div className="glitch-bar pixel-bar-6" />
        <div className="glitch-bar pixel-bar-7" />
      </div>
    </div>
  );
};
