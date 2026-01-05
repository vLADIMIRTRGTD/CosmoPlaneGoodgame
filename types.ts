
export type GameStatus = 'MENU' | 'COLOR_SELECT' | 'PLAYING' | 'UPGRADING' | 'GAMEOVER';
export type GameMode = 'SINGLE' | 'COOP';

export interface ShipStats {
  maxHp: number;
  hp: number;
  shield: number;
  maxShield: number;
  speed: number;
  fireRate: number;
  damage: number;
  bulletSpeed: number;
  color: string;
  kills: number;
  score: number;
}

export interface GameState {
  status: GameStatus;
  mode: GameMode;
  score: number;
  credits: number;
  level: number;
  enemyEvolution: number; // Уровень сложности/пушек врагов
  baseHealth1: number;
  baseHealth2: number;
  player1: ShipStats;
  player2?: ShipStats;
}

export interface Enemy {
  id: string;
  position: [number, number, number];
  hp: number;
  type: 'SCOUT' | 'FIGHTER' | 'BOMBER';
  color: string;
  targetId: number;
  lastFireTime: number;
}

export interface Projectile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  isPlayer: boolean;
  damage: number;
  ownerId?: number;
}

export interface HitEffect {
  id: string;
  position: [number, number, number];
  startTime: number;
}

export enum UpgradeType {
  HULL = 'HULL',
  SHIELD = 'SHIELD',
  ENGINE = 'ENGINE',
  WEAPONS = 'WEAPONS'
}
