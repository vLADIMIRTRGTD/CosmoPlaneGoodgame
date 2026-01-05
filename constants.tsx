
import React from 'react';
import { Shield, Zap, Target, Heart } from 'lucide-react';
import { UpgradeType } from './types';

export const BOUNDS = 70;
export const BASE_RADIUS = 10;
export const ENEMY_SPAWN_INTERVAL = 2500;
export const INITIAL_STATS = {
  maxHp: 100,
  hp: 100,
  shield: 50,
  maxShield: 50,
  speed: 1.8,
  fireRate: 2.5,
  damage: 25,
  bulletSpeed: 6,
  kills: 0,
  score: 0,
};

export const UPGRADE_MAP = {
  [UpgradeType.HULL]: { icon: <Heart className="w-5 h-5 text-red-400" />, label: 'Укрепление корпуса' },
  [UpgradeType.SHIELD]: { icon: <Shield className="w-5 h-5 text-blue-400" />, label: 'Энергощит' },
  [UpgradeType.ENGINE]: { icon: <Zap className="w-5 h-5 text-yellow-400" />, label: 'Импульсный двигатель' },
  [UpgradeType.WEAPONS]: { icon: <Target className="w-5 h-5 text-purple-400" />, label: 'Орудийная система' },
};
