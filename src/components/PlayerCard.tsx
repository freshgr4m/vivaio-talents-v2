import { useState } from 'react';
import type { Player } from '../types/player';

const POSITION_LABELS: Record<string, string> = {
  Attacker: 'ATT',
  Midfielder: 'MID',
  Defender: 'DIF',
  Goalkeeper: 'POR',
};

const POSITION_COLORS: Record<string, string> = {
  Attacker: 'text-red-400 border-red-400/30 bg-red-400/10',
  Midfielder: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  Defender: 'text-green-400 border-green-400/30 bg-green-400/10',
  Goalkeeper: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
};

interface PlayerCardProps {
  player: Player;
  rank: number;
  onClick?: (player: Player) => void;
}

function tierStyle(rank: number): { border: string; bg: string; rankColor: string } {
  if (rank === 1) return { border: 'border-l-[#FFD700]', bg: 'bg-[#FFD700]/[0.04]', rankColor: 'text-[#FFD700]/70' };
  if (rank <= 3)  return { border: 'border-l-[#C0C0C0]', bg: 'bg-white/[0.03]',     rankColor: 'text-[#C0C0C0]/70' };
  if (rank <= 5)  return { border: 'border-l-[#CD7F32]', bg: 'bg-white/[0.02]',     rankColor: 'text-[#CD7F32]/70' };
  return                  { border: 'border-l-transparent', bg: '',                  rankColor: 'text-white/20'      };
}

export function PlayerCard({ player, rank, onClick }: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);

  const posLabel = POSITION_LABELS[player.position] ?? player.position?.slice(0, 3).toUpperCase() ?? '—';
  const posColor = POSITION_COLORS[player.position] ?? 'text-white/50 border-white/20 bg-white/5';
  const tier = tierStyle(rank);

  return (
    <div
      className={`group flex items-center gap-4 border-l-2 ${tier.border} ${tier.bg} bg-[#13131e] hover:bg-[#1a1a2a] border border-white/5 hover:border-white/15 rounded-xl p-4 transition-all duration-200 cursor-pointer`}
      onClick={() => onClick?.(player)}
    >

      {/* Rank */}
      <div className="w-7 text-center shrink-0">
        <span className={`font-[Oswald] text-lg font-bold transition-colors ${tier.rankColor}`}>
          {rank}
        </span>
      </div>

      {/* Photo */}
      <div className="shrink-0">
        {!imgError ? (
          <img
            src={player.photo}
            alt={player.name}
            onError={() => setImgError(true)}
            className="w-14 h-14 rounded-full object-cover bg-white/5 border border-white/10"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-xs font-[Oswald]">
            {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-[Oswald] font-semibold text-white text-base leading-tight truncate">
            {player.name}
          </span>
          <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border font-[Oswald] ${posColor}`}>
            {posLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          {player.teamLogo && (
            <img src={player.teamLogo} alt="" className="w-4 h-4 object-contain opacity-70" />
          )}
          <span className="truncate">{player.teamName}</span>
          <span className="text-white/20">·</span>
          <span>{player.age} anni</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="hidden sm:grid grid-cols-4 gap-4 shrink-0">
        <Stat label="GOL" value={player.goals} accent />
        <Stat label="ASS" value={player.assists} />
        <Stat label="MIN" value={player.minutesPlayed} />
        <Stat label="RATING" value={player.rating > 0 ? player.rating.toFixed(1) : '—'} />
      </div>

      {/* Talent Score */}
      <div className="shrink-0 text-right pl-2 border-l border-white/10">
        <div className="font-[Oswald] text-2xl font-bold text-[#FFD700] leading-none">
          {player.talentScore.toFixed(1)}
        </div>
        <div className="text-[10px] text-[#FFD700]/50 uppercase tracking-wider mt-0.5">Score</div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-[Oswald] text-lg font-bold leading-none ${accent ? 'text-white' : 'text-white/70'}`}>
        {value}
      </div>
      <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
