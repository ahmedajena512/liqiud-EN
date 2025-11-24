import React, { useEffect, useRef } from 'react';

export const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Mouse state
    const mouse = { x: -1000, y: -1000, active: false };
    const clickPulse = { x: -1000, y: -1000, active: false, radius: 0 };

    interface Blob {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseRadius: number;
      angle: number;
      speed: number;
    }

    const blobs: Blob[] = [];
    const colors = [
      'rgba(6, 182, 212, 0.4)', // Cyan
      'rgba(59, 130, 246, 0.4)', // Blue
      'rgba(139, 92, 246, 0.3)', // Violet
      'rgba(217, 70, 239, 0.2)', // Fuchsia
    ];

    const initBlobs = () => {
      blobs.length = 0;
      const blobCount = 5; 
      
      for (let i = 0; i < blobCount; i++) {
        const radius = Math.random() * 300 + 150;
        blobs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: radius,
          baseRadius: radius,
          color: colors[i % colors.length],
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.002 + 0.001,
        });
      }
    };

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      angle: number;
    }
    
    const particles: Particle[] = [];
    const particleCount = 90; // Slightly increased for better mesh density

    const initParticles = () => {
        particles.length = 0;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3, // Slightly faster base movement
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 1.5,
                color: '255, 255, 255',
                alpha: Math.random() * 0.5 + 0.2,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      
      // High DPI scaling
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      initBlobs();
      initParticles();
    };

    // Event Listeners
    window.addEventListener('resize', handleResize);
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    
    const handleClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        clickPulse.x = e.clientX - rect.left;
        clickPulse.y = e.clientY - rect.top;
        clickPulse.active = true;
        clickPulse.radius = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // Initial init
    handleResize();

    // Render Loop
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw Deep Background Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#020617'); // Slate 950
      bgGradient.addColorStop(1, '#0f172a'); // Slate 900
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // --- A. Blobs (Ambient Background) ---
      ctx.globalCompositeOperation = 'screen';
      blobs.forEach(blob => {
        blob.x += blob.vx;
        blob.y += blob.vy;
        blob.angle += blob.speed;
        
        // Fluid radius pulsing
        blob.radius = blob.baseRadius + Math.sin(blob.angle) * 30;

        // Bounce off walls with buffer
        const buffer = blob.radius;
        if (blob.x < -buffer) blob.vx = Math.abs(blob.vx);
        if (blob.x > width + buffer) blob.vx = -Math.abs(blob.vx);
        if (blob.y < -buffer) blob.vy = Math.abs(blob.vy);
        if (blob.y > height + buffer) blob.vy = -Math.abs(blob.vy);

        // Draw Blob
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- B. Particles & Connections (Interactive Foreground) ---
      ctx.globalCompositeOperation = 'source-over';
      
      particles.forEach((p, i) => {
          // 1. Physics & Movement
          p.angle += 0.01; 
          p.vx += Math.cos(p.angle) * 0.002;
          p.vy += Math.sin(p.angle) * 0.002;

          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          // Mouse Attraction
          if (mouse.active) {
              const dx = mouse.x - p.x;
              const dy = mouse.y - p.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              if (dist < 250) {
                  const force = (250 - dist) / 250;
                  // Pull towards mouse
                  p.vx += (dx / dist) * force * 0.25;
                  p.vy += (dy / dist) * force * 0.25;
              }
          }

          // Click Shockwave
          if (clickPulse.active) {
            const dx = p.x - clickPulse.x;
            const dy = p.y - clickPulse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < clickPulse.radius + 60 && dist > Math.max(0, clickPulse.radius - 120)) {
                const force = 3;
                p.vx -= (dx / dist) * force;
                p.vy -= (dy / dist) * force;
            }
          }
          
          // Friction
          p.vx *= 0.94;
          p.vy *= 0.94;
          
          // 2. Draw Particle
          // Draw softly
          const flicker = Math.random() * 0.1;
          ctx.fillStyle = `rgba(${p.color}, ${Math.max(0, p.alpha - flicker)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // 3. Interactions with other particles (Plexus + Repulsion)
          for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j];
              const dx = p.x - p2.x;
              const dy = p.y - p2.y;
              const dist = Math.sqrt(dx*dx + dy*dy);

              // REPEL: Prevent clumping ("Not getting with each other")
              const minDistance = 60;
              if (dist < minDistance) {
                  const repelFactor = (minDistance - dist) / minDistance;
                  const fx = (dx / dist) * repelFactor * 0.5;
                  const fy = (dy / dist) * repelFactor * 0.5;
                  
                  p.vx += fx;
                  p.vy += fy;
                  p2.vx -= fx;
                  p2.vy -= fy;
              }

              // CONNECT: Draw lines
              const connectDistance = 130;
              if (dist < connectDistance) {
                  ctx.beginPath();
                  // Smoother opacity fade
                  const opacity = 0.25 * Math.pow(1 - dist / connectDistance, 1.5);
                  ctx.strokeStyle = `rgba(120, 220, 255, ${opacity})`;
                  // Taper line width based on distance
                  ctx.lineWidth = 0.8 * (1 - dist / connectDistance);
                  ctx.moveTo(p.x, p.y);
                  ctx.lineTo(p2.x, p2.y);
                  ctx.stroke();
              }
          }
      });

      // --- C. Click Ripple Visual ---
      if (clickPulse.active) {
          clickPulse.radius += 8; 
          const maxDist = Math.max(width, height) * 1.2;
          
          if (clickPulse.radius > maxDist) {
              clickPulse.active = false;
          } else {
              ctx.beginPath();
              ctx.arc(clickPulse.x, clickPulse.y, clickPulse.radius, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(100, 255, 255, ${Math.max(0, (1 - clickPulse.radius / 700) * 0.3)})`;
              ctx.lineWidth = 2;
              ctx.stroke();
          }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ease-in opacity-100"
      style={{ zIndex: 0 }}
    />
  );
};