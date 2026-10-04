/**
 * High-performance, zero-dependency confetti cannon for celebrating achievements,
 * leveling up, and unlocking badges.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'star';
  opacity: number;
  decay: number;
}

const PALETTES = [
  '#0284c7', // Sky
  '#0ea5e9', // Light sky
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber / Gold
  '#10b981', // Emerald
  '#14b8a6', // Teal
];

export function triggerConfetti(options?: {
  particleCount?: number;
  origin?: { x: number; y: number };
}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const count = options?.particleCount || 100;
  const originX = options?.origin ? options.origin.x : window.innerWidth / 2;
  const originY = options?.origin ? options.origin.y : window.innerHeight / 3;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  const shapes: Array<'rect' | 'circle' | 'star'> = ['rect', 'circle', 'star'];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 9 + 4;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
      vy: Math.sin(angle) * speed - Math.random() * 6 - 2,
      size: Math.random() * 7 + 4,
      color: PALETTES[Math.floor(Math.random() * PALETTES.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      opacity: 1,
      decay: Math.random() * 0.012 + 0.008,
    });
  }

  let animationFrameId: number;

  const render = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeParticles = 0;

    for (const p of particles) {
      if (p.opacity <= 0) continue;
      activeParticles++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.vx *= 0.985; // Air resistance
      p.rotation += p.rotationSpeed;
      p.opacity -= p.decay;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        // Star shape
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(
            Math.cos(((18 + j * 72) * Math.PI) / 180) * p.size,
            -Math.sin(((18 + j * 72) * Math.PI) / 180) * p.size
          );
          ctx.lineTo(
            Math.cos(((54 + j * 72) * Math.PI) / 180) * (p.size / 2),
            -Math.sin(((54 + j * 72) * Math.PI) / 180) * (p.size / 2)
          );
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  };

  animationFrameId = requestAnimationFrame(render);
}
