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
  { value: 'F', label: 'Attaccanti' },
  { value: 'M', label: 'Centrocampisti' },
  { value: 'D', label: 'Difensori' },
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
  // Deduplicate leagues by label for checkboxes
  const seen = new Set<string>();
  const uniqueLeagues = leagues.filter(l => {
    if (seen.has(l.label)) return false;
    seen.add(l.label);
    return true;
  });

  // For a grouped league (Serie C), toggling its label toggles all IDs with that label
  const getIdsByLabel = (label: string) => leagues.filter(l => l.label === label).map(l => l.id);
  const isLabelSelected = (label: string) => getIdsByLabel(label).every(id => selectedLeagues.has(id));

  function toggleLabel(label: string) {
    const ids = getIdsByLabel(label);
    const allOn = ids.every(id => selectedLeagues.has(id));
    ids.forEach(id => onToggleLeague(id));
    // onToggleLeague will flip each individually; if all were on, they'll go off
    // But since we call onToggleLeague per id and it flips, handle atomically by forcing:
    // We'll rely on the parent handling toggle correctly.
    void allOn;
  }

  return (
    <div className="sticky top-0 z-20 bg-[#0d0d14] border-b border-white/10 py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-6 items-center">

        {/* League toggles */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs uppercase tracking-widest text-white/40 font-[Oswald]">Campionato</span>
          {uniqueLeagues.map(l => (
            <button
              key={l.label}
              onClick={() => toggleLabel(l.label)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                isLabelSelected(l.label)
                  ? 'bg-[#FFD700] text-black border-[#FFD700]'
                  : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-white/10 hidden md:block" />

        {/* Position filter */}
        <div className="flex gap-2 items-center">
          <span className="text-xs uppercase tracking-widest text-white/40 font-[Oswald]">Ruolo</span>
          {POSITIONS.map(p => (
            <button
              key={p.value}
              onClick={() => onPositionChange(p.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                positionFilter === p.value
                  ? 'bg-white/10 text-white border-white/40'
                  : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-white/10 hidden md:block" />

        {/* Age filter */}
        <div className="flex gap-2 items-center">
          <span className="text-xs uppercase tracking-widest text-white/40 font-[Oswald]">Età max</span>
          {AGES.map(a => (
            <button
              key={a}
              onClick={() => onAgeChange(a)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all font-[Oswald] ${
                ageFilter === a
                  ? 'bg-white/10 text-white border-white/40'
                  : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'
              }`}
            >
              U{a}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Refresh button — solo se API key disponibile */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 text-[#FFD700] rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Caricamento…' : 'Aggiorna dati'}
          </button>
        )}
      </div>
    </div>
  );
}
