
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { ShipStats } from '../types';

interface PlayerShipProps {
  stats: ShipStats;
  onFire: (pos: Vector3, dir: Vector3) => void;
  controls: 'wasd' | 'numpad';
  position?: [number, number, number];
  boundsX?: [number, number]; // [min, max]
}

const PlayerShip: React.FC<PlayerShipProps> = ({ stats, onFire, controls, position = [0, 0, 0], boundsX = [-65, 65] }) => {
  const meshRef = useRef<Group>(null);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const lastFireTime = useRef(0);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => setKeys(p => ({ ...p, [e.code]: true }));
    const handleUp = (e: KeyboardEvent) => setKeys(p => ({ ...p, [e.code]: false }));
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || stats.hp <= 0) return;

    const ship = meshRef.current;
    const speed = stats.speed * 35 * delta;

    // Управление для 2-го игрока: Num5(вперед), Num2(назад), Num1(влево), Num3(вправо)
    const up = controls === 'wasd' ? keys['KeyW'] : keys['Numpad5'];
    const down = controls === 'wasd' ? keys['KeyS'] : keys['Numpad2'];
    const left = controls === 'wasd' ? keys['KeyA'] : keys['Numpad1'];
    const right = controls === 'wasd' ? keys['KeyD'] : keys['Numpad3'];
    const fire = controls === 'wasd' ? keys['Space'] : (keys['Enter'] || keys['NumpadEnter'] || keys['Numpad0']);

    if (up) ship.translateZ(-speed);
    if (down) ship.translateZ(speed);
    if (left) ship.translateX(-speed);
    if (right) ship.translateX(speed);

    // Ограничение по X на основе переданных границ (для разделения экрана)
    ship.position.x = Math.max(boundsX[0], Math.min(boundsX[1], ship.position.x));
    
    // Ограничение по Z (общее)
    const rangeZ = 75;
    ship.position.z = Math.max(-rangeZ, Math.min(rangeZ, ship.position.z));
    ship.position.y = 0;

    if (fire) {
      const now = performance.now();
      if (now - lastFireTime.current > 1000 / stats.fireRate) {
        const direction = new Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
        onFire(ship.position.clone(), direction);
        lastFireTime.current = now;
      }
    }
    
    const tiltAmount = 0.4;
    if (left) ship.rotation.z = Math.min(ship.rotation.z + 0.15, tiltAmount);
    else if (right) ship.rotation.z = Math.max(ship.rotation.z - 0.15, -tiltAmount);
    else ship.rotation.z *= 0.85;
  });

  if (stats.hp <= 0) {
    return (
      <group position={position}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
           <torusGeometry args={[2, 0.1, 16, 32]} />
           <meshStandardMaterial color="#ef4444" transparent opacity={0.3} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={meshRef} position={position}>
      <mesh castShadow>
        <boxGeometry args={[2.2, 0.6, 3.2]} />
        <meshStandardMaterial color={stats.color} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.5, -0.6]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.8} transparent opacity={0.6} />
      </mesh>
      <mesh position={[2, -0.1, 0.2]}>
        <boxGeometry args={[2, 0.15, 1.2]} />
        <meshStandardMaterial color={stats.color} />
      </mesh>
      <mesh position={[-2, -0.1, 0.2]}>
        <boxGeometry args={[2, 0.15, 1.2]} />
        <meshStandardMaterial color={stats.color} />
      </mesh>
      <pointLight position={[0, 0, 2]} intensity={3} color={stats.color} />
    </group>
  );
};

export default PlayerShip;
