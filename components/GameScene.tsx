
import React, { useMemo, useRef } from 'react';
import { Stars, PerspectiveCamera, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh } from 'three';
import PlayerShip from './PlayerShip';
import { ShipStats, Projectile, Enemy, GameMode, HitEffect } from '../types';

interface GameSceneProps {
  player1: ShipStats;
  player2?: ShipStats;
  projectiles: Projectile[];
  enemies: Enemy[];
  hitEffects: HitEffect[];
  onPlayerFire: (id: number, pos: Vector3, dir: Vector3) => void;
  mode: GameMode;
  playerId?: number; 
}

const Particle: React.FC<{ velocity: Vector3, size: number, startTime: number }> = ({ velocity, size, startTime }) => {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = (performance.now() - startTime) / 1000;
    if (elapsed < 0.6) {
      meshRef.current.position.set(
        velocity.x * elapsed,
        velocity.y * elapsed,
        velocity.z * elapsed
      );
      const scale = 1 - elapsed / 0.6;
      meshRef.current.scale.setScalar(scale > 0 ? scale : 0.001);
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={5} />
    </mesh>
  );
};

const PixelExplosion: React.FC<{ position: [number, number, number], startTime: number }> = ({ position, startTime }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      velocity: new Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      ),
      size: 0.15 + Math.random() * 0.25,
      id: i
    }));
  }, []);

  return (
    <group position={position}>
      {particles.map((p) => (
        <Particle key={p.id} velocity={p.velocity} size={p.size} startTime={startTime} />
      ))}
    </group>
  );
};

const GameScene: React.FC<GameSceneProps> = ({ player1, player2, projectiles, enemies, hitEffects, onPlayerFire, mode, playerId }) => {
  return (
    <>
      <color attach="background" args={['#010409']} />
      <fog attach="fog" args={['#010409', 30, 250]} />
      <Stars radius={150} depth={60} count={7000} factor={4} saturation={0.5} fade speed={1.5} />
      
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 100, 0]} intensity={2} color="#ffffff" />
      <directionalLight position={[10, 20, 10]} intensity={1.5} color="#60a5fa" castShadow />
      
      <PerspectiveCamera makeDefault position={[0, 45, 65]} fov={50} />
      
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <group position={[0, 0, 100]}>
          <mesh>
            <octahedronGeometry args={[12, 0]} />
            <meshStandardMaterial color="#0f172a" wireframe linewidth={1} />
          </mesh>
          <mesh>
            <sphereGeometry args={[5, 32, 32]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} />
          </mesh>
          <pointLight intensity={8} color="#22d3ee" />
        </group>
      </Float>

      <gridHelper args={[300, 30, '#1e293b', '#0f172a']} position={[0, -5, 0]} />

      <PlayerShip 
        stats={player1} 
        onFire={(pos, dir) => onPlayerFire(1, pos, dir)} 
        controls="wasd"
        position={mode === 'COOP' ? [-15, 0, 0] : [0, 0, 0]}
        boundsX={mode === 'COOP' ? [-70, -3] : [-70, 70]}
      />

      {mode === 'COOP' && player2 && (
        <PlayerShip 
          stats={player2} 
          onFire={(pos, dir) => onPlayerFire(2, pos, dir)} 
          controls="numpad"
          position={[15, 0, 0]}
          boundsX={[3, 70]}
        />
      )}

      {enemies.map(enemy => (
        <group key={enemy.id} position={enemy.position}>
          {enemy.type === 'SCOUT' && (
            <mesh castShadow>
              <coneGeometry args={[1.2, 2.5, 3]} />
              <meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={1} />
            </mesh>
          )}
          {enemy.type === 'FIGHTER' && (
            <mesh castShadow>
              <tetrahedronGeometry args={[1.8, 0]} />
              <meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={0.8} />
            </mesh>
          )}
          {enemy.type === 'BOMBER' && (
            <mesh castShadow>
              <octahedronGeometry args={[2.2, 0]} />
              <meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={0.6} />
            </mesh>
          )}
          <pointLight intensity={1} color={enemy.color} />
        </group>
      ))}

      {projectiles.map(p => (
        <mesh key={p.id} position={p.position}>
          <sphereGeometry args={[p.isPlayer ? 0.25 : 0.4, 12, 12]} />
          <meshStandardMaterial 
            color={p.isPlayer ? "#22d3ee" : "#f87171"} 
            emissive={p.isPlayer ? "#22d3ee" : "#ef4444"} 
            emissiveIntensity={p.isPlayer ? 3 : 6} 
          />
        </mesh>
      ))}

      {hitEffects.map(hit => (
        <PixelExplosion key={hit.id} position={hit.position} startTime={hit.startTime} />
      ))}
    </>
  );
};

export default GameScene;
