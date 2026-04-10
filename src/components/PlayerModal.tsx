import { useEffect, useState } from 'react';
import type { Player } from '../types/player';

const POSITION_LABELS: Record<string, string> = {
  Attacker: 'ATT', Midfielder: 'MID', Defender: 'DIF', Goalkeeper: 'POR',
};
const POSITION_FULL: Record<string, string> = {
  Attacker: 'Attaccante', Midfielder: 'Centrocampista',
  Defender: 'Difensore',  Goalkeeper: 'Portiere',
};

const POSITION_ACCENT: Record<string, { color: string; bg: string; glow: string }> = {
  Attacker:   { color: '#ff3d5a', bg: 'rgba(255,61,90,0.14)',   glow: 'rgba(255,61,90,0.3)'  },
  Midfielder: { color: '#00d4ff', bg: 'rgba(0,212,255,0.14)',   glow: 'rgba(0,212,255,0.3)'  },
  Defender:   { color: '#00ff87', bg: 'rgba(0,255,135,0.14)',   glow: 'rgba(0,255,135,0.3)'  },
  Goalkeeper: { color: '#FFD700', bg: 'rgba(255,215,0,0.14)',   glow: 'rgba(255,215,0,0.3)'  },
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

interface Props { player: Player; allPlayers: Player[]; onClose: () => void; }

export function PlayerModal({ player, allPlayers, onClose }: Props) {
  const [imgError, setImgError] = useState(false);
  const max = computeMax(allPlayers);
  const league = LEAGUE_HIERARCHY[player.leagueId];

  const goalsP90   = player.minutesPlayed > 0 ? ((player.goals   / player.minutesPlayed) * 90).toFixed(2) : '—';
  const assistsP90 = player.minutesPlayed > 0 ? ((player.assists / player.minutesPlayed) * 90).toFixed(2) : '—';

  const posShort  = POSITION_LABELS[player.position] ?? '—';
  const posFull   = POSITION_FULL[player.position]   ?? player.position;
  const posAccent = POSITION_ACCENT[player.position] ?? { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)', glow: 'rgba(255,255,255,0.2)' };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full overflow-hidden shadow-2xl"
        style={{
          maxWidth: 480,
          background: 'var(--color-bg-elevated)',
          border: `1px solid ${posAccent.color}30`,
          borderRadius: 20,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px ${posAccent.color}15, 0 0 60px ${posAccent.glow}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Texture bgcard3 in bianco/nero + luminosa */}
        <img
          src="/vivaio-talents-v2/bgcard3.jpg"
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            filter: 'grayscale(100%) brightness(1.6) contrast(0.85)',
            opacity: 0.18,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        <div className="relative" style={{ zIndex: 1 }}>
        {/* ── CARD HEADER: colored top band with photo ───────────────────── */}
        <div className="relative overflow-hidden" style={{ minHeight: 200 }}>

          {/* Background: colored gradient + diagonal accent */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(145deg, ${posAccent.bg} 0%, rgba(13,13,20,0.95) 55%, #0d0d14 100%)`,
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse 80% 80% at 20% 50%, ${posAccent.glow} 0%, transparent 65%)`,
            opacity: 0.35,
          }} />
          {/* Diagonal stripe */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(125deg, transparent 45%, rgba(255,255,255,0.025) 55%, transparent 65%)',
          }} />

          <div className="relative z-10 flex items-end gap-0" style={{ padding: '20px 20px 0' }}>

            {/* Photo — large, touching bottom edge */}
            <div style={{
              width: 130, height: 155,
              flexShrink: 0,
              borderRadius: '12px 12px 0 0',
              overflow: 'hidden',
              background: posAccent.bg,
              border: `1.5px solid ${posAccent.color}35`,
              borderBottom: 'none',
              alignSelf: 'flex-end',
            }}>
              {!imgError ? (
                <img
                  src={player.photo}
                  alt={player.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 40, color: posAccent.color,
                }}>
                  {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Right side: name, position, team */}
            <div style={{ flex: 1, minWidth: 0, padding: '0 0 16px 16px' }}>

              {/* Talent score — big number top right */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 56,
                    color: '#FFD700',
                    lineHeight: 1,
                    textShadow: '0 0 24px rgba(255,215,0,0.6)',
                  }}>
                    {player.talentScore.toFixed(1)}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700,
                    letterSpacing: '2.5px', textTransform: 'uppercase',
                    color: 'rgba(255,215,0,0.4)',
                  }}>
                    Talent
                  </div>
                </div>
              </div>

              {/* Position badge */}
              <div style={{ marginBottom: 6 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: posAccent.bg,
                  border: `1px solid ${posAccent.color}50`,
                  fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '1.5px', textTransform: 'uppercase', color: posAccent.color,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: posAccent.color, flexShrink: 0 }} />
                  {posShort} · {posFull}
                </span>
              </div>

              {/* Name */}
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(18px, 4vw, 24px)',
                color: '#ffffff',
                lineHeight: 1.05,
                letterSpacing: '0.02em',
                marginBottom: 8,
              }}>
                {player.name}
              </h2>

              {/* Team + age */}
              <div className="flex items-center gap-2">
                {player.teamLogo && <img src={player.teamLogo} alt="" className="w-5 h-5 object-contain shrink-0" />}
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.teamName}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>
                  🇮🇹 {player.age} anni
                </span>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>
                  {player.leagueName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── STAT GRID — 3 colonne grandi ──────────────────────────────────── */}
        <div className="grid grid-cols-3" style={{ borderTop: `1px solid ${posAccent.color}20` }}>
          {[
            { label: 'Gol',      value: player.goals,        color: '#ff3d5a', max: max.goals },
            { label: 'Assist',   value: player.assists,      color: '#00d4ff', max: max.assists },
            { label: 'Minuti',   value: player.minutesPlayed, color: '#00ff87', max: max.minutes },
          ].map(({ label, value, color, max: m }, i) => {
            const pct = m > 0 ? Math.min(100, Math.round((value / m) * 100)) : 0;
            return (
              <div key={label} style={{
                padding: '14px 12px',
                borderRight: i < 2 ? '1px solid var(--color-border)' : undefined,
                textAlign: 'center',
                background: `linear-gradient(180deg, ${color}08 0%, transparent 100%)`,
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color, lineHeight: 1, textShadow: `0 0 12px ${color}50` }}>
                  {value}
                </div>
                <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
                  {label}
                </div>
                {/* Mini bar */}
                <div style={{ margin: '6px auto 0', width: '60%', height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SECONDARY STATS ───────────────────────────────────────────────── */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Presenze',      value: player.appearances > 0 ? player.appearances : '—', color: '#a855f7' },
              { label: 'Media voto',    value: player.rating > 0 ? player.rating.toFixed(1) : '—', color: 'rgba(255,255,255,0.7)' },
              { label: 'Gol / 90',      value: goalsP90,   color: '#ff3d5a' },
              { label: 'Assist / 90',   value: assistsP90, color: '#00d4ff' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
              }}>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, letterSpacing: '0.5px', color: 'rgba(255,255,255,0.7)' }}>
                  {label}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color, lineHeight: 1 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Talent score bar ──────────────────────────────────────────────── */}
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{
            padding: '12px 14px',
            background: 'rgba(255,215,0,0.05)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,215,0,0.6)' }}>
                Talent Score
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#FFD700', lineHeight: 1 }}>
                {player.talentScore.toFixed(1)}
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, (player.talentScore / max.score) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FFD700, #ffec60)',
                borderRadius: 3,
                boxShadow: '0 0 8px rgba(255,215,0,0.5)',
              }} />
            </div>
          </div>
        </div>

        {/* ── Traiettoria ───────────────────────────────────────────────────── */}
        {league && (
          <div style={{ padding: '0 20px 14px' }}>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
              Traiettoria
            </div>
            <div className="flex items-center gap-2">
              <span style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: 7, fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
                {league.label}
              </span>
              {league.next && (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--color-neon)', flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span style={{ padding: '5px 12px', background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.3)', borderRadius: 7, fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700, color: 'var(--color-neon)', letterSpacing: '0.5px' }}>
                    {league.next}
                  </span>
                </>
              )}
              {!league.next && <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>già al massimo livello</span>}
            </div>
          </div>
        )}

        {/* ── Close button ─────────────────────────────────────────────────── */}
        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={onClose}
            className="w-full transition-all"
            style={{
              padding: '11px',
              borderRadius: 10,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.35)',
              fontFamily: 'var(--font-label)',
              fontSize: 12, fontWeight: 700,
              letterSpacing: '2.5px', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)';
            }}
          >
            Chiudi
          </button>
        </div>
        </div>{/* end z-index wrapper */}
      </div>
    </div>
  );
}
