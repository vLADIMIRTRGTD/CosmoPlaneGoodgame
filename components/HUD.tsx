
import React from 'react';
import { GameState, ShipStats } from '../types';
import { Shield, Heart, Target, Coins, Trophy } from 'lucide-react';

interface HUDProps {
  gameState: GameState;
  briefing: string;
  playerId?: number;
}

const ShipStatsHUD: React.FC<{ stats: ShipStats; label: string }> = ({ stats, label }) => (
  <div className="bg-black/70 backdrop-blur-xl border border-white/10 p-2 rounded-xl flex gap-3 items-center shadow-2xl">
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center text-[8px] text-red-400 font-bold uppercase tracking-tighter">
        <span className="flex items-center gap-1"><Heart className="w-2 h-2"/> HULL</span>
        <span>{Math.round(Math.max(0, stats.hp))}</span>
      </div>
      <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.max(0, (stats.hp / stats.maxHp) * 100)}%` }} />
      </div>
    </div>
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center text-[8px] text-cyan-400 font-bold uppercase tracking-tighter">
        <span className="flex items-center gap-1"><Shield className="w-2 h-2"/> SHIELD</span>
        <span>{Math.round(Math.max(0, stats.shield))}</span>
      </div>
      <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${Math.max(0, (stats.shield / stats.maxShield) * 100)}%` }} />
      </div>
    </div>
  </div>
);

const HUD: React.FC<HUDProps> = ({ gameState, briefing, playerId }) => {
  const { score, level, credits, baseHealth1, baseHealth2, player1, player2, mode } = gameState;
  
  // В режиме COOP мы показываем HUD отдельно для каждого "экрана"
  const isP1Screen = playerId === 1 || mode === 'SINGLE';
  const isP2Screen = playerId === 2;

  const currentStats = isP1Screen ? player1 : player2!;
  const currentBaseHealth = isP1Screen ? baseHealth1 : baseHealth2;
  const label = isP1Screen ? "PLAYER 1" : "PLAYER 2";

  return (
    <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between font-exo z-50">
      <div className="hud-scanline absolute inset-0"></div>
      
      {/* Top HUD Area */}
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-start">
          <div className="bg-black/60 backdrop-blur-md border-l-4 border-cyan-500 p-2 rounded-r-lg shadow-lg">
            <div className="text-[10px] font-orbitron font-bold text-cyan-400 mb-1">{label} FEED</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-white/50" />
                <span className="text-sm font-orbitron text-white">{currentStats.score}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <span className="text-sm font-orbitron text-yellow-400">{currentStats.kills}</span>
              </div>
            </div>
          </div>
          
          <ShipStatsHUD stats={currentStats} label={label} />
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className="bg-black/60 backdrop-blur-md border-r-4 border-red-500 p-2 rounded-l-lg text-right shadow-lg">
            <div className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Base Integr.</div>
            <div className="text-lg font-orbitron text-red-500">{Math.max(0, currentBaseHealth)}%</div>
            <div className="w-20 h-1 bg-slate-800 mt-0.5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${Math.max(0, currentBaseHealth)}%` }} />
            </div>
          </div>
          
          {/* Общий счет выводим только на одном экране или компактно */}
          {isP1Screen && (
            <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 px-3 py-1 rounded-full flex items-center gap-2">
               <Coins className="w-3 h-3 text-yellow-500" />
               <span className="text-xs font-orbitron text-yellow-400">{credits} CR</span>
            </div>
          )}
        </div>
      </div>

      {/* Lost indicator overlay */}
      {currentStats.hp <= 0 && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-8 border-red-600 bg-black/80 px-16 py-8 rounded-2xl transform scale-110 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
               <span className="text-6xl font-orbitron font-extrabold text-red-500 animate-pulse tracking-widest">ПРОИГРАЛ</span>
            </div>
         </div>
      )}

      {/* Bottom Sector Info */}
      <div className="flex justify-center mb-1">
        <div className="bg-black/80 px-4 py-1 rounded-full border border-white/10 shadow-lg">
          <span className="text-[9px] text-slate-500 uppercase tracking-[0.4em]">Sector</span>
          <span className="ml-3 text-base font-orbitron text-white">{level}</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
