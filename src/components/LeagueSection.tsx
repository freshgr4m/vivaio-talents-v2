import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
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
  onPlayerClick?: (player: Player) => void;
}

function SkeletonCard() {
  return (
    <div
      className="flex items-center gap-4 rounded-xl p-4 animate-pulse"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="w-8 h-5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="w-12 h-12 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-4 rounded w-36" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-3 rounded w-24" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div className="hidden sm:flex gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="w-10 space-y-1">
            <div className="h-5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        ))}
      </div>
      <div className="w-12 space-y-1 pl-2">
        <div className="h-7 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  );
}

const DEFAULT_VISIBLE = 10;
const LOAD_MORE_CHUNK = 25;

export function LeagueSection({
  leagueName,
  players,
  error,
  loading,
  collapsible = false,
  defaultOpen = true,
  sub = false,
  onPlayerClick,
}: LeagueSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE);
  const listRef = useRef<HTMLDivElement>(null);

  const visiblePlayers = players.slice(0, visibleCount);
  const remainingCount = players.length - visibleCount;

  // Reset visibleCount quando cambiano i filtri (nuovi players)
  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE);
  }, [players]);

  useEffect(() => {
    if (!listRef.current || !isOpen || loading) return;
    const cards = listRef.current.querySelectorAll('[data-card]');
    gsap.fromTo(cards,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.045, ease: 'power2.out' }
    );
  }, [isOpen, loading, players.length]);

  return (
    <section>
      {/* ── Section header ──────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-3 mb-4 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={() => { if (collapsible) setIsOpen(o => !o); }}
      >
        {!sub && (
          /* Neon vertical bar */
          <div style={{
            width: 4,
            height: 28,
            borderRadius: 2,
            flexShrink: 0,
            background: 'linear-gradient(to bottom, var(--color-neon), var(--color-neon-alt))',
            boxShadow: '0 0 10px rgba(0,255,135,0.5)',
          }} />
        )}

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: sub ? 16 : 'clamp(20px, 3vw, 28px)',
          color: sub ? 'rgba(255,255,255,0.45)' : '#ffffff',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          {leagueName}
        </h2>

        {collapsible && (
          <svg
            className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isOpen ? '' : '-rotate-90'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}

        {/* Separator line */}
        <div
          className="flex-1 h-px"
          style={{
            background: sub
              ? 'linear-gradient(90deg, rgba(255,255,255,0.06), transparent)'
              : 'linear-gradient(90deg, rgba(0,255,135,0.18), rgba(0,212,255,0.08) 40%, transparent)',
          }}
        />

        {isOpen && !loading && !error && players.length > 0 && (
          <span style={{
            fontFamily: 'var(--font-label)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: 'rgba(255,255,255,0.2)',
            textTransform: 'uppercase',
          }}>
            Top {players.length}
          </span>
        )}
      </div>

      {isOpen && (
        <>
          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {[0,1,2,3,4,5,6,7,8,9].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && error && (
            <div
              className="flex items-start gap-3 rounded-xl p-4"
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                style={{ color: '#ef4444' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                  Errore nel caricamento dati
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(239,68,68,0.6)', marginTop: 2 }}>
                  {error}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && players.length === 0 && (
            <div
              className="flex items-center gap-3 rounded-xl p-4"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                style={{ color: 'rgba(255,255,255,0.2)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                Dati insufficienti per questa stagione
              </p>
            </div>
          )}

          {!loading && !error && players.length > 0 && (
            <>
              <div ref={listRef} className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {visiblePlayers.map((player, i) => (
                  <div key={`${player.id}-${player.leagueId}`} data-card>
                    <PlayerCard
                      player={player}
                      rank={i + 1}
                      onClick={onPlayerClick}
                      animDelay={0}
                    />
                  </div>
                ))}
              </div>

              {remainingCount > 0 && (
                <button
                  onClick={() => setVisibleCount(c => c + LOAD_MORE_CHUNK)}
                  className="mt-3 w-full transition-all"
                  style={{
                    padding: '10px',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.3)',
                    fontFamily: 'var(--font-label)',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,255,135,0.35)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-neon)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)';
                  }}
                >
                  ▼ Carica altri {Math.min(remainingCount, LOAD_MORE_CHUNK)} · {remainingCount} rimanenti
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
