import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import type { Player } from '../types/player';
import { LEAGUE_COEFFICIENTS } from '../utils/scoring';

const POSITION_LABELS: Record<string, string> = {
  Attacker:   'ATT',
  Midfielder: 'MID',
  Defender:   'DIF',
  Goalkeeper: 'POR',
};

// FUT-style position accent colors
const POSITION_ACCENT: Record<string, { color: string; bg: string; glow: string }> = {
  Attacker:   { color: '#ff3d5a', bg: 'rgba(255,61,90,0.12)',   glow: 'rgba(255,61,90,0.4)' },
  Midfielder: { color: '#00d4ff', bg: 'rgba(0,212,255,0.12)',   glow: 'rgba(0,212,255,0.4)' },
  Defender:   { color: '#00ff87', bg: 'rgba(0,255,135,0.12)',   glow: 'rgba(0,255,135,0.4)' },
  Goalkeeper: { color: '#FFD700', bg: 'rgba(255,215,0,0.12)',   glow: 'rgba(255,215,0,0.4)' },
};

interface PlayerCardProps {
  player: Player;
  rank: number;
  onClick?: (player: Player) => void;
  animDelay?: number;
}

function tierConfig(rank: number) {
  if (rank === 1) return {
    borderLeft: '#FFD700',
    rankColor:  '#FFD700',
    glow:       '0 4px 24px rgba(255,215,0,0.12), 0 1px 0 rgba(255,215,0,0.08) inset',
    bgOverlay:  'rgba(255,215,0,0.025)',
  };
  if (rank <= 3) return {
    borderLeft: '#00d4ff',
    rankColor:  '#00d4ff',
    glow:       '0 4px 20px rgba(0,212,255,0.08)',
    bgOverlay:  'rgba(0,212,255,0.018)',
  };
  if (rank <= 5) return {
    borderLeft: '#a855f7',
    rankColor:  '#a855f7',
    glow:       '0 4px 16px rgba(168,85,247,0.06)',
    bgOverlay:  'rgba(168,85,247,0.015)',
  };
  return {
    borderLeft: 'rgba(255,255,255,0.06)',
    rankColor:  'rgba(255,255,255,0.2)',
    glow:       'none',
    bgOverlay:  'rgba(255,255,255,0.018)',
  };
}

export function PlayerCard({ player, rank, onClick, animDelay = 0 }: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tier = tierConfig(rank);
  const posAccent = POSITION_ACCENT[player.position] ?? { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', glow: 'rgba(255,255,255,0.3)' };
  const posLabel = POSITION_LABELS[player.position] ?? player.position?.slice(0, 3).toUpperCase() ?? '—';

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.4, delay: animDelay, ease: 'power2.out' }
    );
  }, [animDelay]);

  return (
    <div
      ref={cardRef}
      onClick={() => onClick?.(player)}
      className="group relative overflow-hidden cursor-pointer card-diagonal"
      style={{
        background: `linear-gradient(135deg, ${tier.bgOverlay} 0%, var(--color-bg-card) 60%)`,
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${tier.borderLeft}`,
        borderRadius: 12,
        boxShadow: tier.glow,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => {
        gsap.to(e.currentTarget, { scale: 1.008, duration: 0.15, ease: 'power2.out' });
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `${tier.glow}, 0 0 0 1px ${tier.borderLeft}22`;
      }}
      onMouseLeave={e => {
        gsap.to(e.currentTarget, { scale: 1, duration: 0.15, ease: 'power2.out' });
        (e.currentTarget as HTMLDivElement).style.boxShadow = tier.glow;
      }}
    >
      {/* Subtle hover sweep */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(118deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex items-center gap-3 p-3 sm:p-4">

        {/* ── Rank ─────────────────────────────────────────────────────── */}
        <div className="w-8 text-center shrink-0">
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            color: tier.rankColor,
            lineHeight: 1,
            display: 'block',
          }}>
            {rank}
          </span>
        </div>

        {/* ── Photo + position badge ────────────────────────────────────── */}
        <div className="relative shrink-0">
          {!imgError ? (
            <img
              src={player.photo}
              alt={player.name}
              onError={() => setImgError(true)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
              style={{
                border: `1.5px solid ${posAccent.color}30`,
                background: 'rgba(255,255,255,0.04)',
                transition: 'border-color 0.2s',
              }}
            />
          ) : (
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
              style={{
                background: posAccent.bg,
                border: `1.5px solid ${posAccent.color}30`,
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                color: posAccent.color,
              }}
            >
              {player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          {/* Position badge — bottom right of photo */}
          <div
            className="absolute -bottom-1 -right-1 flex items-center justify-center"
            style={{
              width: 20, height: 20,
              borderRadius: 4,
              background: posAccent.bg,
              border: `1px solid ${posAccent.color}50`,
              backdropFilter: 'blur(4px)',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-label)',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: posAccent.color,
            }}>
              {posLabel}
            </span>
          </div>
        </div>

        {/* ── Player info ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div
            className="truncate group-hover:text-[#00ff87] transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '0.02em',
            }}
          >
            {player.name}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {player.teamLogo && (
              <img src={player.teamLogo} alt="" className="w-3.5 h-3.5 object-contain opacity-50" />
            )}
            <span style={{
              fontFamily: 'var(--font-label)',
              fontSize: 11,
              letterSpacing: '0.5px',
              color: 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {player.teamName}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10 }}>·</span>
            <span style={{
              fontFamily: 'var(--font-label)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
              whiteSpace: 'nowrap',
            }}>
              {player.age}a
            </span>
          </div>
        </div>

        {/* ── Stats grid ───────────────────────────────────────────────── */}
        <div className="hidden sm:grid grid-cols-4 gap-3 shrink-0">
          <StatCell label="GOL"    value={player.goals}    accent />
          <StatCell label="ASS"    value={player.assists} />
          <StatCell label="MIN"    value={player.minutesPlayed} />
          <StatCell label="VOTE"   value={player.rating > 0 ? player.rating.toFixed(1) : '—'} />
        </div>

        {/* ── Talent Score ─────────────────────────────────────────────── */}
        <div
          className="shrink-0 text-right pl-3"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 3vw, 32px)',
            color: 'var(--color-neon)',
            lineHeight: 1,
            textShadow: '0 0 12px rgba(0,255,135,0.5)',
          }}>
            {player.talentScore.toFixed(1)}
          </div>
          <div style={{
            fontFamily: 'var(--font-label)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(0,255,135,0.4)',
            marginTop: 2,
          }}>
            Score
          </div>
          {/* Coefficienti visibili con tooltip */}
          <ScoreTooltip player={player} />
        </div>
      </div>
    </div>
  );
}

// Tooltip interattivo con breakdown del calcolo score — usa portal per sfuggire a overflow:hidden
function ScoreTooltip({ player }: { player: Player }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const baseScore = (player.goals * 4) + (player.assists * 3) + (player.minutesPlayed / 90 * 0.8) + (player.rating * 2);
  const agePct = Math.round((player.ageBonus - 1) * 100);

  const handleEnter = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: r.top + window.scrollY - 8,   // 8px gap sopra
        right: window.innerWidth - r.right,
      });
    }
    setVisible(true);
  };

  return (
    <div
      ref={triggerRef}
      className="flex items-center justify-end gap-1 mt-1"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
    >
      <LeagueCoeffBadge coeff={player.leagueCoeff} />
      {player.ageBonus > 1 && <AgeBonusBadge bonus={player.ageBonus} />}

      {visible && createPortal(
        <div
          className="pointer-events-none"
          style={{
            position: 'absolute',
            top: coords.top,
            right: coords.right,
            zIndex: 9999,
            transform: 'translateY(-100%)',
            minWidth: 190,
          }}
        >
          <div style={{
            background: '#0d1117',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '10px 12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            textAlign: 'left',
          }}>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 8 }}>
              Come si calcola
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <ScoreRow label="Base stat" value={baseScore.toFixed(1)} color="rgba(255,255,255,0.6)" />
              <ScoreRow label={`Lega (×${player.leagueCoeff.toFixed(1)})`} value={`= ${(baseScore * player.leagueCoeff).toFixed(1)}`} color={leagueCoeffColor(player.leagueCoeff).text} />
              {player.ageBonus > 1 && (
                <ScoreRow label={`Età ${player.age}a (+${agePct}%)`} value={`= ${player.talentScore.toFixed(1)}`} color="#00ff87" />
              )}
            </div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase' }}>
                Talent Score
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#FFD700' }}>
                {player.talentScore.toFixed(1)}
              </span>
            </div>
            {/* Freccia verso il basso */}
            <div style={{ position: 'absolute', bottom: -5, right: 10, width: 8, height: 8, background: '#0d1117', border: '1px solid rgba(255,255,255,0.12)', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function ScoreRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontFamily: 'var(--font-label)', fontSize: 10, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

// Colore del badge in base al coefficiente lega
function leagueCoeffColor(coeff: number): { text: string; bg: string } {
  if (coeff >= 4.0) return { text: '#FFD700', bg: 'rgba(255,215,0,0.12)' };   // Serie A — oro
  if (coeff >= 2.5) return { text: '#C0C0C0', bg: 'rgba(192,192,192,0.12)' }; // Serie B — argento
  if (coeff >= 1.3) return { text: '#CD7F32', bg: 'rgba(205,127,50,0.12)' };  // Serie C / Primavera 1 — bronzo
  return { text: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)' };     // D / Primavera 2
}

function LeagueCoeffBadge({ coeff }: { coeff: number }) {
  const { text, bg } = leagueCoeffColor(coeff);
  return (
    <span style={{
      fontFamily: 'var(--font-label)',
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: '0.5px',
      color: text,
      background: bg,
      border: `1px solid ${text}30`,
      borderRadius: 3,
      padding: '1px 4px',
      whiteSpace: 'nowrap',
    }}>
      ×{coeff.toFixed(1)}
    </span>
  );
}

function AgeBonusBadge({ bonus }: { bonus: number }) {
  const pct = Math.round((bonus - 1) * 100);
  return (
    <span style={{
      fontFamily: 'var(--font-label)',
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: '0.5px',
      color: '#00ff87',
      background: 'rgba(0,255,135,0.10)',
      border: '1px solid rgba(0,255,135,0.25)',
      borderRadius: 3,
      padding: '1px 4px',
      whiteSpace: 'nowrap',
    }}>
      ⬆+{pct}%
    </span>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        color: accent ? '#ffffff' : 'rgba(255,255,255,0.55)',
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--font-label)',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.22)',
        marginTop: 2,
      }}>
        {label}
      </div>
    </div>
  );
}
