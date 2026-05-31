'use client';

import { useEffect, useRef } from 'react';

export default function AmbientBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const circles: { x: number; y: number; r: number; dx: number; dy: number; color: string }[] = [];
    const colors = ['rgba(124,58,237,0.08)', 'rgba(6,182,212,0.06)', 'rgba(236,72,153,0.05)'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 5; i++) {
      circles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 100 + Math.random() * 200,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        color: colors[i % colors.length],
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      circles.forEach(c => {
        c.x += c.dx;
        c.y += c.dy;
        if (c.x < -c.r) c.x = canvas.width + c.r;
        if (c.x > canvas.width + c.r) c.x = -c.r;
        if (c.y < -c.r) c.y = canvas.height + c.r;
        if (c.y > canvas.height + c.r) c.y = -c.r;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}
