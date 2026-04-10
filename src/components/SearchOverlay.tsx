import { useEffect, useRef, useState } from 'react';
import type { Player } from '../types/player';

const POSITION_SHORT: Record<string, string> = {
  Attacker: 'ATT', Midfielder: 'MID', Defender: 'DIF', Goalkeeper: 'POR',
};

interface Props {
  allPlayers: Player[];
  onSelect: (player: Player) => void;
  onClose: () => void;
}

export function SearchOverlay({ allPlayers, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const results = q.length < 2 ? [] : allPlayers
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.teamName.toLowerCase().includes(q)
    )
    .sort((a, b) => b.talentScore - a.talentScore)
    .slice(0, 20);

  function handleSelect(player: Player) {
    onClose();
    onSelect(player);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mx-auto mt-16 sm:mt-24 px-4 flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 8rem)' }}
      >
        {/* Input */}
        <div className="relative flex items-center bg-[#13131e] border border-[#FFD700]/40 rounded-2xl px-4 py-3 shadow-2xl">
          <svg className="w-5 h-5 text-[#FFD700]/60 shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca giocatore o club..."
            className="flex-1 bg-transparent text-white text-lg placeholder-white/30 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-white/30 hover:text-white/60 ml-2">
              ✕
            </button>
          )}
          <button onClick={onClose} className="ml-3 text-white/30 hover:text-white/60 text-sm border-l border-white/10 pl-3">
            ESC
          </button>
        </div>

        {/* Hint */}
        {q.length < 2 && (
          <p className="text-white/20 text-sm text-center mt-6">
            Digita almeno 2 caratteri per cercare tra {allPlayers.length} giocatori
          </p>
        )}

        {/* Risultati */}
        {q.length >= 2 && (
          <div className="mt-2 bg-[#13131e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Nessun risultato per "{query}"</p>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-white/5">
                  <span className="text-white/20 text-xs">{results.length} risultati</span>
                </div>
                {results.map(player => (
                  <button
                    key={`${player.id}-${player.leagueId}`}
                    onClick={() => handleSelect(player)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
                  >
                    {/* Foto */}
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover bg-white/5 shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-[Oswald] text-white font-semibold truncate">{player.name}</span>
                        <span className="text-white/30 text-xs shrink-0">
                          {POSITION_SHORT[player.position] ?? '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/40 mt-0.5">
                        {player.teamLogo && (
                          <img src={player.teamLogo} alt="" className="w-3.5 h-3.5 object-contain opacity-60" />
                        )}
                        <span className="truncate">{player.teamName}</span>
                        <span className="text-white/20">·</span>
                        <span className="shrink-0">{player.leagueName}</span>
                      </div>
                    </div>
                    {/* Score */}
                    <div className="shrink-0 text-right">
                      <div className="font-[Oswald] text-[#FFD700] font-bold">{player.talentScore.toFixed(1)}</div>
                      <div className="text-white/20 text-xs">{player.age}a</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
