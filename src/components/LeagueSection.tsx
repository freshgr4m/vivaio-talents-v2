import { useState } from 'react';
import type { Player } from '../types/player';
import { PlayerCard } from './PlayerCard';

interface LeagueSectionProps {
  leagueName: string;
  players: Player[];
  error?: string;
  loading: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  sub?: boolean;
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 bg-[#13131e] border border-white/5 rounded-xl p-4 animate-pulse">
      <div className="w-7 h-6 bg-white/5 rounded" />
      <div className="w-14 h-14 rounded-full bg-white/5" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/5 rounded w-40" />
        <div className="h-3 bg-white/5 rounded w-28" />
      </div>
      <div className="hidden sm:flex gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-10 space-y-1">
            <div className="h-5 bg-white/5 rounded" />
            <div className="h-2 bg-white/5 rounded" />
          </div>
        ))}
      </div>
      <div className="w-14 space-y-1 pl-2">
        <div className="h-7 bg-white/5 rounded" />
        <div className="h-2 bg-white/5 rounded" />
      </div>
    </div>
  );
}

const DEFAULT_VISIBLE = 10;

export function LeagueSection({
  leagueName,
  players,
  error,
  loading,
  collapsible = false,
  defaultOpen = true,
  sub = false,
}: LeagueSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);

  const visiblePlayers = showAll ? players : players.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = players.length - DEFAULT_VISIBLE;

  return (
    <section>
      <div
        className={`flex items-center gap-3 mb-4 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={() => { if (collapsible) setIsOpen(o => !o); }}
      >
        <h2 className={`font-[Oswald] font-bold text-white tracking-wide uppercase ${
          sub ? 'text-lg text-white/60' : 'text-2xl'
        }`}>
          {leagueName}
        </h2>
        {collapsible && (
          <svg
            className={`w-4 h-4 text-white/30 transition-transform duration-200 shrink-0 ${isOpen ? '' : '-rotate-90'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        <div className="flex-1 h-px bg-linear-to-r from-white/10 to-transparent" />
        {isOpen && !loading && !error && players.length > 0 && (
          <span className="text-xs text-white/30 font-[Inter]">Top {players.length}</span>
        )}
      </div>

      {isOpen && (
        <>
          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-400 text-sm font-medium">Errore nel caricamento dati</p>
                <p className="text-red-400/60 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && players.length === 0 && (
            <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl p-4">
              <svg className="w-5 h-5 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white/40 text-sm">Dati insufficienti per questa stagione</p>
            </div>
          )}

          {!loading && !error && players.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {visiblePlayers.map((player, i) => (
                  <PlayerCard key={`${player.id}-${player.leagueId}`} player={player} rank={i + 1} />
                ))}
              </div>
              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="mt-3 w-full py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 text-sm transition-all"
                >
                  {showAll
                    ? '▲ Mostra meno'
                    : `▼ Mostra altri ${hiddenCount} giocatori`}
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
