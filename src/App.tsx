import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  loadStaticData,
  type LeagueResult,
} from './api/football';
import { Filters } from './components/Filters';
import { DashboardPage } from './components/DashboardPage';
import { FormationPage } from './components/FormationPage';
import { MinutaggioPage } from './components/MinutaggioPage';
import { VivaiPage } from './components/VivaiPage';
import { PlayerModal } from './components/PlayerModal';
import { SearchOverlay } from './components/SearchOverlay';
import { LeagueSection } from './components/LeagueSection';
import type { AgeFilter, Player, PositionFilter } from './types/player';
import { LEAGUES } from './types/player';


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

type Tab = 'home' | 'classifiche' | 'formazione' | 'vivai' | 'minutaggio';

export default function App() {
  const allLeagueIds = LEAGUES.map(l => l.id);

  const [results, setResults]                 = useState<Map<number, LeagueResult>>(new Map());
  const [loading, setLoading]                 = useState(false);
  const [activeTab, setActiveTab]             = useState<Tab>('home');
  const [selectedLeagues, setSelectedLeagues] = useState<Set<number>>(new Set(allLeagueIds));
  const [positionFilter, setPositionFilter]   = useState<PositionFilter>('ALL');
  const [ageFilter, setAgeFilter]             = useState<AgeFilter>(23);
  const [openGroups, setOpenGroups]           = useState<Record<string, boolean>>({});
  const [staticMissing, setStaticMissing]     = useState(false);
  const [dataFetchedAt, setDataFetchedAt]     = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer]   = useState<Player | null>(null);
  const [searchOpen, setSearchOpen]           = useState(false);

  const hasFetched = useRef(false);

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

  return (
    <div className="min-h-screen text-white" style={{ background: 'var(--color-bg)' }}>

      {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden"
        style={{ background: 'var(--color-bg)' }}
      >
        {/* Diagonal neon band */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            background: 'linear-gradient(118deg, transparent 30%, rgba(0,255,135,0.07) 50%, rgba(0,212,255,0.04) 70%, transparent 85%)',
            clipPath: 'polygon(38% 0%, 100% 0%, 100% 100%, 55% 100%)',
          }}
        />
        {/* Second diagonal accent */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 0, left: '-10%', width: '55%', height: '100%',
            background: 'linear-gradient(118deg, rgba(0,255,135,0.04) 0%, transparent 60%)',
            clipPath: 'polygon(0% 0%, 90% 0%, 60% 100%, 0% 100%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-6">
          {/* Top row: logo + search */}
          <div className="flex items-center gap-4 mb-6">
            {/* Logo block */}
            <div className="flex-1 min-w-0">
              <img
                src={`${import.meta.env.BASE_URL}logo-scritta.png`}
                alt="Vivaio Talents"
                className="h-14 sm:h-20 w-auto object-contain"
              />
              {/* Neon underline */}
              <div style={{
                width: 80, height: 3,
                background: 'var(--color-neon)',
                boxShadow: '0 0 12px rgba(0,255,135,0.6)',
                marginTop: 10, marginBottom: 8,
              }} />
              <p style={{
                fontFamily: 'var(--font-label)',
                fontSize: 'clamp(10px, 1.5vw, 12px)',
                letterSpacing: '4px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
              }}>
                Top giovani talenti italiani · Under 23 · Stagione 2025/26
              </p>
            </div>

            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="shrink-0 flex items-center gap-2 transition-all"
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-label)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = 'rgba(0,255,135,0.4)';
                el.style.color = 'var(--color-neon)';
                el.style.boxShadow = '0 0 16px rgba(0,255,135,0.15)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = 'var(--color-border)';
                el.style.color = 'var(--color-text-muted)';
                el.style.boxShadow = 'none';
              }}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Cerca</span>
            </button>
          </div>

          {/* ── Tab navigation (pill style) ─────────────────────────────────── */}
          <div
            className="flex gap-1 w-full sm:w-auto"
            style={{
              padding: '4px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
            }}
          >
            {([
              {
                id: 'home', label: 'Home',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
              },
              {
                id: 'classifiche', label: 'Classifiche',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                id: 'formazione', label: 'Formazione',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                id: 'vivai', label: 'Vivai',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
              },
              {
                id: 'minutaggio', label: 'Minutaggio',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ] as { id: Tab; label: string; icon: ReactNode }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 whitespace-nowrap"
                style={activeTab === tab.id ? {
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: 'var(--color-neon)',
                  color: '#050508',
                  fontFamily: 'var(--font-label)',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 16px rgba(0,255,135,0.35)',
                  border: '1px solid transparent',
                  transition: 'color 0.15s, border-color 0.15s',
                } : {
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'var(--font-label)',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  border: '1px solid var(--color-border)',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  if (activeTab !== tab.id) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-neon)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,255,135,0.4)';
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== tab.id) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                  }
                }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Banner: dati mancanti */}
      {staticMissing && !loading && (
        <div className="px-6 pb-2 max-w-7xl mx-auto">
          <div className="flex items-start gap-3 rounded-xl px-5 py-4"
            style={{ background: 'rgba(255,160,0,0.08)', border: '1px solid rgba(255,160,0,0.25)' }}>
            <span style={{ color: '#FFD700', fontSize: 16, flexShrink: 0 }}>⚠</span>
            <div>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700, letterSpacing: '1px', color: '#FFD700' }}>
                Nessun dato disponibile
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,215,0,0.5)', marginTop: 3 }}>
                Esegui <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>npm run fetch-data</code> nel terminale per scaricare i dati.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center justify-center gap-2 px-6 pb-4">
          <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--color-neon)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, letterSpacing: '2px', color: 'rgba(255,255,255,0.3)' }}>
            CARICAMENTO DATI…
          </span>
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
        onRefresh={undefined}
        loading={loading}
      />

      {/* TAB: Home */}
      {activeTab === 'home' && (
        <main className="max-w-7xl mx-auto">
          <DashboardPage
            players={allFilteredPlayers}
            onPlayerClick={setSelectedPlayer}
            loading={loading}
          />
        </main>
      )}

      {/* TAB: Classifiche */}
      {activeTab === 'classifiche' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
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
                  <div style={{
                    width: 4, height: 28, borderRadius: 2, flexShrink: 0,
                    background: 'linear-gradient(to bottom, var(--color-neon), var(--color-neon-alt))',
                    boxShadow: '0 0 10px rgba(0,255,135,0.5)',
                  }} />
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(20px, 3vw, 28px)',
                    color: '#ffffff',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}>
                    {group.name}
                  </h2>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isOpen ? '' : '-rotate-90'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,255,135,0.18), rgba(0,212,255,0.08) 40%, transparent)' }} />
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                    {group.children.filter(c => selectedLeagues.has(c.id)).length} gironi
                  </span>
                </div>

                {/* Gironi */}
                {isOpen && (
                  <div className="space-y-8 pl-4 mt-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
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

      {/* TAB: Minutaggio */}
      {activeTab === 'minutaggio' && (
        <main className="max-w-7xl mx-auto px-6 py-8">
          <MinutaggioPage players={allFilteredPlayers} onPlayerClick={setSelectedPlayer} />
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
      <footer className="py-8 px-6 text-center mt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, letterSpacing: '1px', color: 'rgba(255,255,255,0.1)', marginTop: 4 }}>
          Dati via API-Football · Stagione 2025/26
          {dataFetchedAt && (
            <> · Aggiornato il {new Date(dataFetchedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</>
          )}
        </p>
      </footer>
    </div>
  );
}
