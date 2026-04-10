import { useEffect, useState } from 'react';
import type { Player } from '../types/player';

const POSITION_LABELS: Record<string, string> = {
  Attacker: 'Attaccante', Midfielder: 'Centrocampista',
  Defender: 'Difensore',  Goalkeeper: 'Portiere',
};

const POSITION_COLORS: Record<string, string> = {
  Attacker:   'text-red-400 border-red-400/40 bg-red-400/10',
  Midfielder: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
  Defender:   'text-green-400 border-green-400/40 bg-green-400/10',
  Goalkeeper: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
};

const LEAGUE_HIERARCHY: Record<number, { label: string; next?: string }> = {
  426: { label: 'Serie D', next: 'Serie C' }, 427: { label: 'Serie D', next: 'Serie C' },
  428: { label: 'Serie D', next: 'Serie C' }, 429: { label: 'Serie D', next: 'Serie C' },
  430: { label: 'Serie D', next: 'Serie C' }, 431: { label: 'Serie D', next: 'Serie C' },
  432: { label: 'Serie D', next: 'Serie C' }, 433: { label: 'Serie D', next: 'Serie C' },
  434: { label: 'Serie D', next: 'Serie C' },
  138: { label: 'Serie C', next: 'Serie B' }, 942: { label: 'Serie C', next: 'Serie B' },
  943: { label: 'Serie C', next: 'Serie B' },
  705: { label: 'Primavera 1', next: 'Serie B' },
  706: { label: 'Primavera 2', next: 'Primavera 1' },
  136: { label: 'Serie B', next: 'Serie A' },
  135: { label: 'Serie A' },
};

interface MaxStats { goals: number; assists: number; minutes: number; score: number; appearances: number }

function computeMax(players: Player[]): MaxStats {
  return players.reduce((m, p) => ({
    goals:       Math.max(m.goals, p.goals),
    assists:     Math.max(m.assists, p.assists),
    minutes:     Math.max(m.minutes, p.minutesPlayed),
    score:       Math.max(m.score, p.talentScore),
    appearances: Math.max(m.appearances, p.appearances),
  }), { goals: 1, assists: 1, minutes: 1, score: 1, appearances: 1 });
}

function Bar({ value, max, color = '#FFD700' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-white/30 text-xs w-8 text-right">{pct}%</span>
    </div>
  );
}

interface Props {
  player: Player;
  allPlayers: Player[];
  onClose: () => void;
}

export function PlayerModal({ player, allPlayers, onClose }: Props) {
  const [imgError, setImgError] = useState(false);
  const max = computeMax(allPlayers);
  const league = LEAGUE_HIERARCHY[player.leagueId];

  const goalsP90 = player.minutesPlayed > 0
    ? ((player.goals / player.minutesPlayed) * 90).toFixed(2) : '—';
  const assistsP90 = player.minutesPlayed > 0
    ? ((player.assists / player.minutesPlayed) * 90).toFixed(2) : '—';

  const posLabel = POSITION_LABELS[player.position] ?? player.position;
  const posColor = POSITION_COLORS[player.position] ?? 'text-white/50 border-white/20 bg-white/5';

  // Chiudi con ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Blocca scroll body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#13131e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header con foto */}
        <div className="relative bg-linear-to-b from-[#1a1a2e] to-[#13131e] px-6 pt-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
          >
            ✕
          </button>

          <div className="flex items-start gap-5">
            {/* Foto */}
            <div className="shrink-0">
              {!imgError ? (
                <img
                  src={player.photo}
                  alt={player.name}
                  onError={() => setImgError(true)}
                  className="w-24 h-24 rounded-2xl object-cover bg-white/5 border border-white/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-2xl font-[Oswald]">
                  {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info base */}
            <div className="flex-1 min-w-0">
              <h2 className="font-[Oswald] text-2xl font-bold text-white leading-tight mb-1">
                {player.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border font-[Oswald] ${posColor}`}>
                  {posLabel}
                </span>
                <span className="text-white/40 text-sm">{player.age} anni</span>
                <span className="text-white/20">·</span>
                <span className="text-white/40 text-sm">🇮🇹</span>
              </div>
              <div className="flex items-center gap-2">
                {player.teamLogo && (
                  <img src={player.teamLogo} alt="" className="w-5 h-5 object-contain" />
                )}
                <span className="text-white/70 text-sm font-medium">{player.teamName}</span>
              </div>
              <div className="text-white/30 text-xs mt-1">{player.leagueName}</div>
            </div>

            {/* Talent Score */}
            <div className="shrink-0 text-right">
              <div className="font-[Oswald] text-4xl font-bold text-[#FFD700] leading-none">
                {player.talentScore.toFixed(1)}
              </div>
              <div className="text-[#FFD700]/40 text-xs uppercase tracking-wider mt-1">Talent Score</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-5 border-t border-white/5 space-y-4">
          <h3 className="font-[Oswald] text-sm uppercase tracking-widest text-white/30">Statistiche stagione</h3>

          {/* Stat row: Gol */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white/60 text-sm">Gol</span>
              <span className="font-[Oswald] text-white font-bold">{player.goals}</span>
            </div>
            <Bar value={player.goals} max={max.goals} color="#ef4444" />
          </div>

          {/* Assist */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white/60 text-sm">Assist</span>
              <span className="font-[Oswald] text-white font-bold">{player.assists}</span>
            </div>
            <Bar value={player.assists} max={max.assists} color="#3b82f6" />
          </div>

          {/* Minuti */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white/60 text-sm">Minuti giocati</span>
              <span className="font-[Oswald] text-white font-bold">
                {player.minutesPlayed > 0 ? player.minutesPlayed.toLocaleString('it-IT') : '—'}
              </span>
            </div>
            <Bar value={player.minutesPlayed} max={max.minutes} color="#22c55e" />
          </div>

          {/* Presenze */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white/60 text-sm">Presenze</span>
              <span className="font-[Oswald] text-white font-bold">
                {player.appearances > 0 ? player.appearances : '—'}
              </span>
            </div>
            <Bar value={player.appearances} max={max.appearances} color="#a855f7" />
          </div>

          {/* Talent Score bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white/60 text-sm">Talent Score</span>
              <span className="font-[Oswald] text-[#FFD700] font-bold">{player.talentScore.toFixed(1)}</span>
            </div>
            <Bar value={player.talentScore} max={max.score} color="#FFD700" />
          </div>

          {/* Media ogni 90 */}
          {player.minutesPlayed > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="font-[Oswald] text-xl text-white font-bold">{goalsP90}</div>
                <div className="text-white/30 text-xs mt-0.5">Gol / 90 min</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="font-[Oswald] text-xl text-white font-bold">{assistsP90}</div>
                <div className="text-white/30 text-xs mt-0.5">Assist / 90 min</div>
              </div>
            </div>
          )}

          {player.rating > 0 && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-white/40 text-sm">Media voto</span>
              <span className="font-[Oswald] text-white/80 font-bold">{player.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Traiettoria */}
        {league && (
          <div className="px-6 py-5 border-t border-white/5">
            <h3 className="font-[Oswald] text-sm uppercase tracking-widest text-white/30 mb-3">Traiettoria</h3>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <span className="font-[Oswald] text-white text-sm">{league.label}</span>
              </div>
              {league.next && (
                <>
                  <svg className="w-5 h-5 text-[#FFD700] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg px-4 py-2">
                    <span className="font-[Oswald] text-[#FFD700] text-sm">{league.next}</span>
                  </div>
                </>
              )}
              {!league.next && (
                <span className="text-white/30 text-sm italic">già al massimo livello</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-white/15 text-white/50 hover:text-white hover:border-white/30 text-sm font-medium transition-all"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
