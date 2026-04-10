import { useState } from 'react';
import type { AgeFilter, League, PositionFilter } from '../types/player';

interface FiltersProps {
  leagues: League[];
  selectedLeagues: Set<number>;
  onToggleLeague: (id: number) => void;
  positionFilter: PositionFilter;
  onPositionChange: (p: PositionFilter) => void;
  ageFilter: AgeFilter;
  onAgeChange: (a: AgeFilter) => void;
  onRefresh?: () => void;
  loading: boolean;
}

const POSITIONS: { value: PositionFilter; label: string }[] = [
  { value: 'ALL', label: 'Tutti' },
  { value: 'F',   label: 'ATT'  },
  { value: 'M',   label: 'MID'  },
  { value: 'D',   label: 'DIF'  },
  { value: 'G',   label: 'POR'  },
];

const AGES: AgeFilter[] = [18, 20, 23];

export function Filters({
  leagues,
  selectedLeagues,
  onToggleLeague,
  positionFilter,
  onPositionChange,
  ageFilter,
  onAgeChange,
  onRefresh,
  loading,
}: FiltersProps) {
  const [open, setOpen] = useState(false);

  const seen = new Set<string>();
  const uniqueLeagues = leagues.filter(l => {
    if (seen.has(l.label)) return false;
    seen.add(l.label);
    return true;
  });

  const getIdsByLabel = (label: string) => leagues.filter(l => l.label === label).map(l => l.id);
  const isLabelSelected = (label: string) => getIdsByLabel(label).every(id => selectedLeagues.has(id));

  function toggleLabel(label: string) {
    getIdsByLabel(label).forEach(id => onToggleLeague(id));
  }

  const activeCount = [
    uniqueLeagues.filter(l => !isLabelSelected(l.label)).length > 0,
    positionFilter !== 'ALL',
    ageFilter !== 23,
  ].filter(Boolean).length;

  return (
    <div className="sticky top-0 z-20 bg-[#0d0d14] border-b border-white/10 shadow-lg">

      {/* ── Mobile: toggle bar ───────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm3 6a1 1 0 011-1h10a1 1 0 010 2H7a1 1 0 01-1-1zm4 6a1 1 0 011-1h2a1 1 0 010 2h-2a1 1 0 01-1-1z" />
          </svg>
          Filtri
          {activeCount > 0 && (
            <span className="bg-[#FFD700] text-black text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <svg
            className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Riassunto filtri attivi su mobile */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">U{ageFilter}</span>
          {positionFilter !== 'ALL' && (
            <span className="text-xs text-white/30">{positionFilter}</span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] disabled:opacity-40"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile: pannello filtri espandibile ──────────────────────────── */}
      {open && (
        <div className="md:hidden border-t border-white/5 px-4 pb-4 space-y-4">
          {/* Campionato */}
          <div>
            <span className="text-xs uppercase tracking-widest text-white/30 font-[Oswald]">Campionato</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {uniqueLeagues.map(l => (
                <button
                  key={l.label}
                  onClick={() => toggleLabel(l.label)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    isLabelSelected(l.label)
                      ? 'bg-[#FFD700] text-black border-[#FFD700]'
                      : 'text-white/60 border-white/20'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          {/* Ruolo */}
          <div>
            <span className="text-xs uppercase tracking-widest text-white/30 font-[Oswald]">Ruolo</span>
            <div className="flex gap-2 mt-2">
              {POSITIONS.map(p => (
                <button
                  key={p.value}
                  onClick={() => onPositionChange(p.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    positionFilter === p.value
                      ? 'bg-white/10 text-white border-white/40'
                      : 'text-white/50 border-white/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {/* Età */}
          <div>
            <span className="text-xs uppercase tracking-widest text-white/30 font-[Oswald]">Età max</span>
            <div className="flex gap-2 mt-2">
              {AGES.map(a => (
                <button
                  key={a}
                  onClick={() => onAgeChange(a)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border font-[Oswald] transition-all ${
                    ageFilter === a
                      ? 'bg-white/10 text-white border-white/40'
                      : 'text-white/50 border-white/20'
                  }`}
                >
                  U{a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop: riga unica ──────────────────────────────────────────── */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 py-3 flex-wrap gap-5 items-center">
        {/* Campionato */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs uppercase tracking-widest text-white/40 font-[Oswald]">Campionato</span>
          {uniqueLeagues.map(l => (
            <button
              key={l.label}
              onClick={() => toggleLabel(l.label)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                isLabelSelected(l.label)
                  ? 'bg-[#FFD700] text-black border-[#FFD700]'
                  : 'text-white/60 border-white/20 hover:border-white/50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-white/10" />

        {/* Ruolo */}
        <div className="flex gap-2 items-center">
          <span className="text-xs uppercase tracking-widest text-white/40 font-[Oswald]">Ruolo</span>
          {POSITIONS.map(p => (
            <button
              key={p.value}
              onClick={() => onPositionChange(p.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                positionFilter === p.value
                  ? 'bg-white/10 text-white border-white/40'
                  : 'text-white/60 border-white/20 hover:border-white/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-white/10" />

        {/* Età */}
        <div className="flex gap-2 items-center">
          <span className="text-xs uppercase tracking-widest text-white/40 font-[Oswald]">Età</span>
          {AGES.map(a => (
            <button
              key={a}
              onClick={() => onAgeChange(a)}
              className={`px-3 py-1 rounded-full text-sm font-medium border font-[Oswald] transition-all ${
                ageFilter === a
                  ? 'bg-white/10 text-white border-white/40'
                  : 'text-white/60 border-white/20 hover:border-white/50'
              }`}
            >
              U{a}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 text-[#FFD700] rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Caricamento…' : 'Aggiorna'}
          </button>
        )}
      </div>
    </div>
  );
}
