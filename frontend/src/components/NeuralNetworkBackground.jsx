import React, { useEffect, useRef } from 'react';

/**
 * NeuralNetworkBackground
 * A high-performance, GPU-accelerated ambient canvas that renders an interconnected
 * neural network graph with synapsing nodes, organic velocity drift, action-potential pulses,
 * and delicate ivory/cyan/amber accents matching the StreetLens AI vision theme.
 */
export default function NeuralNetworkBackground({ opacity = 0.65 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track mouse for interactive neural probing
    const mouse = {
      x: null,
      y: null,
      maxDistance: 140
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      initNodes();
    };

    // Node definitions
    const CONNECTION_DIST = 135;
    let nodes = [];
    let pulses = [];

    const initNodes = () => {
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      // Calculate density: ~1 node per 22,000 px^2, clamped between 30 and 65
      const count = Math.min(65, Math.max(30, Math.floor((displayWidth * displayHeight) / 22000)));
      nodes = [];
      pulses = [];

      for (let i = 0; i < count; i++) {
        const isAccent = Math.random() < 0.22;
        const isCyan = isAccent && Math.random() < 0.5;
        nodes.push({
          x: Math.random() * displayWidth,
          y: Math.random() * displayHeight,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 1.5 + 1.2,
          baseAlpha: Math.random() * 0.35 + 0.25,
          colorType: isAccent ? (isCyan ? 'cyan' : 'amber') : 'ivory',
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.02
        });
      }
    };

    // Trigger random action potential pulses along active synapses
    const triggerPulse = () => {
      if (nodes.length < 2 || pulses.length > 6) return;
      // Pick a random node with neighbors
      const fromIdx = Math.floor(Math.random() * nodes.length);
      const fromNode = nodes[fromIdx];
      const validTargets = [];

      for (let j = 0; j < nodes.length; j++) {
        if (fromIdx === j) continue;
        const dx = fromNode.x - nodes[j].x;
        const dy = fromNode.y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          validTargets.push(nodes[j]);
        }
      }

      if (validTargets.length > 0) {
        const toNode = validTargets[Math.floor(Math.random() * validTargets.length)];
        pulses.push({
          from: fromNode,
          to: toNode,
          progress: 0,
          speed: 0.012 + Math.random() * 0.015,
          color: fromNode.colorType === 'cyan' ? '#38bdf8' : (fromNode.colorType === 'amber' ? '#f59e0b' : '#f5ebe1')
        });
      }
    };

    let pulseTimer = 0;

    // Handle high DPI initialization
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    initNodes();

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let lastTime = performance.now();
    const render = (currentTime) => {
      animationFrameId = requestAnimationFrame(render);

      // Throttling when document is hidden
      if (document.hidden) return;

      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Pulse spawn timer
      pulseTimer++;
      if (pulseTimer > 45) {
        triggerPulse();
        pulseTimer = 0;
      }

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Drift motion
        node.x += node.vx;
        node.y += node.vy;

        // Bounce gently off boundaries
        if (node.x < 0) { node.x = 0; node.vx *= -1; }
        else if (node.x > displayWidth) { node.x = displayWidth; node.vx *= -1; }

        if (node.y < 0) { node.y = 0; node.vy *= -1; }
        else if (node.y > displayHeight) { node.y = displayHeight; node.vy *= -1; }

        // Mouse gentle repulsion / reaction
        if (mouse.x !== null && mouse.y !== null) {
          const mdx = node.x - mouse.x;
          const mdy = node.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 70 && mdist > 0) {
            const force = (70 - mdist) / 70;
            node.x += (mdx / mdist) * force * 1.5;
            node.y += (mdy / mdist) * force * 1.5;
          }
        }

        // Pulse phase
        node.pulsePhase += node.pulseSpeed;
        const currentAlpha = node.baseAlpha + Math.sin(node.pulsePhase) * 0.15;

        // Draw connections to nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const edgeAlpha = (1 - dist / CONNECTION_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);

            // Subtle color tinting on edges
            if (node.colorType === 'cyan' || other.colorType === 'cyan') {
              ctx.strokeStyle = `rgba(56, 189, 248, ${edgeAlpha * 1.3})`;
            } else if (node.colorType === 'amber' || other.colorType === 'amber') {
              ctx.strokeStyle = `rgba(245, 158, 11, ${edgeAlpha * 1.2})`;
            } else {
              ctx.strokeStyle = `rgba(245, 235, 225, ${edgeAlpha})`;
            }

            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Connect to mouse if close
        if (mouse.x !== null && mouse.y !== null) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.maxDistance) {
            const mouseAlpha = (1 - dist / mouse.maxDistance) * 0.28;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(245, 235, 225, ${mouseAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }

        // Draw node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        if (node.colorType === 'cyan') {
          ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(1, currentAlpha + 0.2)})`;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
          ctx.shadowBlur = 6;
        } else if (node.colorType === 'amber') {
          ctx.fillStyle = `rgba(245, 158, 11, ${Math.min(1, currentAlpha + 0.2)})`;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = `rgba(245, 235, 225, ${currentAlpha})`;
          ctx.shadowColor = 'rgba(245, 235, 225, 0.35)';
          ctx.shadowBlur = 4;
        }
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // Draw Action Potential Pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          // Pulse arrived! Draw small terminal ripple
          ctx.beginPath();
          ctx.arc(pulse.to.x, pulse.to.y, pulse.to.radius * 2.8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245, 235, 225, 0.4)`;
          ctx.lineWidth = 1;
          ctx.stroke();

          pulses.splice(p, 1);
          continue;
        }

        const px = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.progress;
        const py = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = pulse.color;
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
      style={{ opacity }}
    />
  );
}
