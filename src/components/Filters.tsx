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
    <div
      className="sticky top-0 z-20"
      style={{
        background: 'rgba(5,5,8,0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Neon top accent line */}
      <div style={{
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.4) 30%, rgba(0,212,255,0.25) 70%, transparent)',
      }} />

      {/* ── Mobile: toggle bar ─────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 transition-colors"
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm3 6a1 1 0 011-1h10a1 1 0 010 2H7a1 1 0 01-1-1zm4 6a1 1 0 011-1h2a1 1 0 010 2h-2a1 1 0 01-1-1z" />
          </svg>
          Filtri
          {activeCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              width: 16, height: 16,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-neon)', color: '#050508',
            }}>
              {activeCount}
            </span>
          )}
          <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
            U{ageFilter}
          </span>
          {positionFilter !== 'ALL' && (
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
              {positionFilter}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="transition-all disabled:opacity-40"
              style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%',
                border: '1px solid rgba(0,255,135,0.3)',
                color: 'var(--color-neon)',
                background: 'rgba(0,255,135,0.07)',
              }}
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile: pannello espandibile ────────────────────────────────────── */}
      {open && (
        <div className="md:hidden border-t px-4 pb-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
          <FilterGroup label="Campionato">
            {uniqueLeagues.map(l => (
              <FilterChip key={l.label} active={isLabelSelected(l.label)} onClick={() => toggleLabel(l.label)}>
                {l.label}
              </FilterChip>
            ))}
          </FilterGroup>
          <FilterGroup label="Ruolo">
            {POSITIONS.map(p => (
              <FilterChip key={p.value} active={positionFilter === p.value} onClick={() => onPositionChange(p.value)} secondary>
                {p.label}
              </FilterChip>
            ))}
          </FilterGroup>
          <FilterGroup label="Età max">
            {AGES.map(a => (
              <FilterChip key={a} active={ageFilter === a} onClick={() => onAgeChange(a)} secondary>
                U{a}
              </FilterChip>
            ))}
          </FilterGroup>
        </div>
      )}

      {/* ── Desktop: riga unica ─────────────────────────────────────────────── */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 py-2.5 flex-wrap gap-5 items-center">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span style={{
            fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700,
            letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
            marginRight: 4,
          }}>
            Liga
          </span>
          {uniqueLeagues.map(l => (
            <FilterChip key={l.label} active={isLabelSelected(l.label)} onClick={() => toggleLabel(l.label)}>
              {l.label}
            </FilterChip>
          ))}
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--color-border)' }} />

        <div className="flex gap-1.5 items-center">
          <span style={{
            fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700,
            letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
            marginRight: 4,
          }}>
            Ruolo
          </span>
          {POSITIONS.map(p => (
            <FilterChip key={p.value} active={positionFilter === p.value} onClick={() => onPositionChange(p.value)} secondary>
              {p.label}
            </FilterChip>
          ))}
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--color-border)' }} />

        <div className="flex gap-1.5 items-center">
          <span style={{
            fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700,
            letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
            marginRight: 4,
          }}>
            Età
          </span>
          {AGES.map(a => (
            <FilterChip key={a} active={ageFilter === a} onClick={() => onAgeChange(a)} secondary>
              U{a}
            </FilterChip>
          ))}
        </div>

        <div className="flex-1" />

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 transition-all disabled:opacity-50"
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid rgba(0,255,135,0.25)',
              background: 'rgba(0,255,135,0.06)',
              color: 'var(--color-neon)',
              fontFamily: 'var(--font-label)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Carico…' : 'Aggiorna'}
          </button>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={{
        fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700,
        letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
        display: 'block', marginBottom: 6,
      }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children, secondary }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="transition-all"
      style={active ? {
        padding: '4px 12px',
        borderRadius: 20,
        border: secondary ? '1px solid rgba(255,255,255,0.35)' : '2px solid var(--color-neon)',
        background: secondary ? 'rgba(255,255,255,0.08)' : 'rgba(0,255,135,0.1)',
        color: secondary ? '#fff' : 'var(--color-neon)',
        fontFamily: 'var(--font-label)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '1.5px',
        textTransform: 'uppercase' as const,
        boxShadow: secondary ? 'none' : '0 0 10px rgba(0,255,135,0.2)',
        display: 'flex', alignItems: 'center', gap: 5,
      } : {
        padding: '4px 12px',
        borderRadius: 20,
        border: '1px solid var(--color-border)',
        background: 'transparent',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-label)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '1.5px',
        textTransform: 'uppercase' as const,
      }}
    >
      {active && !secondary && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--color-neon)',
          boxShadow: '0 0 6px rgba(0,255,135,0.8)',
          flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  );
}
