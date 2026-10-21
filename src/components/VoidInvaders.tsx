import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VoidlingState } from '../types';
import { sound } from '../audio/soundEngine';
import confetti from 'canvas-confetti';
import { Shield, Play, RotateCcw, Crosshair, Award } from 'lucide-react';

interface VoidInvadersProps {
  state: VoidlingState;
  onStateUpdate: (updater: (prev: VoidlingState) => VoidlingState) => void;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  icon: string;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export const VoidInvaders: React.FC<VoidInvadersProps> = ({
  state,
  onStateUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);

  // Game internal state ref
  const gameRef = useRef({
    playerX: 300,
    playerTargetX: 300,
    projectiles: [] as Projectile[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    lastShotTime: 0,
    spawnTimer: 0,
    keys: { left: false, right: false, shoot: false },
  });

  const fireInterval = state.activeMutations.includes('mut_tesla_sparks') ? 160 : 250;

  const startGame = () => {
    sound.playHackChirp();
    const game = gameRef.current;
    game.playerX = 300;
    game.playerTargetX = 300;
    game.projectiles = [];
    game.enemies = [];
    game.particles = [];
    game.spawnTimer = 0;
    setScore(0);
    setEnemiesDefeated(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) gameRef.current.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) gameRef.current.keys.right = true;
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
        gameRef.current.keys.shoot = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) gameRef.current.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) gameRef.current.keys.right = false;
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) gameRef.current.keys.shoot = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main arcade game loop
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localScore = score;
    let localDefeated = enemiesDefeated;

    const ENEMY_TYPES = [
      { icon: '👾', hp: 1, color: '#f43f5e', speed: 1.2 },
      { icon: '💀', hp: 2, color: '#a855f7', speed: 1.0 },
      { icon: '☣️', hp: 3, color: '#eab308', speed: 0.7 },
    ];

    const shootPlasma = (x: number, y: number) => {
      sound.playShoot();
      gameRef.current.projectiles.push({
        x,
        y: y - 20,
        vx: 0,
        vy: -9,
        radius: 4,
      });
      gameRef.current.lastShotTime = performance.now();
    };

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const game = gameRef.current;

      ctx.clearRect(0, 0, width, height);

      // Cyber Arcade Background
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, width, height);

      // Starfield streaks
      ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
      for (let s = 0; s < 25; s++) {
        const sx = (s * 37) % width;
        const sy = (performance.now() * 0.2 + s * 53) % height;
        ctx.fillRect(sx, sy, 2, 8);
      }

      // 1. Player movement
      const moveSpeed = 6;
      if (game.keys.left) game.playerX -= moveSpeed;
      if (game.keys.right) game.playerX += moveSpeed;
      game.playerX = Math.max(30, Math.min(width - 30, game.playerX));

      // Player auto/manual shooting
      if (game.keys.shoot && performance.now() - game.lastShotTime > fireInterval) {
        shootPlasma(game.playerX, height - 50);
      }

      // Draw Player (The Voidling Guardian)
      ctx.save();
      ctx.translate(game.playerX, height - 45);

      // Body glow
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eye
      ctx.beginPath();
      ctx.arc(0, -2, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -4, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#002533';
      ctx.fill();

      ctx.restore();

      // 2. Projectiles update
      for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const p = game.projectiles[i];
        p.y += p.vy;

        // Draw projectile
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.y < 0) {
          game.projectiles.splice(i, 1);
        }
      }

      // 3. Enemy spawning
      game.spawnTimer++;
      if (game.spawnTimer > 45) {
        game.spawnTimer = 0;
        const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        game.enemies.push({
          x: Math.random() * (width - 80) + 40,
          y: -20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: type.speed + Math.random() * 0.5,
          radius: 18,
          hp: type.hp,
          maxHp: type.hp,
          icon: type.icon,
          color: type.color,
        });
      }

      // 4. Enemies update & collisions
      for (let eIdx = game.enemies.length - 1; eIdx >= 0; eIdx--) {
        const enemy = game.enemies[eIdx];
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        if (enemy.x < enemy.radius || enemy.x > width - enemy.radius) {
          enemy.vx = -enemy.vx;
        }

        // Draw Enemy
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.icon, 0, 0);

        // HP bar above enemy
        if (enemy.maxHp > 1) {
          const barW = 24;
          const barH = 3;
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(-barW / 2, -18, barW, barH);
          ctx.fillStyle = enemy.color;
          ctx.fillRect(-barW / 2, -18, barW * (enemy.hp / enemy.maxHp), barH);
        }
        ctx.restore();

        // Projectile collisions
        for (let pIdx = game.projectiles.length - 1; pIdx >= 0; pIdx--) {
          const p = game.projectiles[pIdx];
          const cdx = p.x - enemy.x;
          const cdy = p.y - enemy.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < enemy.radius + p.radius) {
            game.projectiles.splice(pIdx, 1);
            enemy.hp--;

            // Hit spark
            for (let s = 0; s < 4; s++) {
              game.particles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                alpha: 1,
                color: enemy.color,
              });
            }

            if (enemy.hp <= 0) {
              // Enemy destroyed!
              sound.playExplode();
              localScore += 50 * enemy.maxHp;
              localDefeated++;
              setScore(localScore);
              setEnemiesDefeated(localDefeated);

              // Death explosion
              for (let s = 0; s < 14; s++) {
                game.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  alpha: 1,
                  color: enemy.color,
                });
              }

              game.enemies.splice(eIdx, 1);
              break;
            }
          }
        }

        // Breach / Game Over condition (reaches bottom)
        if (enemy.y > height - 30) {
          sound.playHackFail();
          setIsPlaying(false);
          setGameOver(true);

          const multiplier = state.activeMutations.includes('mut_spectral_wings') ? 2 : 1;
          const earnedXenon = Math.floor(localScore * 0.15) * multiplier;

          onStateUpdate(prev => ({
            ...prev,
            xenon: prev.xenon + earnedXenon,
            xp: prev.xp + Math.floor(localScore * 0.1),
            stats: {
              ...prev.stats,
              invadersBanished: prev.stats.invadersBanished + localDefeated,
            },
            speechBubble: `Defense session concluded. Banished ${localDefeated} glitches, earned ${earnedXenon} Xenon!`,
            speechBubbleTimeout: 4000,
          }));
          return;
        }
      }

      // 5. Particles update
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const pt = game.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.04;

        if (pt.alpha <= 0) {
          game.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.fillRect(pt.x, pt.y, 3, 3);
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, fireInterval, onStateUpdate, score, enemiesDefeated, state.activeMutations]);

  // Handle canvas mouse shooting
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    gameRef.current.playerX = e.clientX - rect.left;
    gameRef.current.keys.shoot = true;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    gameRef.current.playerX = e.clientX - rect.left;
  };

  const handleCanvasMouseUp = () => {
    gameRef.current.keys.shoot = false;
  };

  return (
    <div className="p-6 h-full flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold font-['Orbitron'] text-emerald-400 glow-green flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            QUANTUM DEFENSE // CORRUPTION PURGE
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Command your Voidling guardian to vaporize descending malware packets and cosmic anomalies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>SCORE:</span>
            <span className="text-amber-400 font-bold text-sm">{score}</span>
          </div>

          <button
            onClick={startGame}
            className="cyber-button text-xs py-1.5 px-3"
          >
            {isPlaying ? (
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> RESTART
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" /> START PURGE
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Arcade Canvas Display */}
      <div className="flex-1 relative cyber-panel rounded-xl overflow-hidden border border-emerald-500/30">
        <canvas
          ref={canvasRef}
          width={900}
          height={520}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Start / Game Over Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            {gameOver ? (
              <>
                <h3 className="font-['Orbitron'] text-2xl font-bold text-rose-400 glow-magenta mb-2">
                  CONTAINMENT BREACHED!
                </h3>
                <p className="font-mono text-sm text-slate-300 mb-4">
                  Final Score: <span className="text-amber-400 font-bold">{score}</span> | Banished: <span className="text-cyan-400 font-bold">{enemiesDefeated}</span>
                </p>
                <button
                  onClick={startGame}
                  className="cyber-button text-sm py-2 px-6"
                >
                  PURGE AGAIN
                </button>
              </>
            ) : (
              <>
                <Crosshair className="w-12 h-12 text-emerald-400 mb-3 animate-pulse" />
                <h3 className="font-['Orbitron'] text-xl font-bold text-slate-100 mb-2">
                  READY TO DEFEND THE TERRARIUM?
                </h3>
                <p className="font-mono text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                  Controls: Use <span className="text-cyan-400">Mouse Move / A-D Keys</span> to steer your Voidling. Click or press <span className="text-cyan-400">Spacebar</span> to unleash plasma bolts!
                </p>
                <button
                  onClick={startGame}
                  className="cyber-button text-sm py-2.5 px-8"
                >
                  LAUNCH QUANTUM DEFENSE
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
