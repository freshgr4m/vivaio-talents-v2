import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  clearAllCache,
  fetchAllLeagues,
  getSessionApiCalls,
  loadStaticData,
  readCache,
  type FetchProgress,
  type LeagueResult,
} from './api/football';
import { Filters } from './components/Filters';
import { FormationPage } from './components/FormationPage';
import { VivaiPage } from './components/VivaiPage';
import { PlayerModal } from './components/PlayerModal';
import { SearchOverlay } from './components/SearchOverlay';
import { LeagueSection } from './components/LeagueSection';
import type { AgeFilter, Player, PositionFilter } from './types/player';
import { LEAGUES } from './types/player';

const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY as string | undefined;

// ─── Display structure ────────────────────────────────────────────────────────

type SingleGroup = { type: 'single'; name: string; id: number; ids?: number[] };
type NestedGroup  = { type: 'group';  name: string; children: { id: number; name: string }[] };
type DisplayGroup = SingleGroup | NestedGroup;

const DISPLAY_GROUPS: DisplayGroup[] = [
  { type: 'single', name: 'Serie A',     id: 135 },
  { type: 'single', name: 'Serie B',     id: 136 },
  {
    type: 'group', name: 'Serie C',
    children: [
      { id: 138, name: 'Girone A' },
      { id: 942, name: 'Girone B' },
      { id: 943, name: 'Girone C' },
    ],
  },
  {
    type: 'single', name: 'Serie D',
    id: 426,
    ids: [426, 427, 428, 429, 430, 431, 432, 433, 434],
  },
  { type: 'single', name: 'Campionato Primavera 1 (U20)', id: 705 },
  { type: 'single', name: 'Campionato Primavera 2 (U20)', id: 706 },
];

const LEAGUE_NAMES: Record<number, string> = {
  135: 'Serie A',            136: 'Serie B',
  138: 'Serie C – Girone A', 942: 'Serie C – Girone B', 943: 'Serie C – Girone C',
  705: 'Primavera 1',        706: 'Primavera 2',
  426: 'Serie D – Girone A', 427: 'Serie D – Girone B', 428: 'Serie D – Girone C',
  429: 'Serie D – Girone D', 430: 'Serie D – Girone E', 431: 'Serie D – Girone F',
  432: 'Serie D – Girone G', 433: 'Serie D – Girone H', 434: 'Serie D – Girone I',
};

function positionCode(pos: string): string {
  if (pos === 'Attacker' || pos === 'Forward') return 'F';
  if (pos === 'Midfielder') return 'M';
  if (pos === 'Defender')   return 'D';
  if (pos === 'Goalkeeper') return 'G';
  return pos;
}

function filterAndSort(
  players: Player[],
  ageFilter: AgeFilter,
  positionFilter: PositionFilter,
): Player[] {
  const seen = new Set<number>();
  return players
    .filter(p => {
      if (p.age > ageFilter) return false;
      if (positionFilter !== 'ALL' && positionCode(p.position) !== positionFilter) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .sort((a, b) => b.talentScore - a.talentScore);
}

type Tab = 'classifiche' | 'formazione' | 'vivai';

export default function App() {
  const allLeagueIds = LEAGUES.map(l => l.id);

  const [results, setResults]                 = useState<Map<number, LeagueResult>>(new Map());
  const [progress, setProgress]               = useState<Map<number, FetchProgress>>(new Map());
  const [loading, setLoading]                 = useState(false);
  const [apiCalls, setApiCalls]               = useState(0);
  const [activeTab, setActiveTab]             = useState<Tab>('classifiche');
  const [selectedLeagues, setSelectedLeagues] = useState<Set<number>>(new Set(allLeagueIds));
  const [positionFilter, setPositionFilter]   = useState<PositionFilter>('ALL');
  const [ageFilter, setAgeFilter]             = useState<AgeFilter>(23);
  const [openGroups, setOpenGroups]           = useState<Record<string, boolean>>({});
  const [staticMissing, setStaticMissing]     = useState(false);
  const [dataFetchedAt, setDataFetchedAt]     = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer]   = useState<Player | null>(null);
  const [searchOpen, setSearchOpen]           = useState(false);

  const hasFetched = useRef(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!API_KEY) return;
    if (forceRefresh) { clearAllCache(); setResults(new Map()); }
    setProgress(new Map());
    setLoading(true);
    await fetchAllLeagues(
      allLeagueIds,
      (p) => setProgress(prev => new Map(prev).set(p.leagueId, p)),
      (r) => setResults(prev => new Map(prev).set(r.leagueId, r)),
    );
    setApiCalls(getSessionApiCalls());
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Carica dal file statico all'avvio
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    loadStaticData((r) => setResults(prev => new Map(prev).set(r.leagueId, r)))
      .then(({ ok, fetchedAt }) => {
        if (!ok) setStaticMissing(true);
        if (fetchedAt) setDataFetchedAt(fetchedAt);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleToggleLeague(id: number) {
    setSelectedLeagues(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleGroup(name: string) {
    setOpenGroups(prev => ({ ...prev, [name]: !(prev[name] ?? true) }));
  }

  // All players from selected leagues, filtered, deduplicated — for Formazione tab
  const allFilteredPlayers: Player[] = (() => {
    const byId = new Map<number, Player>();
    for (const id of allLeagueIds) {
      if (!selectedLeagues.has(id)) continue;
      for (const p of results.get(id)?.players ?? []) {
        if (p.age > ageFilter) continue;
        const existing = byId.get(p.id);
        if (!existing || p.talentScore > existing.talentScore) byId.set(p.id, p);
      }
    }
    return [...byId.values()];
  })();

  const pendingLeagues = allLeagueIds.filter(id => {
    const p = progress.get(id);
    return !p || (p.status === 'fetching' && !results.has(id));
  });
  const currentlyFetching = [...progress.values()].find(p => p.status === 'fetching');
  const currentName = currentlyFetching ? LEAGUE_NAMES[currentlyFetching.leagueId] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-[Inter] text-white">

      {/* Header */}
      <header className="px-4 sm:px-6 pt-5 sm:pt-8 pb-3 sm:pb-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-[Oswald] text-2xl sm:text-4xl font-bold tracking-wide text-white uppercase leading-tight">
              Vivaio Talents
            </h1>
            <p className="text-white/40 text-xs sm:text-sm mt-0.5">
              U23 italiani · Stagione 2025/26
            </p>
          </div>

          {/* Bottone cerca */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white/50 hover:text-white/80 transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">Cerca</span>
          </button>

          <span className="text-2xl sm:text-3xl">🇮🇹</span>
        </div>

        {/* Tab navigation — scrollabile su mobile */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
          {([
            {
              id: 'classifiche', label: 'Classifiche',
              icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
            {
              id: 'formazione', label: 'Formazione',
              icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              id: 'vivai', label: 'Vivai',
              icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ),
            },
          ] as { id: Tab; label: string; icon: ReactNode }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#FFD700] text-black font-semibold'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Banner: dati mancanti */}
      {staticMissing && !loading && (
        <div className="px-6 pb-2 max-w-7xl mx-auto">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 flex items-start gap-3">
            <span className="text-amber-400 text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-amber-300 text-sm font-medium">Nessun dato disponibile</p>
              <p className="text-amber-300/60 text-xs mt-0.5">
                Esegui <code className="bg-white/10 px-1 rounded">npm run fetch-data</code> nel terminale per scaricare i dati dall'API.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading progress */}
      {loading && (
        <div className="px-6 pb-4 max-w-7xl mx-auto">
          <div className="bg-[#13131e] border border-[#FFD700]/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FFD700] animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span className="text-[#FFD700]/80 text-sm font-medium">
                  {currentName ? `Carico ${currentName}…` : 'Carico campionati…'}
                </span>
              </div>
              <span className="text-white/30 text-xs">
                {allLeagueIds.length - pendingLeagues.length}/{allLeagueIds.length} completati
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allLeagueIds.map(id => {
                const p = progress.get(id);
                const isDone = results.has(id);
                const hasError = results.get(id)?.error;
                const isCached = readCache(id) || p?.status === 'cached';
                let dot = 'bg-white/10', label = 'text-white/30', suffix = '';
                if (isDone && hasError)       { dot = 'bg-red-400';              label = 'text-red-400';   }
                else if (isDone && isCached)  { dot = 'bg-blue-400';             label = 'text-blue-300';  suffix = ' ✓ cache'; }
                else if (isDone)              { dot = 'bg-green-400';            label = 'text-green-400'; suffix = ' ✓'; }
                else if (p?.status === 'fetching') { dot = 'bg-[#FFD700] animate-pulse'; label = 'text-[#FFD700]'; }
                return (
                  <span key={id} className={`flex items-center gap-1.5 text-xs ${label}`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                    {LEAGUE_NAMES[id]}{suffix}
                  </span>
                );
              })}
            </div>
            {currentlyFetching?.waitingSeconds && (
              <p className="text-white/30 text-xs mt-2">
                ⏳ Attendo {currentlyFetching.waitingSeconds}s prima del prossimo campionato (rate limit: 10 req/min)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters (always visible) */}
      <Filters
        leagues={LEAGUES}
        selectedLeagues={selectedLeagues}
        onToggleLeague={handleToggleLeague}
        positionFilter={positionFilter}
        onPositionChange={setPositionFilter}
        ageFilter={ageFilter}
        onAgeChange={setAgeFilter}
        onRefresh={API_KEY ? () => fetchData(true) : undefined}
        loading={loading}
      />

      {/* TAB: Classifiche */}
      {activeTab === 'classifiche' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
          {DISPLAY_GROUPS.map(group => {

            if (group.type === 'single') {
              const idsToCheck = group.ids ?? [group.id];
              const anySelected = idsToCheck.some(id => selectedLeagues.has(id));
              if (!anySelected) return null;
              const selectedIds = idsToCheck.filter(id => selectedLeagues.has(id));
              const allPlayers = selectedIds.flatMap(id => results.get(id)?.players ?? []);
              const error = selectedIds.map(id => results.get(id)?.error).find(Boolean);
              const isLoading = selectedIds.some(id => !results.has(id));
              const players = filterAndSort(allPlayers, ageFilter, positionFilter);
              return (
                <LeagueSection
                  key={group.name}
                  leagueName={group.name}
                  players={players}
                  error={error}
                  loading={isLoading}
                  collapsible
                  defaultOpen={false}
                  onPlayerClick={setSelectedPlayer}
                />
              );
            }

            // Nested group (Serie C, Serie D)
            const anyChildSelected = group.children.some(c => selectedLeagues.has(c.id));
            if (!anyChildSelected) return null;
            const isOpen = openGroups[group.name] ?? false;

            return (
              <div key={group.name}>
                {/* Group header */}
                <div
                  className="flex items-center gap-3 mb-2 cursor-pointer select-none"
                  onClick={() => toggleGroup(group.name)}
                >
                  <h2 className="font-[Oswald] text-2xl font-bold text-white tracking-wide uppercase">
                    {group.name}
                  </h2>
                  <svg
                    className={`w-4 h-4 text-white/30 transition-transform duration-200 shrink-0 ${isOpen ? '' : '-rotate-90'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="flex-1 h-px bg-linear-to-r from-white/10 to-transparent" />
                  <span className="text-xs text-white/20 font-[Inter]">
                    {group.children.filter(c => selectedLeagues.has(c.id)).length} gironi
                  </span>
                </div>

                {/* Gironi */}
                {isOpen && (
                  <div className="space-y-8 pl-4 border-l border-white/8 mt-4">
                    {group.children.map(child => {
                      if (!selectedLeagues.has(child.id)) return null;
                      const result = results.get(child.id);
                      const players = filterAndSort(result?.players ?? [], ageFilter, positionFilter);
                      return (
                        <LeagueSection
                          key={child.id}
                          leagueName={child.name}
                          players={players}
                          error={result?.error}
                          loading={!results.has(child.id)}
                          sub
                          onPlayerClick={setSelectedPlayer}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </main>
      )}

      {/* TAB: Formazione */}
      {activeTab === 'formazione' && (
        <main className="max-w-7xl mx-auto px-6 py-4">
          <FormationPage players={allFilteredPlayers} />
        </main>
      )}

      {/* TAB: Vivai */}
      {activeTab === 'vivai' && (
        <main className="max-w-7xl mx-auto px-6 py-8">
          <VivaiPage players={allFilteredPlayers} />
        </main>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <SearchOverlay
          allPlayers={allFilteredPlayers}
          onSelect={p => { setSelectedPlayer(p); }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* Modal giocatore */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          allPlayers={allFilteredPlayers}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-6 text-center mt-8">
        <p className="text-white/20 text-xs">
          Chiamate API usate in questa sessione:{' '}
          <span className="font-[Oswald] text-[#FFD700]/60 text-sm">{apiCalls}</span>
          <span className="text-white/10"> / ~100 richieste gratuite al giorno</span>
        </p>
        <p className="text-white/10 text-xs mt-1">
          Dati via API-Football · Stagione 2025/26
          {dataFetchedAt && (
            <> · Aggiornato il {new Date(dataFetchedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</>
          )}
        </p>
      </footer>
    </div>
  );
}
