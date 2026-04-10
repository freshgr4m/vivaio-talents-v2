import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearAllCache,
  fetchAllLeagues,
  getSessionApiCalls,
  readCache,
  type FetchProgress,
  type LeagueResult,
} from './api/football';
import { Filters } from './components/Filters';
import { FormationPage } from './components/FormationPage';
import { LeagueSection } from './components/LeagueSection';
import type { AgeFilter, Player, PositionFilter } from './types/player';
import { LEAGUES } from './types/player';

const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY as string | undefined;

const DISPLAY_GROUPS: { label: string; ids: number[]; name: string }[] = [
  { label: 'Serie A',     ids: [135],                               name: 'Serie A'     },
  { label: 'Serie B',     ids: [136],                               name: 'Serie B'     },
  { label: 'Serie C',     ids: [138, 942, 943],                     name: 'Serie C'     },
  { label: 'Primavera 1', ids: [705],                               name: 'Primavera 1' },
  { label: 'Primavera 2', ids: [706],                               name: 'Primavera 2' },
  { label: 'Serie D',     ids: [426,427,428,429,430,431,432,433,434], name: 'Serie D'   },
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
  return pos;
}

type Tab = 'classifiche' | 'formazione';

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

  useEffect(() => {
    if (!hasFetched.current) { hasFetched.current = true; fetchData(); }
  }, [fetchData]);

  function handleToggleLeague(id: number) {
    setSelectedLeagues(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // All players from selected leagues, filtered, deduplicated
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

  if (!API_KEY) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
        <div className="max-w-md bg-[#13131e] border border-[#FFD700]/30 rounded-2xl p-8 text-center">
          <h2 className="font-[Oswald] text-xl text-[#FFD700] mb-2">API Key mancante</h2>
          <p className="text-white/60 text-sm">Crea <code className="bg-white/10 px-1 rounded">.env</code> con:</p>
          <pre className="mt-3 bg-black/40 rounded-lg p-3 text-left text-xs text-[#FFD700]/80">VITE_API_FOOTBALL_KEY=la_tua_api_key</pre>
          <p className="mt-2 text-white/40 text-xs">Poi riavvia il dev server.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-[Inter] text-white">

      {/* Header */}
      <header className="px-6 pt-8 pb-4 max-w-7xl mx-auto">
        <div className="flex items-end gap-3 mb-6">
          <div>
            <h1 className="font-[Oswald] text-4xl font-bold tracking-wide text-white uppercase">
              Vivaio Talents
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Top giovani talenti italiani Under 23 · Stagione 2024/25
            </p>
          </div>
          <div className="flex-1" />
          <span className="text-3xl">🇮🇹</span>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
          {([
            { id: 'classifiche', label: '📊 Classifiche' },
            { id: 'formazione',  label: '⚽ Formazione'  },
          ] as { id: Tab; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FFD700] text-black font-semibold'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

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
                if (isDone && hasError)  { dot = 'bg-red-400';   label = 'text-red-400';   }
                else if (isDone && isCached) { dot = 'bg-blue-400'; label = 'text-blue-300'; suffix = ' ✓ cache'; }
                else if (isDone)         { dot = 'bg-green-400'; label = 'text-green-400'; suffix = ' ✓'; }
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
        onRefresh={() => fetchData(true)}
        loading={loading}
      />

      {/* TAB: Classifiche */}
      {activeTab === 'classifiche' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
          {DISPLAY_GROUPS.map(group => {
            const anySelected = group.ids.some(id => selectedLeagues.has(id));
            if (!anySelected) return null;

            const groupPlayers = group.ids.flatMap(id => results.get(id)?.players ?? []);
            const groupError   = group.ids.map(id => results.get(id)?.error).find(Boolean);
            const groupLoading = group.ids.some(id => !results.has(id));

            const filtered = groupPlayers.filter(p => {
              if (p.age > ageFilter) return false;
              if (positionFilter !== 'ALL' && positionCode(p.position) !== positionFilter) return false;
              return true;
            });
            // Deduplicate within group (same player in multiple gironi)
            const seen = new Set<number>();
            const deduped = filtered.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
            deduped.sort((a, b) => b.talentScore - a.talentScore);

            return (
              <LeagueSection
                key={group.label}
                leagueName={group.name}
                players={deduped.slice(0, 5)}
                error={groupError}
                loading={groupLoading}
              />
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

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-6 text-center mt-8">
        <p className="text-white/20 text-xs">
          Chiamate API usate in questa sessione:{' '}
          <span className="font-[Oswald] text-[#FFD700]/60 text-sm">{apiCalls}</span>
          <span className="text-white/10"> / ~100 richieste gratuite al giorno</span>
        </p>
        <p className="text-white/10 text-xs mt-1">
          Dati via API-Football · Cache 24h attiva · Stagione 2024
        </p>
      </footer>
    </div>
  );
}
