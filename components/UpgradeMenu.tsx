
import React from 'react';
import { GameState, UpgradeType } from '../types';
import { UPGRADE_MAP } from '../constants';
import { Coins, Play, ShoppingBag, AlertTriangle } from 'lucide-react';
import { sounds } from '../services/soundService';

interface UpgradeMenuProps {
  gameState: GameState;
  onUpgrade: (type: UpgradeType) => void;
  onContinue: () => void;
}

const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ gameState, onUpgrade, onContinue }) => {
  const { credits, enemyEvolution } = gameState;

  const upgrades = [
    { type: UpgradeType.HULL, cost: 100, desc: '+25 к прочности корпуса' },
    { type: UpgradeType.SHIELD, cost: 150, desc: '+20 к емкости щитов' },
    { type: UpgradeType.ENGINE, cost: 200, desc: '+15% к тяге двигателей' },
    { type: UpgradeType.WEAPONS, cost: 250, desc: 'Усиление урона и темпа' },
  ];

  const handleBuy = (type: UpgradeType) => {
    onUpgrade(type);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-8 z-50">
      <div className="max-w-4xl w-full bg-black/40 border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8">
           <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-3xl font-orbitron text-yellow-500">{credits}</span>
           </div>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <ShoppingBag className="w-8 h-8 text-cyan-500" />
          <h2 className="text-4xl font-orbitron font-bold text-white uppercase tracking-wider">Магазин Улучшений</h2>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-8 flex items-center gap-4">
           <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
           <p className="text-red-400 font-exo text-sm">
             ВНИМАНИЕ: Каждое ваше улучшение ускоряет эволюцию врагов. 
             Текущий уровень угрозы: <span className="font-bold underline">{enemyEvolution}</span>.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upgrades.map((up) => {
            const { icon, label } = UPGRADE_MAP[up.type];
            const canAfford = credits >= up.cost;

            return (
              <button
                key={up.type}
                onClick={() => canAfford && handleBuy(up.type)}
                onMouseEnter={() => sounds.playClick()}
                disabled={!canAfford}
                className={`flex items-center gap-6 p-6 rounded-3xl border transition-all group text-left relative overflow-hidden ${
                  canAfford 
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 shadow-lg' 
                  : 'border-white/5 bg-transparent opacity-40 cursor-not-allowed'
                }`}
              >
                {canAfford && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                )}
                
                <div className={`p-4 rounded-2xl bg-black/40 group-hover:scale-110 transition-transform ${canAfford ? 'text-white' : 'text-slate-600'}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-white mb-1">{label}</div>
                  <div className="text-sm text-slate-400 leading-tight">{up.desc}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Цена</div>
                  <div className={`text-2xl font-orbitron ${canAfford ? 'text-yellow-400' : 'text-red-500/50'}`}>
                    {up.cost}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={onContinue}
            className="group flex items-center gap-4 px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xl rounded-full transition-all shadow-[0_0_30px_rgba(8,145,178,0.4)] hover:shadow-[0_0_60px_rgba(8,145,178,0.6)] transform hover:scale-105"
          >
            В КИНЕТИЧЕСКИЙ ПРЫЖОК
            <Play className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeMenu;
