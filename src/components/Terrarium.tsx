import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VoidlingState, FoodItem } from '../types';
import { sound } from '../audio/soundEngine';
import { Sparkles, Zap, Target, CircleDot, RefreshCw } from 'lucide-react';

interface TerrariumProps {
  state: VoidlingState;
  onPet: () => void;
  onFeedItem?: FoodItem | null;
  onClearFeedItem?: () => void;
  onStateUpdate: (updater: (prev: VoidlingState) => VoidlingState) => void;
}

interface PhysicsFood {
  x: number;
  y: number;
  vx: number;
  vy: number;
  item: FoodItem;
  size: number;
  rotation: number;
  vRot: number;
}

interface PhysicsBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface TentacleSegment {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

export const Terrarium: React.FC<TerrariumProps> = ({
  state,
  onPet,
  onFeedItem,
  onClearFeedItem,
  onStateUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Lab Toy
  const [activeToy, setActiveToy] = useState<'none' | 'laser' | 'ball' | 'tesla'>('none');

  // Creature Physics state
  const creatureRef = useRef({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    targetX: 400,
    targetY: 300,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    eyeLookX: 0,
    eyeLookY: 0,
    blinkProgress: 0,
    isBlinking: false,
    lastBlinkTime: Date.now(),
    squishX: 1,
    squishY: 1,
    breathPhase: 0,
    tentacles: [] as TentacleSegment[][],
  });

  const mousePosRef = useRef({ x: 400, y: 300, isOver: false });
  const foodsRef = useRef<PhysicsFood[]>([]);
  const ballRef = useRef<PhysicsBall | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const teslaArcsRef = useRef<{ x1: number; y1: number; x2: number; y2: number; points: { x: number; y: number }[]; timer: number }[]>([]);

  // Initialize or re-init tentacles based on mutations
  const numTentacles = state.activeMutations.includes('mut_void_tendrils') ? 8 : 4;
  const segmentsPerTentacle = 14;

  useEffect(() => {
    const creature = creatureRef.current;
    creature.tentacles = [];
    for (let t = 0; t < numTentacles; t++) {
      const segs: TentacleSegment[] = [];
      const angle = (t / numTentacles) * Math.PI * 2;
      for (let s = 0; s < segmentsPerTentacle; s++) {
        segs.push({
          x: creature.x + Math.cos(angle) * (s * 8),
          y: creature.y + Math.sin(angle) * (s * 8),
          prevX: creature.x,
          prevY: creature.y,
        });
      }
      creature.tentacles.push(segs);
    }
  }, [numTentacles]);

  // Handle incoming food dropped from inventory
  useEffect(() => {
    if (onFeedItem && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const spawnX = Math.random() * (rect.width - 120) + 60;
      foodsRef.current.push({
        x: spawnX,
        y: 40,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random(),
        item: onFeedItem,
        size: 26,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.05,
      });
      if (onClearFeedItem) onClearFeedItem();
    }
  }, [onFeedItem, onClearFeedItem]);

  // Handle toy selection
  const selectToy = (toy: 'none' | 'laser' | 'ball' | 'tesla') => {
    sound.playHackChirp();
    if (activeToy === toy) {
      setActiveToy('none');
      if (toy === 'ball') ballRef.current = null;
    } else {
      setActiveToy(toy);
      if (toy === 'ball' && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        ballRef.current = {
          x: rect.width / 2,
          y: 80,
          vx: (Math.random() - 0.5) * 4,
          vy: 2,
          radius: 18,
        };
      }
    }
  };

  // Spark / Heart particle emitter
  const emitParticles = useCallback((x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        alpha: 1,
        color,
        life: 0,
        maxLife: Math.random() * 30 + 20,
      });
    }
  }, []);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const creature = creatureRef.current;
    creature.x = canvas.clientWidth / 2;
    creature.y = canvas.clientHeight / 2;
    creature.targetX = creature.x;
    creature.targetY = creature.y;

    // Ambient stars background
    const stars: { x: number; y: number; s: number; a: number; v: number }[] = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        s: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.7 + 0.2,
        v: (Math.random() - 0.5) * 0.02,
      });
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Space & Starfield
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, width, height);

      // Starfield
      stars.forEach(star => {
        star.a += star.v;
        if (star.a < 0.1 || star.a > 0.8) star.v = -star.v;
        ctx.fillStyle = `rgba(180, 220, 255, ${star.a})`;
        ctx.fillRect(star.x % width, star.y % height, star.s, star.s);
      });

      // Bio-containment Grid & Energy Field
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Creature Behavior AI & Target Calculation
      const hasFood = foodsRef.current.length > 0;
      const laserActive = activeToy === 'laser' && mousePosRef.current.isOver;

      if (creature.isDragging) {
        creature.targetX = mousePosRef.current.x - creature.dragOffsetX;
        creature.targetY = mousePosRef.current.y - creature.dragOffsetY;
      } else if (hasFood) {
        // Lunge toward nearest food
        const food = foodsRef.current[0];
        creature.targetX = food.x;
        creature.targetY = food.y;
      } else if (laserActive) {
        // Frantically chase laser dot!
        creature.targetX = mousePosRef.current.x;
        creature.targetY = mousePosRef.current.y;
      } else if (activeToy === 'ball' && ballRef.current) {
        // Track the bouncing ball playfully
        creature.targetX = ballRef.current.x;
        creature.targetY = ballRef.current.y + 40;
      } else {
        // Organic gentle wandering around terrarium center
        creature.breathPhase += dt * 1.5;
        const wanderX = (width / 2) + Math.sin(creature.breathPhase * 0.7) * (width * 0.25);
        const wanderY = (height / 2) + Math.cos(creature.breathPhase * 1.1) * (height * 0.2);
        creature.targetX = wanderX;
        creature.targetY = wanderY;
      }

      // Smooth lerp physics toward target
      const followSpeed = laserActive ? 6.5 : hasFood ? 4.5 : 2.0;
      creature.vx += (creature.targetX - creature.x) * followSpeed * dt;
      creature.vy += (creature.targetY - creature.y) * followSpeed * dt;
      creature.vx *= 0.88; // Damping
      creature.vy *= 0.88;

      creature.x += creature.vx;
      creature.y += creature.vy;

      // Keep creature bounded in terrarium
      const radius = 38 + state.stage * 4;
      creature.x = Math.max(radius + 20, Math.min(width - radius - 20, creature.x));
      creature.y = Math.max(radius + 20, Math.min(height - radius - 20, creature.y));

      // Squish recovery
      creature.squishX += (1 - creature.squishX) * 0.15;
      creature.squishY += (1 - creature.squishY) * 0.15;

      // Blinking AI
      if (!creature.isBlinking && Date.now() - creature.lastBlinkTime > 3200 + Math.random() * 3000) {
        creature.isBlinking = true;
        creature.blinkProgress = 0;
      }
      if (creature.isBlinking) {
        creature.blinkProgress += dt * 8;
        if (creature.blinkProgress >= 1) {
          creature.isBlinking = false;
          creature.lastBlinkTime = Date.now();
        }
      }

      // Eye look direction (towards mouse or food)
      const lookTargetX = laserActive || mousePosRef.current.isOver ? mousePosRef.current.x : hasFood ? foodsRef.current[0].x : width / 2;
      const lookTargetY = laserActive || mousePosRef.current.isOver ? mousePosRef.current.y : hasFood ? foodsRef.current[0].y : height / 2;
      const dx = lookTargetX - creature.x;
      const dy = lookTargetY - creature.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const maxEyeOffset = 8;
      creature.eyeLookX += ((dx / dist) * Math.min(maxEyeOffset, dist * 0.1) - creature.eyeLookX) * 0.2;
      creature.eyeLookY += ((dy / dist) * Math.min(maxEyeOffset, dist * 0.1) - creature.eyeLookY) * 0.2;

      // 3. Update & Draw Tentacles (Verlet physics with wave propulsion)
      const themeColors: Record<string, { core: string; glow: string; pupil: string }> = {
        cyan: { core: '#00f3ff', glow: 'rgba(0, 243, 255, 0.4)', pupil: '#002533' },
        magenta: { core: '#ff007f', glow: 'rgba(255, 0, 127, 0.4)', pupil: '#330018' },
        green: { core: '#00ff88', glow: 'rgba(0, 255, 136, 0.4)', pupil: '#003318' },
        amber: { core: '#ffb800', glow: 'rgba(255, 184, 0, 0.4)', pupil: '#332500' },
        purple: { core: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', pupil: '#240038' },
      };
      const colors = themeColors[state.colorTheme] || themeColors.cyan;

      // Draw Spectral Wings if unlocked (mut_spectral_wings)
      if (state.activeMutations.includes('mut_spectral_wings')) {
        const wingFlap = Math.sin(time * 0.005) * 18;
        ctx.save();
        ctx.translate(creature.x, creature.y);
        ctx.strokeStyle = colors.core;
        ctx.fillStyle = colors.glow;
        ctx.lineWidth = 2;

        // Left Wing
        ctx.beginPath();
        ctx.moveTo(-15, -10);
        ctx.bezierCurveTo(-70, -60 + wingFlap, -90, 10 + wingFlap, -20, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right Wing
        ctx.beginPath();
        ctx.moveTo(15, -10);
        ctx.bezierCurveTo(70, -60 - wingFlap, 90, 10 - wingFlap, 20, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Draw Tentacles
      creature.tentacles.forEach((tentacle, tIdx) => {
        const baseAngle = (tIdx / creature.tentacles.length) * Math.PI * 2 + Math.PI / 2;
        const rootX = creature.x + Math.cos(baseAngle) * (radius * 0.6);
        const rootY = creature.y + Math.sin(baseAngle) * (radius * 0.6);

        // Anchor first segment to creature body
        if (tentacle[0]) {
          tentacle[0].x = rootX;
          tentacle[0].y = rootY;
        }

        // Wave undulation
        const wave = Math.sin(time * 0.004 + tIdx * 1.2) * 5;

        for (let i = 1; i < tentacle.length; i++) {
          const seg = tentacle[i];
          const prevSeg = tentacle[i - 1];

          // Verlet velocity
          const vx = (seg.x - seg.prevX) * 0.92;
          const vy = (seg.y - seg.prevY) * 0.92 + 0.15; // Subtle buoyant gravity

          seg.prevX = seg.x;
          seg.prevY = seg.y;

          seg.x += vx + wave * 0.05 * (i / tentacle.length);
          seg.y += vy;

          // Constraint to previous segment
          const segDist = 7;
          const cdx = seg.x - prevSeg.x;
          const cdy = seg.y - prevSeg.y;
          const currentDist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
          const factor = (currentDist - segDist) / currentDist;

          seg.x -= cdx * factor * 0.85;
          seg.y -= cdy * factor * 0.85;
        }

        // Draw Tentacle Spine & Glow
        ctx.beginPath();
        ctx.moveTo(tentacle[0].x, tentacle[0].y);
        for (let i = 1; i < tentacle.length - 1; i++) {
          const xc = (tentacle[i].x + tentacle[i + 1].x) / 2;
          const yc = (tentacle[i].y + tentacle[i + 1].y) / 2;
          ctx.quadraticCurveTo(tentacle[i].x, tentacle[i].y, xc, yc);
        }

        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.strokeStyle = colors.core;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Tip Node (luminescent bulb)
        const tip = tentacle[tentacle.length - 1];
        if (tip) {
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = colors.core;
          ctx.shadowColor = colors.core;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 4. Draw Core Creature Body
      ctx.save();
      ctx.translate(creature.x, creature.y);
      ctx.scale(creature.squishX, creature.squishY);

      // Bioluminescent Outer Aura
      const outerGlow = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 1.5);
      outerGlow.addColorStop(0, colors.glow);
      outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Glitch Distortion Ring (mut_glitch_halo)
      if (state.activeMutations.includes('mut_glitch_halo')) {
        ctx.save();
        ctx.rotate(time * 0.002);
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 12]);
        ctx.strokeRect(-radius * 1.25, -radius * 1.25, radius * 2.5, radius * 2.5);
        ctx.restore();
      }

      // Creature Body Sphere
      const bodyGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.35, colors.core);
      bodyGrad.addColorStop(0.85, '#0a1020');
      bodyGrad.addColorStop(1, '#050810');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.core;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eye
      const eyeRadius = radius * 0.42;
      const eyeBlink = creature.isBlinking ? Math.sin(creature.blinkProgress * Math.PI) : 0;
      const eyeH = Math.max(1, eyeRadius * (1 - eyeBlink));

      ctx.save();
      ctx.scale(1, eyeH / eyeRadius);

      // Sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Iris & Pupil
      const pupilRadius = eyeRadius * 0.58;
      const pupilGrad = ctx.createRadialGradient(
        creature.eyeLookX * 0.5,
        creature.eyeLookY * 0.5,
        2,
        creature.eyeLookX,
        creature.eyeLookY,
        pupilRadius
      );
      pupilGrad.addColorStop(0, colors.core);
      pupilGrad.addColorStop(0.7, colors.pupil);
      pupilGrad.addColorStop(1, '#000000');

      ctx.fillStyle = pupilGrad;
      ctx.beginPath();
      ctx.arc(creature.eyeLookX, creature.eyeLookY, pupilRadius, 0, Math.PI * 2);
      ctx.fill();

      // Specular Reflection Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(creature.eyeLookX - pupilRadius * 0.35, creature.eyeLookY - pupilRadius * 0.35, pupilRadius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // End Eye

      ctx.restore(); // End Creature Body

      // 5. Update & Draw Food Physics
      for (let i = foodsRef.current.length - 1; i >= 0; i--) {
        const food = foodsRef.current[i];
        food.x += food.vx;
        food.y += food.vy;
        food.vy += 0.08; // Gravity
        food.rotation += food.vRot;

        // Bounce on ground / walls
        if (food.y > height - 25) {
          food.y = height - 25;
          food.vy = -food.vy * 0.6;
          food.vx *= 0.85;
        }
        if (food.x < 25 || food.x > width - 25) {
          food.vx = -food.vx * 0.8;
        }

        // Draw Food Emoji / Icon
        ctx.save();
        ctx.translate(food.x, food.y);
        ctx.rotate(food.rotation);
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(food.item.icon, 0, 0);

        // Food glow ring
        ctx.strokeStyle = food.item.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Creature eat detection
        const fdx = food.x - creature.x;
        const fdy = food.y - creature.y;
        const fdist = Math.sqrt(fdx * fdx + fdy * fdy);

        if (fdist < radius + 15) {
          // GOBBLE FOOD!
          sound.playFeed();
          emitParticles(food.x, food.y, food.item.color, 24);

          // Squish creature with joy
          creature.squishX = 1.35;
          creature.squishY = 0.75;

          // Update Game State
          const eatenItem = food.item;
          onStateUpdate(prev => {
            const newSatiety = Math.min(100, prev.satiety + eatenItem.satietyGain);
            const newEnergy = Math.min(100, prev.energy + eatenItem.energyGain);
            const newCorruption = Math.max(0, Math.min(100, prev.corruption + eatenItem.corruptionDelta));
            const newXp = prev.xp + eatenItem.xpGain;
            const newFoodCount = prev.stats.foodEaten + 1;

            let nextStage = prev.stage;
            let nextMaxXp = prev.maxXp;
            let nextLevel = prev.level;

            if (newXp >= prev.maxXp && prev.stage < 5) {
              nextStage = (prev.stage + 1) as any;
              nextLevel += 1;
              sound.playLevelUp();
            }

            return {
              ...prev,
              satiety: newSatiety,
              energy: newEnergy,
              corruption: newCorruption,
              xp: newXp,
              stage: nextStage,
              level: nextLevel,
              maxXp: nextMaxXp,
              mood: 'ecstatic',
              stats: {
                ...prev.stats,
                foodEaten: newFoodCount,
              },
              speechBubble: `*CHOMP!* ${eatenItem.name} consumed! Delicious bytes!`,
              speechBubbleTimeout: 4000,
            };
          });

          foodsRef.current.splice(i, 1);
        }
      }

      // 6. Antimatter Ball Physics (if active)
      if (ballRef.current) {
        const ball = ballRef.current;
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += 0.2; // Gravity

        // Wall collisions
        if (ball.x < ball.radius) {
          ball.x = ball.radius;
          ball.vx = -ball.vx * 0.85;
          sound.playHackChirp();
        }
        if (ball.x > width - ball.radius) {
          ball.x = width - ball.radius;
          ball.vx = -ball.vx * 0.85;
          sound.playHackChirp();
        }
        if (ball.y > height - ball.radius) {
          ball.y = height - ball.radius;
          ball.vy = -ball.vy * 0.82;
          ball.vx *= 0.94;
          if (Math.abs(ball.vy) > 1.5) sound.playHackChirp();
        }

        // Creature collision with ball (bat it away!)
        const bdx = ball.x - creature.x;
        const bdy = ball.y - creature.y;
        const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
        if (bdist < radius + ball.radius) {
          const nx = bdx / (bdist || 1);
          const ny = bdy / (bdist || 1);
          ball.vx = nx * 8 + creature.vx * 1.5;
          ball.vy = ny * 8 - 4;
          sound.playPurr();
          emitParticles(ball.x, ball.y, '#00f3ff', 8);
          creature.squishX = 0.85;
          creature.squishY = 1.25;
        }

        // Draw Antimatter Ball
        const ballGrad = ctx.createRadialGradient(ball.x - 4, ball.y - 4, 2, ball.x, ball.y, ball.radius);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.4, '#a855f7');
        ballGrad.addColorStop(1, '#3b0764');

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 7. Laser Pointer rendering (if active)
      if (laserActive) {
        const lx = mousePosRef.current.x;
        const ly = mousePosRef.current.y;

        // Laser beam dot
        ctx.beginPath();
        ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff003c';
        ctx.shadowColor = '#ff003c';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Laser reticle ring
        ctx.beginPath();
        ctx.arc(lx, ly, 16 + Math.sin(time * 0.01) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 60, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 8. Tesla Lightning Arcs
      for (let i = teslaArcsRef.current.length - 1; i >= 0; i--) {
        const arc = teslaArcsRef.current[i];
        arc.timer -= dt;
        if (arc.timer <= 0) {
          teslaArcsRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(arc.points[0].x, arc.points[0].y);
        for (let p = 1; p < arc.points.length; p++) {
          ctx.lineTo(arc.points[p].x, arc.points[p].y);
        }
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 9. Particles rendering & physics
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [state.stage, state.colorTheme, state.activeMutations, activeToy, emitParticles, onStateUpdate]);

  // Handle Creature Interaction (Click & Pet)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const creature = creatureRef.current;
    const dx = mouseX - creature.x;
    const dy = mouseY - creature.y;
    const radius = 38 + state.stage * 4;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If active toy is Tesla, zap creature on click!
    if (activeToy === 'tesla') {
      sound.playZap();
      // Generate jagged arc from top corner to creature
      const startX = 60;
      const startY = 40;
      const steps = 8;
      const points = [{ x: startX, y: startY }];
      for (let s = 1; s < steps; s++) {
        const frac = s / steps;
        points.push({
          x: startX + (creature.x - startX) * frac + (Math.random() - 0.5) * 45,
          y: startY + (creature.y - startY) * frac + (Math.random() - 0.5) * 45,
        });
      }
      points.push({ x: creature.x, y: creature.y });
      teslaArcsRef.current.push({ x1: startX, y1: startY, x2: creature.x, y2: creature.y, points, timer: 0.15 });

      emitParticles(creature.x, creature.y, '#00f3ff', 20);
      creature.squishX = 1.4;
      creature.squishY = 0.7;

      onStateUpdate(prev => ({
        ...prev,
        energy: Math.min(100, prev.energy + 15),
        xenon: prev.xenon + 5,
        speechBubble: "*BZZZZZT!* Electro-cells charged to 100%!",
        speechBubbleTimeout: 3000,
      }));
      return;
    }

    if (dist <= radius) {
      // Petting creature!
      sound.playPet();
      sound.playPurr();
      creature.isDragging = true;
      creature.dragOffsetX = mouseX - creature.x;
      creature.dragOffsetY = mouseY - creature.y;
      creature.squishX = 0.8;
      creature.squishY = 1.25;

      emitParticles(mouseX, mouseY, '#00f3ff', 16);
      onPet();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current.x = e.clientX - rect.left;
    mousePosRef.current.y = e.clientY - rect.top;
    mousePosRef.current.isOver = true;
  };

  const handleMouseLeave = () => {
    mousePosRef.current.isOver = false;
    creatureRef.current.isDragging = false;
  };

  const handleMouseUp = () => {
    creatureRef.current.isDragging = false;
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 60 FPS Interactive Creature Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Floating Creature Speech Bubble */}
      {state.speechBubble && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-slate-900/90 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,243,255,0.35)] backdrop-blur-md pointer-events-none transition-all duration-300"
          style={{ maxWidth: '85%' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
              [{state.name}]:
            </span>
            <span className="text-sm font-medium text-slate-100">
              {state.speechBubble}
            </span>
          </div>
        </div>
      )}

      {/* Lab Sandbox Physics Toys Toolbar */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/60 backdrop-blur-md">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden sm:inline mr-1">
          LAB TOYS:
        </span>

        {/* Laser Pointer */}
        <button
          onClick={() => selectToy('laser')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
            activeToy === 'laser'
              ? 'bg-red-500/30 border border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
              : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
          }`}
          title="Laser Pointer (Voidling frantically chases the red laser dot!)"
        >
          <Target className="w-3.5 h-3.5 text-red-400" />
          <span>LASER</span>
        </button>

        {/* Antimatter Ball */}
        <button
          onClick={() => selectToy('ball')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
            activeToy === 'ball'
              ? 'bg-purple-500/30 border border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
              : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
          }`}
          title="Antimatter Ball (Physics bouncing ball that your pet plays with!)"
        >
          <CircleDot className="w-3.5 h-3.5 text-purple-400" />
          <span>GRAV-BALL</span>
        </button>

        {/* Tesla Coil */}
        <button
          onClick={() => selectToy('tesla')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
            activeToy === 'tesla'
              ? 'bg-cyan-500/30 border border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.5)]'
              : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
          }`}
          title="Tesla Coil (Click anywhere to zap and charge Voidling with electricity!)"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>TESLA ZAP</span>
        </button>
      </div>

      {/* Terrarium Vital Stats Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-700/60 backdrop-blur-md min-w-[170px]">
        {/* Satiety */}
        <div>
          <div className="flex justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400">SATIETY</span>
            <span className="text-cyan-400 font-bold">{Math.round(state.satiety)}%</span>
          </div>
          <div className="cyber-meter-track">
            <div 
              className="cyber-meter-fill bg-cyan-400" 
              style={{ width: `${state.satiety}%` }} 
            />
          </div>
        </div>

        {/* Energy */}
        <div>
          <div className="flex justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400">ENERGY</span>
            <span className="text-amber-400 font-bold">{Math.round(state.energy)}%</span>
          </div>
          <div className="cyber-meter-track">
            <div 
              className="cyber-meter-fill bg-amber-400" 
              style={{ width: `${state.energy}%` }} 
            />
          </div>
        </div>

        {/* Resonance */}
        <div>
          <div className="flex justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400">RESONANCE</span>
            <span className="text-purple-400 font-bold">{Math.round(state.resonance)}%</span>
          </div>
          <div className="cyber-meter-track">
            <div 
              className="cyber-meter-fill bg-purple-400" 
              style={{ width: `${state.resonance}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
