
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Vector3 } from 'three';
import { nanoid } from 'nanoid';
import { GameState, GameStatus, GameMode, Projectile, Enemy, UpgradeType, HitEffect } from './types';
import { INITIAL_STATS, ENEMY_SPAWN_INTERVAL } from './constants';
import GameScene from './components/GameScene';
import HUD from './components/HUD';
import UpgradeMenu from './components/UpgradeMenu';
import { getTacticalBriefing, generatePilotImage, speakPilotPhrase, getRandomPilotPhrase } from './services/geminiService';
import { sounds } from './services/soundService';
import { Sword, Users, User, Palette, RotateCcw, Home, Trophy, Medal, Target } from 'lucide-react';

const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
const ENEMY_TYPES = ['SCOUT', 'FIGHTER', 'BOMBER'] as const;
const ENEMY_COLORS = ['#ef4444', '#a855f7', '#f97316'];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'MENU',
    mode: 'SINGLE',
    score: 0,
    credits: 0,
    level: 1,
    enemyEvolution: 0,
    baseHealth1: 100,
    baseHealth2: 100,
    player1: { ...INITIAL_STATS, color: COLORS[0] },
  });

  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [briefing, setBriefing] = useState<string>("Ожидание приказа, командир.");
  const [pilotImg, setPilotImg] = useState<string>('');
  const [pilotSubtitles, setPilotSubtitles] = useState<string | null>(null);
  
  const lastUpgradeScore = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSpawnTime = useRef(0);
  const gameLoopRef = useRef<number>();

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
  };

  const decode = (base64: string) => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes;
    } catch (e) {
      console.error("Decode error", e);
      return new Uint8Array(0);
    }
  };

  const playTTS = async (base64Audio: string) => {
    if (!audioContextRef.current || !base64Audio) return;
    try {
      const audioData = decode(base64Audio);
      if (audioData.length === 0) return;
      const dataInt16 = new Int16Array(audioData.buffer);
      const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (gameState.status === 'PLAYING') {
      sounds.startMusic();
    } else {
      sounds.stopMusic();
    }
    return () => sounds.stopMusic();
  }, [gameState.status]);

  useEffect(() => {
    if (gameState.status !== 'PLAYING' || gameState.mode !== 'SINGLE') return;
    // Increased interval to 15 seconds to reduce API hits
    const interval = setInterval(async () => {
      const phrase = getRandomPilotPhrase();
      setPilotSubtitles(phrase);
      
      const audio = await speakPilotPhrase(phrase);
      if (audio) {
        playTTS(audio);
      }
      
      setTimeout(() => setPilotSubtitles(null), 4500);
    }, 15000);
    return () => clearInterval(interval);
  }, [gameState.status, gameState.mode]);

  useEffect(() => {
    const loadPilot = async () => {
      const img = await generatePilotImage();
      setPilotImg(img);
    };
    loadPilot();
  }, []);

  const resetGame = (mode: GameMode) => {
    initAudio();
    sounds.playClick();
    lastUpgradeScore.current = 0;
    setGameState(prev => ({
      ...prev,
      status: 'PLAYING',
      mode,
      score: 0,
      credits: 0,
      level: 1,
      enemyEvolution: 0,
      baseHealth1: 100,
      baseHealth2: 100,
      player1: { ...INITIAL_STATS, color: prev.player1.color, kills: 0, score: 0 },
      player2: mode === 'COOP' ? { ...INITIAL_STATS, color: prev.player2?.color || COLORS[1], kills: 0, score: 0 } : undefined
    }));
    setEnemies([]);
    setProjectiles([]);
    setHitEffects([]);
  };

  const startGame = (mode: GameMode) => {
    initAudio();
    sounds.playClick();
    if (mode === 'COOP') {
      setGameState(prev => ({ ...prev, status: 'COLOR_SELECT', mode }));
    } else {
      resetGame('SINGLE');
    }
  };

  const finishColorSelect = (p1c: string, p2c: string) => {
    setGameState(prev => ({
      ...prev,
      status: 'PLAYING',
      score: 0,
      credits: 0,
      level: 1,
      enemyEvolution: 0,
      baseHealth1: 100,
      baseHealth2: 100,
      player1: { ...INITIAL_STATS, color: p1c, kills: 0, score: 0 },
      player2: { ...INITIAL_STATS, color: p2c, kills: 0, score: 0 }
    }));
    setEnemies([]);
    setProjectiles([]);
  };

  const spawnEnemy = useCallback(() => {
    const angle = (Math.random() * 0.4 + 0.3) * Math.PI;
    const radius = 130;
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const color = ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
    const targetId = Math.random() > 0.5 ? 1 : 2;
    const xOffset = targetId === 1 ? -30 : 30;

    const newEnemy: Enemy = {
      id: nanoid(),
      position: [Math.cos(angle) * radius + xOffset, 0, -120 - Math.random() * 50],
      hp: (type === 'BOMBER' ? 150 : type === 'FIGHTER' ? 80 : 40) + (gameState.level * 20),
      type,
      color,
      targetId,
      lastFireTime: performance.now()
    };
    setEnemies(prev => [...prev, newEnemy]);
  }, [gameState.level]);

  const handlePlayerFire = useCallback((id: number, pos: Vector3, dir: Vector3) => {
    const stats = id === 1 ? gameState.player1 : gameState.player2;
    if (!stats || stats.hp <= 0) return;

    sounds.playShoot();
    const newProjectile: Projectile = {
      id: nanoid(),
      position: [pos.x, pos.y, pos.z],
      velocity: [dir.x * stats.bulletSpeed, dir.y * stats.bulletSpeed, dir.z * stats.bulletSpeed],
      isPlayer: true,
      damage: stats.damage,
      ownerId: id
    };
    setProjectiles(prev => [...prev, newProjectile]);
  }, [gameState.player1, gameState.player2]);

  const handleUpgrade = (type: UpgradeType) => {
    setGameState(s => {
      const upgradeCosts: Record<UpgradeType, number> = {
        [UpgradeType.HULL]: 100,
        [UpgradeType.SHIELD]: 150,
        [UpgradeType.ENGINE]: 200,
        [UpgradeType.WEAPONS]: 250,
      };
      const cost = upgradeCosts[type];
      if (s.credits < cost) return s;
      sounds.playUpgrade();
      const upgradeStats = (stats: any) => {
        if (!stats) return stats;
        return {
          ...stats,
          ...(type === UpgradeType.HULL && { maxHp: stats.maxHp + 25, hp: Math.min(stats.maxHp + 25, stats.hp + 25) }),
          ...(type === UpgradeType.SHIELD && { maxShield: stats.maxShield + 20, shield: Math.min(stats.maxShield + 20, stats.shield + 20) }),
          ...(type === UpgradeType.ENGINE && { speed: stats.speed * 1.15 }),
          ...(type === UpgradeType.WEAPONS && { fireRate: stats.fireRate * 1.2, damage: stats.damage + 5 }),
        };
      };
      return {
        ...s,
        credits: s.credits - cost,
        enemyEvolution: s.enemyEvolution + 1,
        player1: upgradeStats(s.player1),
        player2: s.player2 ? upgradeStats(s.player2) : undefined,
      };
    });
  };

  useEffect(() => {
    if (gameState.status !== 'PLAYING') return;

    const loop = (time: number) => {
      if (time - lastSpawnTime.current > ENEMY_SPAWN_INTERVAL / (1 + (gameState.level * 0.25))) {
        spawnEnemy();
        lastSpawnTime.current = time;
      }

      setProjectiles(prev => prev.map(p => ({
        ...p,
        position: [p.position[0] + p.velocity[0], p.position[1] + p.velocity[1], p.position[2] + p.velocity[2]] as [number, number, number]
      })).filter(p => Math.abs(p.position[0]) < 220 && Math.abs(p.position[2]) < 220));

      setEnemies(prev => {
        const next = prev.map(e => {
          const targetX = e.targetId === 1 ? -15 : 15;
          const dx = targetX - e.position[0];
          const dz = 100 - e.position[2];
          const dist = Math.sqrt(dx*dx + dz*dz) || 1;
          const speed = (e.type === 'SCOUT' ? 1.0 : e.type === 'FIGHTER' ? 0.7 : 0.4) + (gameState.level * 0.1);
          
          const newPos: [number, number, number] = [e.position[0] + (dx / dist) * speed, e.position[1], e.position[2] + (dz / dist) * speed];

          if (gameState.enemyEvolution > 0 && time - e.lastFireTime > 2000 / (1 + gameState.enemyEvolution * 0.1)) {
            const playerX = e.targetId === 1 ? (gameState.mode === 'COOP' ? -15 : 0) : 15;
            const pDx = playerX - e.position[0];
            const pDz = 0 - e.position[2];
            const pDist = Math.sqrt(pDx*pDx + pDz*pDz) || 1;
            if (pDist < 100) {
              const bSpeed = 2 + gameState.enemyEvolution * 0.5;
              setProjectiles(projs => [...projs, {
                id: nanoid(),
                position: [...newPos] as [number, number, number],
                velocity: [(pDx / pDist) * bSpeed, 0, (pDz / pDist) * bSpeed],
                isPlayer: false,
                damage: 10 + gameState.enemyEvolution * 2
              }]);
              e.lastFireTime = time;
            }
          }

          return { ...e, position: newPos };
        });

        next.forEach(enemy => {
          [1, 2].forEach(pid => {
            const pStats = pid === 1 ? gameState.player1 : gameState.player2;
            if (!pStats || pStats.hp <= 0) return;
            const px = pid === 1 ? (gameState.mode === 'COOP' ? -15 : 0) : 15;
            const dist = Math.sqrt((enemy.position[0] - px)**2 + (enemy.position[2])**2);
            if (dist < 6) {
              triggerHitEffect([enemy.position[0], 0, enemy.position[2]]);
              setGameState(s => {
                const target = pid === 1 ? 'player1' : 'player2';
                const current = s[target];
                if (!current) return s;
                let damage = 1.0;
                let newShield = Math.max(0, current.shield - (current.shield > 0 ? damage : 0));
                let newHp = Math.max(0, current.hp - (current.shield <= 0 ? damage : 0));
                return { ...s, [target]: { ...current, hp: newHp, shield: newShield } };
              });
            }
          });
        });

        return next.filter(e => {
          const distToBase = Math.sqrt((e.position[0] - (e.targetId === 1 ? -15 : 15))**2 + (100 - e.position[2])**2);
          if (distToBase < 15) {
            sounds.playBaseDamage();
            setGameState(s => {
              const damage = e.type === 'BOMBER' ? 20 : 10;
              if (e.targetId === 1) return { ...s, baseHealth1: Math.max(0, s.baseHealth1 - damage) };
              return { ...s, baseHealth2: Math.max(0, s.baseHealth2 - damage) };
            });
            return false;
          }
          return true;
        });
      });

      setProjectiles(prevProjectiles => {
        const nextProjectiles = [...prevProjectiles];
        const toRemoveIndices = new Set<number>();

        nextProjectiles.forEach((p, pIdx) => {
          if (p.isPlayer) {
            setEnemies(prevEnemies => {
              const nextEnemies = [...prevEnemies];
              const hitEnemyIdx = nextEnemies.findIndex(e => {
                const dist = Math.sqrt((p.position[0] - e.position[0])**2 + (p.position[2] - e.position[2])**2);
                return dist < 5;
              });

              if (hitEnemyIdx !== -1) {
                const enemy = nextEnemies[hitEnemyIdx];
                sounds.playExplosion();
                triggerHitEffect([enemy.position[0], 0, enemy.position[2]]);
                const points = enemy.type === 'BOMBER' ? 500 : enemy.type === 'FIGHTER' ? 250 : 100;
                setGameState(s => {
                  const useP2 = p.ownerId === 2 && s.mode === 'COOP' && s.player2;
                  const targetKey = useP2 ? 'player2' : 'player1';
                  const player = s[targetKey];
                  if (!player) return s;
                  return { 
                    ...s, 
                    score: s.score + points, 
                    credits: s.credits + 30,
                    [targetKey]: { ...player, score: (player.score || 0) + points, kills: (player.kills || 0) + 1 } 
                  };
                });
                toRemoveIndices.add(pIdx);
                nextEnemies.splice(hitEnemyIdx, 1);
              }
              return nextEnemies;
            });
          } else {
            [1, 2].forEach(pid => {
              const pStats = pid === 1 ? gameState.player1 : gameState.player2;
              if (!pStats || pStats.hp <= 0) return;
              const px = pid === 1 ? (gameState.mode === 'COOP' ? -15 : 0) : 15;
              const dist = Math.sqrt((p.position[0] - px)**2 + (p.position[2])**2);
              if (dist < 4) {
                sounds.playBaseDamage();
                triggerHitEffect([p.position[0], 0, p.position[2]]);
                setGameState(s => {
                  const target = pid === 1 ? 'player1' : 'player2';
                  const current = s[target];
                  if (!current) return s;
                  let newShield = Math.max(0, current.shield - p.damage);
                  let remainingDamage = Math.max(0, p.damage - current.shield);
                  let newHp = Math.max(0, current.hp - remainingDamage);
                  return { ...s, [target]: { ...current, hp: newHp, shield: newShield } };
                });
                toRemoveIndices.add(pIdx);
              }
            });
          }
        });

        return nextProjectiles.filter((_, i) => !toRemoveIndices.has(i));
      });

      setHitEffects(prev => prev.filter(h => time - h.startTime < 600));

      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameState.status, gameState.level, spawnEnemy, gameState.player1, gameState.player2, gameState.mode, gameState.enemyEvolution]);

  const triggerHitEffect = (pos: [number, number, number]) => {
    setHitEffects(prev => [...prev, { id: nanoid(), position: pos, startTime: performance.now() }]);
  };

  useEffect(() => {
    if (gameState.score - lastUpgradeScore.current >= 3000 && gameState.status === 'PLAYING') {
      lastUpgradeScore.current = gameState.score;
      setGameState(s => ({ ...s, status: 'UPGRADING' }));
    }
  }, [gameState.score]);

  useEffect(() => {
    const p1Dead = (gameState.player1?.hp || 0) <= 0 || (gameState.baseHealth1 || 0) <= 0;
    const p2Dead = gameState.mode === 'COOP' ? (gameState.player2?.hp || 0) <= 0 || (gameState.baseHealth2 || 0) <= 0 : true;
    if (p1Dead && p2Dead && gameState.status === 'PLAYING') {
      setGameState(s => ({ ...s, status: 'GAMEOVER' }));
    }
  }, [gameState.baseHealth1, gameState.baseHealth2, gameState.player1?.hp, gameState.player2?.hp, gameState.status, gameState.mode]);

  return (
    <div className="w-full h-screen relative bg-slate-950 overflow-hidden">
      <div className={`w-full h-full flex ${gameState.mode === 'COOP' && gameState.status === 'PLAYING' ? 'flex-col' : ''}`}>
        <div className="flex-1 relative border-b border-white/5">
          <Canvas shadows>
            <GameScene 
              player1={gameState.player1} player2={gameState.player2} projectiles={projectiles} enemies={enemies} hitEffects={hitEffects}
              onPlayerFire={handlePlayerFire} mode={gameState.mode} playerId={1}
            />
          </Canvas>
          {gameState.status === 'PLAYING' && <HUD gameState={gameState} briefing={briefing} playerId={1} />}
        </div>
        {gameState.mode === 'COOP' && gameState.status === 'PLAYING' && (
          <div className="flex-1 relative border-t border-white/5">
            <Canvas shadows>
              <GameScene 
                player1={gameState.player1} player2={gameState.player2} projectiles={projectiles} enemies={enemies} hitEffects={hitEffects}
                onPlayerFire={handlePlayerFire} mode={gameState.mode} playerId={2}
              />
            </Canvas>
            <HUD gameState={gameState} briefing={briefing} playerId={2} />
          </div>
        )}
      </div>

      {gameState.mode === 'COOP' && gameState.status === 'PLAYING' && (
        <div className="laser-divider"></div>
      )}

      {gameState.mode === 'SINGLE' && gameState.status === 'PLAYING' && (
        <div className="commander-link group" style={{ backgroundImage: `url(${pilotImg})` }}>
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>
            <span className="text-[8px] text-red-500 font-bold font-orbitron">LIVE_COMMS</span>
          </div>
          {pilotSubtitles && (
            <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-3 text-[11px] text-cyan-300 font-orbitron text-center uppercase border-t border-cyan-500/40 tracking-tight leading-tight">
              {pilotSubtitles}
            </div>
          )}
        </div>
      )}

      <div className="guardian-phantom" />

      {gameState.status === 'MENU' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <div className="text-center p-12 bg-black/50 border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden max-w-3xl">
            <h1 className="text-6xl font-orbitron font-bold text-white mb-8 tracking-tighter">
              KOCMИЧECKИE <span className="text-cyan-500">CTPAЖИ</span>
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button onClick={() => startGame('SINGLE')} className="group p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-cyan-500 transition-all transform hover:scale-105">
                <User className="w-12 h-12 text-cyan-400 group-hover:text-white mx-auto mb-4" />
                <h2 className="text-2xl font-orbitron font-bold text-white uppercase">ОДИНОЧНЫЙ</h2>
                <p className="text-slate-400 group-hover:text-white/80 text-sm mt-2 font-exo uppercase tracking-widest">Кампания с пилотом</p>
              </button>
              <button onClick={() => startGame('COOP')} className="group p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-purple-500 transition-all transform hover:scale-105">
                <Users className="w-12 h-12 text-purple-400 group-hover:text-white mx-auto mb-4" />
                <h2 className="text-2xl font-orbitron font-bold text-white uppercase">НА ДВОИХ</h2>
                <p className="text-slate-400 group-hover:text-white/80 text-sm mt-2 font-exo uppercase tracking-widest">Раздельный сектор</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState.status === 'COLOR_SELECT' && (
        <ColorSelectScreen onFinish={finishColorSelect} />
      )}

      {gameState.status === 'UPGRADING' && (
        <UpgradeMenu 
          gameState={gameState} 
          onUpgrade={handleUpgrade} 
          onContinue={() => setGameState(s => ({ ...s, status: 'PLAYING', level: s.level + 1 }))} 
        />
      )}
      
      {gameState.status === 'GAMEOVER' && (
        <div className="absolute inset-0 z-[250] flex items-center justify-center bg-red-950/95 backdrop-blur-3xl">
          <div className="text-center p-10 max-w-4xl w-full">
            <div className="inline-block border-8 border-red-600 bg-black/40 p-8 mb-10 rounded-[2rem] shadow-[0_0_50px_rgba(220,38,38,0.5)]">
               <h2 className="text-7xl font-orbitron font-extrabold text-red-500 uppercase animate-pulse">ПОРАЖЕНИЕ</h2>
            </div>
            
            {gameState.mode === 'COOP' && gameState.player2 && (
              <div className="grid grid-cols-2 gap-10 mb-12">
                <div className={`p-6 rounded-3xl border-2 transition-all ${gameState.player1.score >= gameState.player2.score ? 'border-yellow-500 bg-yellow-500/10 scale-105 shadow-2xl' : 'border-white/10 bg-black/40'}`}>
                  {gameState.player1.score >= gameState.player2.score && <Medal className="w-10 h-10 text-yellow-500 mx-auto mb-2" />}
                  <h3 className="text-2xl font-orbitron text-white mb-4">PLAYER 1</h3>
                  <div className="space-y-2 font-exo">
                    <div className="flex justify-between text-slate-400"><span className="flex items-center gap-2 uppercase tracking-tighter"><Target className="w-4 h-4"/> Сбито:</span> <span className="text-white font-bold">{gameState.player1.kills}</span></div>
                    <div className="flex justify-between text-slate-400"><span className="flex items-center gap-2 uppercase tracking-tighter"><Trophy className="w-4 h-4"/> Очки:</span> <span className="text-white font-bold">{gameState.player1.score}</span></div>
                  </div>
                </div>
                <div className={`p-6 rounded-3xl border-2 transition-all ${gameState.player2.score >= gameState.player1.score ? 'border-yellow-500 bg-yellow-500/10 scale-105 shadow-2xl' : 'border-white/10 bg-black/40'}`}>
                  {gameState.player2.score >= gameState.player1.score && <Medal className="w-10 h-10 text-yellow-500 mx-auto mb-2" />}
                  <h3 className="text-2xl font-orbitron text-white mb-4">PLAYER 2</h3>
                  <div className="space-y-2 font-exo">
                    <div className="flex justify-between text-slate-400"><span className="flex items-center gap-2 uppercase tracking-tighter"><Target className="w-4 h-4"/> Сбито:</span> <span className="text-white font-bold">{gameState.player2.kills}</span></div>
                    <div className="flex justify-between text-slate-400"><span className="flex items-center gap-2 uppercase tracking-tighter"><Trophy className="w-4 h-4"/> Очки:</span> <span className="text-white font-bold">{gameState.player2.score}</span></div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-8 justify-center">
              <button onClick={() => resetGame(gameState.mode)} className="flex items-center gap-4 px-12 py-5 bg-white text-black font-orbitron font-bold text-xl rounded-full hover:bg-cyan-400 hover:text-white transition-all shadow-2xl">
                <RotateCcw className="w-6 h-6" /> ЕЩЕ РАЗ
              </button>
              <button onClick={() => setGameState(s => ({...s, status: 'MENU'}))} className="flex items-center gap-4 px-12 py-5 bg-slate-800 text-white font-orbitron font-bold text-xl rounded-full hover:bg-white hover:text-black transition-all shadow-2xl">
                <Home className="w-6 h-6" /> ГЛАВНОЕ МЕНЮ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ColorSelectScreen: React.FC<{onFinish: (p1: string, p2: string) => void}> = ({onFinish}) => {
  const [p1c, setP1c] = useState(COLORS[0]);
  const [p2c, setP2c] = useState(COLORS[1]);
  return (
    <div className="absolute inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
      <div className="w-full max-w-4xl p-12 bg-black/60 border border-white/10 rounded-[3rem] text-center shadow-2xl">
        <h2 className="text-4xl font-orbitron font-bold text-white mb-12 flex items-center justify-center gap-4 uppercase">
          <Palette className="w-10 h-10 text-cyan-500" /> Подготовка Флота
        </h2>
        <div className="flex gap-20 justify-center mb-16">
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-orbitron text-cyan-400">P1 [WASD]</h3>
            <div className="flex gap-3">
              {COLORS.map(c => (
                <button key={c} onClick={() => setP1c(c)} className={`w-12 h-12 rounded-full border-4 transition-all ${p1c === c ? 'border-white scale-125 shadow-[0_0_20px_white]' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="w-px bg-white/10 h-40"></div>
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-orbitron text-purple-400">P2 [NUM_1235]</h3>
            <div className="flex gap-3">
              {COLORS.map(c => (
                <button key={c} onClick={() => setP2c(c)} className={`w-12 h-12 rounded-full border-4 transition-all ${p2c === c ? 'border-white scale-125 shadow-[0_0_20px_white]' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => onFinish(p1c, p2c)} className="px-20 py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-3xl rounded-full transition-all shadow-[0_0_40px_rgba(8,145,178,0.5)]">
          ПОДТВЕРДИТЬ
        </button>
      </div>
    </div>
  );
};

export default App;
