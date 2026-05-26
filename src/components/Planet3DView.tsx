import React, { useRef, useEffect, useState } from 'react';
import { Planet } from '../types';
import { celestials } from '../data';
import { Play, Pause, ZoomIn, ZoomOut, RefreshCw, Layers, Compass } from 'lucide-react';

interface Planet3DViewProps {
  selectedPlanet: Planet | null;
  onSelectPlanet: (planet: Planet | null) => void;
  scaleMode: 'aesthetic' | 'realistic';
  setScaleMode: (mode: 'aesthetic' | 'realistic') => void;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
}

export default function Planet3DView({
  selectedPlanet,
  onSelectPlanet,
  scaleMode,
  setScaleMode,
}: Planet3DViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulation parameters
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [zoom, setZoom] = useState(1);
  
  // Camera state (Draggable rotation)
  const [yaw, setYaw] = useState(-0.5); // Rotation around vertical axis
  const [pitch, setPitch] = useState(0.4); // Rotation around horizontal axis (tilt)
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cameraAnglesStart = useRef({ yaw: 0, pitch: 0 });

  // Keep a running model time state to update positions
  const universeTime = useRef(0);

  // Generate static starfield stars once
  const stars = useRef<Star[]>([]);
  useEffect(() => {
    const generatedStars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      // Direct spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 500 + Math.random() * 300; // Far away

      generatedStars.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
      });
    }
    stars.current = generatedStars;
  }, []);

  // Track hover state for celestial elements
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null);
  const planetPositions = useRef<{ [key: string]: { x: number; y: number; r: number } }>({});

  // Auto resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = Math.max(container.clientHeight, 450);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Initial zoom adjusting based on screen size
    if (window.innerWidth < 768) {
      setZoom(0.7);
    } else {
      setZoom(1.0);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dragging event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    cameraAnglesStart.current = { yaw, pitch };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      // Update camera rotation with vertical clamp
      const sensitivity = 0.007;
      setYaw(cameraAnglesStart.current.yaw + dx * sensitivity);
      setPitch(
        Math.max(
          0.1, // Don't allow complete side view / underneath to avoid confusion
          Math.min(1.4, cameraAnglesStart.current.pitch + dy * sensitivity)
        )
      );
    } else {
      // Calculate hover state
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found: Planet | null = null;
      // Search in reverse order (closest first)
      const sortedIds = Object.keys(planetPositions.current);
      for (const id of sortedIds) {
        const pos = planetPositions.current[id];
        if (!pos) continue;
        const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);
        if (dist <= Math.max(pos.r, 8)) {
          found = celestials.find(p => p.id === id) || null;
          break;
        }
      }
      setHoveredPlanet(found);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicked any planet
    let clicked: Planet | null = null;
    for (const id of Object.keys(planetPositions.current)) {
      const pos = planetPositions.current[id];
      if (!pos) continue;
      const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);
      if (dist <= Math.max(pos.r, 10)) {
        clicked = celestials.find(p => p.id === id) || null;
        break;
      }
    }

    if (clicked) {
      onSelectPlanet(clicked);
    } else {
      // Check if we didn't drag and clicked in empty space to reset selection
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.hypot(dx, dy) < 3) {
        onSelectPlanet(null);
      }
    }
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    cameraAnglesStart.current = { yaw, pitch };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    
    const sensitivity = 0.008;
    setYaw(cameraAnglesStart.current.yaw + dx * sensitivity);
    setPitch(
      Math.max(
        0.1,
        Math.min(1.4, cameraAnglesStart.current.pitch + dy * sensitivity)
      )
    );
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Loop of Canvas animation
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = (timestamp: number) => {
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      if (isPlaying) {
        // Increment uniform time based on elapsed fraction and speed multiplier
        universeTime.current += delta * 0.0015 * speedMultiplier;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Absolute scaling factor base
      const scaleFactor = Math.min(canvas.width, canvas.height) * 0.45 * zoom;

      // 1. Draw Starfield
      stars.current.forEach((star) => {
        // Project star onto screen with camera tilt/yaw
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);

        // Rotate star coordinates
        const rx = star.x * cosY - star.z * sinY;
        const rz = star.x * sinY + star.z * cosY;
        const ry = star.y;

        const rx2 = rx;
        const ry2 = ry * cosP - rz * sinP;

        // Draw star with simple perspective zoom factor
        const screenX = centerX + rx2;
        const screenY = centerY + ry2;

        if (screenX >= 0 && screenX <= canvas.width && screenY >= 0 && screenY <= canvas.height) {
          // Sparkle simulation
          const sparkle = Math.sin(timestamp * 0.003 + star.x) * 0.2 + 0.8;
          ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * sparkle})`;
          ctx.fillRect(screenX, screenY, star.size, star.size);
        }
      });

      // 2. Compute Planet 3D Positions & Depths
      const planetProjected = celestials.map((body) => {
        // Custom orbit parameters
        let orbitRadius = body.distance;
        let scaleSize = body.radius;

        if (scaleMode === 'realistic') {
          // Logarithm-like mapping to allow dwarf planets and gas giants of actual sizes to represent
          if (body.id === 'sun') {
            orbitRadius = 0;
            scaleSize = 35;
          } else {
            // Realistic orbit offsets mapped elegantly
            const relDistances: { [key: string]: number } = {
              mercury: 20,
              venus: 35,
              earth: 50,
              mars: 75,
              jupiter: 125,
              saturn: 175,
              uranus: 235,
              neptune: 295,
              pluto: 335,
            };
            orbitRadius = relDistances[body.id] || body.distance;
            // Radius relative scaling
            const relSizes: { [key: string]: number } = {
              mercury: 4,
              venus: 9,
              earth: 10,
              mars: 6,
              jupiter: 24,
              saturn: 20,
              uranus: 14,
              neptune: 13,
              pluto: 2.5,
            };
            scaleSize = relSizes[body.id] || body.radius;
          }
        }

        // Orbital period scaling factors
        const periodFactor = {
          sun: 0,
          mercury: 4.15,
          venus: 1.62,
          earth: 1.0,
          mars: 0.53,
          jupiter: 0.084,
          saturn: 0.034,
          uranus: 0.012,
          neptune: 0.006,
          pluto: 0.004,
        }[body.id] || 1.0;

        // Current orbital position angle
        const angle = universeTime.current * periodFactor;

        // 3D coordinates on flat orbital table (X-Z plane is orbital flat, Y is vertical)
        const x3d = orbitRadius * Math.cos(angle);
        const y3d = 0;
        const z3d = orbitRadius * Math.sin(angle);

        // Standard yaw & pitch rotational transformations
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);

        // Rotation around Y (Yaw)
        const rx = x3d * cosY - z3d * sinY;
        const rz = x3d * sinY + z3d * cosY;
        const ry = y3d;

        // Rotation around X (Pitch)
        const rx2 = rx;
        const ry2 = ry * cosP - rz * sinP;
        const rz2 = ry * sinP + rz * cosP; // Projected depth! High means closer to camera

        // Zoom mapping
        const zoomFactor = scaleFactor / 300;
        const px = centerX + rx2 * zoomFactor;
        const py = centerY + ry2 * zoomFactor;
        
        // Perspective scaling depending on depth (closer looks slightly larger)
        const pScale = 1 + (rz2 / 400); 
        const renderRadius = Math.max(1.5, scaleSize * zoomFactor * pScale * 0.7);

        return {
          body,
          px,
          py,
          depth: rz2,
          renderRadius,
          orbitRadius,
        };
      });

      // 3. Draw Orbits (behind planets mostly, so draw first)
      planetProjected.forEach((planet) => {
        if (planet.body.id === 'sun') return;

        ctx.beginPath();
        const segments = 120;
        const zoomFactor = scaleFactor / 300;

        // Draw orbital projected ellipse
        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * Math.PI * 2;
          const ox = planet.orbitRadius * Math.cos(t);
          const oz = planet.orbitRadius * Math.sin(t);

          // Apply transform
          const cosY = Math.cos(yaw);
          const sinY = Math.sin(yaw);
          const cosP = Math.cos(pitch);
          const sinP = Math.sin(pitch);

          const rx = ox * cosY - oz * sinY;
          const rz = ox * sinY + oz * cosY;
          const ry2 = -rz * sinP;

          const sX = centerX + rx * zoomFactor;
          const sY = centerY + ry2 * zoomFactor;

          if (i === 0) ctx.moveTo(sX, sY);
          else ctx.lineTo(sX, sY);
        }

        const isFocused = selectedPlanet?.id === planet.body.id;
        const isHovered = hoveredPlanet?.id === planet.body.id;
        
        ctx.strokeStyle = isFocused
          ? 'rgba(59, 130, 246, 0.45)'
          : isHovered
            ? 'rgba(255, 255, 255, 0.35)'
            : 'rgba(255, 255, 255, 0.08)';
            
        ctx.lineWidth = isFocused ? 2 : isHovered ? 1.5 : 1;
        ctx.stroke();

        // Highlighting current orbit path as dashed glowing trail if chosen
        if (isFocused) {
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // 4. Depth Sorting For Beautiful 3D Overlaps
      const sortedProjected = [...planetProjected].sort((a, b) => a.depth - b.depth);

      // Keep screen mapping for click references
      const positions: { [key: string]: { x: number; y: number; r: number } } = {};

      // 5. Render Sun & Planets by Depth Order
      sortedProjected.forEach(({ body, px, py, renderRadius }) => {
        positions[body.id] = { x: px, y: py, r: renderRadius };

        ctx.save();

        // Dynamic planet glows
        const shadowGlow = ctx.createRadialGradient(px, py, renderRadius * 0.2, px, py, renderRadius * 2);
        shadowGlow.addColorStop(0, body.color);
        shadowGlow.addColorStop(0.3, body.color);
        shadowGlow.addColorStop(1, 'transparent');

        // Draw Orbiting halo glow for glowing objects
        if (body.id === 'sun' || selectedPlanet?.id === body.id || hoveredPlanet?.id === body.id) {
          ctx.fillStyle = body.glowColor;
          ctx.beginPath();
          ctx.arc(px, py, renderRadius * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Sphere
        ctx.beginPath();
        ctx.arc(px, py, renderRadius, 0, Math.PI * 2);
        
        // Spherical linear shader gradient to produce spherical lit-from-sun shadow
        const sphereGlow = ctx.createRadialGradient(
          px - renderRadius * 0.3,
          py - renderRadius * 0.3,
          renderRadius * 0.1,
          px,
          py,
          renderRadius
        );

        if (body.id === 'sun') {
          sphereGlow.addColorStop(0, '#ffffff');
          sphereGlow.addColorStop(0.2, '#fef08a');
          sphereGlow.addColorStop(0.6, body.color);
          sphereGlow.addColorStop(1, body.borderColor);
        } else {
          // Darkened shadow side facing away from Sun (0,0)
          sphereGlow.addColorStop(0, '#ffffff');
          sphereGlow.addColorStop(0.1, body.color);
          sphereGlow.addColorStop(0.9, body.borderColor);
          sphereGlow.addColorStop(1, '#0e1118'); // Absolute void darkness
        }

        ctx.fillStyle = sphereGlow;
        ctx.fill();

        // Draw Saturn's glorious Rings
        if (body.id === 'saturn') {
          ctx.beginPath();
          ctx.ellipse(
            px,
            py,
            renderRadius * 1.9,
            renderRadius * 0.5 * Math.abs(Math.sin(pitch)),
            yaw - 0.2,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
          ctx.lineWidth = renderRadius * 0.35;
          ctx.stroke();

          // Outer shadow rings overlap
          ctx.beginPath();
          ctx.ellipse(
            px,
            py,
            renderRadius * 2.3,
            renderRadius * 0.6 * Math.abs(Math.sin(pitch)),
            yaw - 0.2,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.15)';
          ctx.lineWidth = renderRadius * 0.1;
          ctx.stroke();
        }

        // Selected highlights
        if (selectedPlanet?.id === body.id) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, renderRadius + 4, 0, Math.PI * 2);
          ctx.stroke();

          // Target reticle
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, renderRadius + 10, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw Text Labels for major objects or when hovered
        const showLabel = selectedPlanet?.id === body.id || hoveredPlanet?.id === body.id || renderRadius > 8;
        if (showLabel) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 4;
          ctx.fillText(body.nameIndo, px, py - renderRadius - 8);
          ctx.shadowBlur = 0; // Restore shadow
        }

        ctx.restore();
      });

      planetPositions.current = positions;
      animationId = requestAnimationFrame(drawFrame);
    };

    animationId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, speedMultiplier, zoom, yaw, pitch, scaleMode, selectedPlanet, hoveredPlanet]);

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.15));
  const handleZoomOut = () => setZoom(prev => Math.max(0.3, prev - 0.15));
  const handleResetCamera = () => {
    setYaw(-0.5);
    setPitch(0.4);
    setZoom(1.0);
  };

  return (
    <div id="solar-system-stage" className="relative flex flex-col h-full bg-[#05060b] rounded-2xl overflow-hidden border border-slate-800/60 shadow-2xl">
      {/* 3D Canvas */}
      <div 
        ref={containerRef} 
        className="relative flex-grow min-h-[450px] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMouseClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* Floating Instruction overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold tracking-wider uppercase">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Navigasi 3D</span>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-relaxed max-w-[190px]">
            Tarik (drag) untuk memutar sistem tata surya 3D. Ketuk planet untuk mendalami detail.
          </p>
        </div>

        {/* Planet Quick selector pill */}
        <div className="absolute bottom-4 left-4 flex gap-1.5 flex-wrap max-w-[85%] sm:max-w-full">
          <button
            onClick={() => onSelectPlanet(null)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
              !selectedPlanet
                ? 'bg-blue-600/35 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            Sistem Utama
          </button>
          {celestials.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPlanet(p)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
                selectedPlanet?.id === p.id
                  ? 'bg-blue-600/35 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {p.nameIndo}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-md">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center"
            title={isPlaying ? 'Pause Revolusi' : 'Putar Revolusi'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* Time speed selection */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg p-0.5">
            {[1, 5, 20].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  speedMultiplier === s
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x Waktu
              </button>
            ))}
          </div>
        </div>

        {/* View Scaling Modes */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900/80 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setScaleMode('aesthetic')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                scaleMode === 'aesthetic'
                  ? 'bg-blue-600/35 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Skala Estetik</span>
            </button>
            <button
              onClick={() => setScaleMode('realistic')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                scaleMode === 'realistic'
                  ? 'bg-blue-600/35 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Skala Proporsional</span>
            </button>
          </div>
        </div>

        {/* Camera Operations */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center"
            title="Perkecil Kamera"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center"
            title="Perbesar Kamera"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center"
            title="Reset Sudut Pandang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
