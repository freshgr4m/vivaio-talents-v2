import { useState } from 'react';
import type { Player } from '../types/player';

// ─── helpers ────────────────────────────────────────────────────────────────

type Role = 'GK' | 'DEF' | 'MID' | 'ATT';

function toRole(position: string): Role {
  if (position === 'Goalkeeper') return 'GK';
  if (position === 'Defender')   return 'DEF';
  if (position === 'Midfielder') return 'MID';
  return 'ATT';
}

const ROLE_LABEL: Record<Role, string> = {
  GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', ATT: 'Attaccante',
};

const ROLE_ACCENT: Record<Role, { color: string; bg: string }> = {
  GK:  { color: '#FFD700', bg: 'rgba(255,215,0,0.85)'  },
  DEF: { color: '#00ff87', bg: 'rgba(0,255,135,0.85)'  },
  MID: { color: '#00d4ff', bg: 'rgba(0,212,255,0.85)'  },
  ATT: { color: '#ff3d5a', bg: 'rgba(255,61,90,0.85)'  },
};

const STARTERS: Record<Role, number> = { GK: 1, DEF: 4, MID: 3, ATT: 3 };

const SLOT_X: Record<Role, number[]> = {
  GK:  [50],
  DEF: [13, 35, 65, 87],
  MID: [20, 50, 80],
  ATT: [15, 50, 85],
};
const ROLE_Y: Record<Role, number> = { ATT: 12, MID: 36, DEF: 60, GK: 82 };

function buildFormation(players: Player[]): Formation {
  const byId = new Map<number, Player>();
  for (const p of players) {
    const existing = byId.get(p.id);
    if (!existing || p.talentScore > existing.talentScore) byId.set(p.id, p);
  }

  const groups: Record<Role, Player[]> = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const p of byId.values()) groups[toRole(p.position)].push(p);
  for (const role of Object.keys(groups) as Role[]) {
    groups[role].sort((a, b) => b.talentScore - a.talentScore);
  }

  const starters: Record<Role, Player[]> = {
    GK:  groups.GK.slice(0, STARTERS.GK),
    DEF: groups.DEF.slice(0, STARTERS.DEF),
    MID: groups.MID.slice(0, STARTERS.MID),
    ATT: groups.ATT.slice(0, STARTERS.ATT),
  };
  const reserves: Partial<Record<Role, Player>> = {};
  for (const role of Object.keys(STARTERS) as Role[]) {
    const r = groups[role][STARTERS[role]];
    if (r) reserves[role] = r;
  }

  return { starters, reserves };
}

interface Formation {
  starters: Record<Role, Player[]>;
  reserves: Partial<Record<Role, Player>>;
}

// ─── EmptySlot ───────────────────────────────────────────────────────────────

function EmptySlot({ role }: { role: Role }) {
  const accent = ROLE_ACCENT[role];
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        border: `2px dashed ${accent.color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, color: `${accent.color}45`, letterSpacing: 1 }}>{role}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>—</p>
    </div>
  );
}

// ─── PitchPlayer ─────────────────────────────────────────────────────────────

function PitchPlayer({ player, role, onClick, active }: {
  player: Player; role: Role; onClick: () => void; active: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const accent = ROLE_ACCENT[role];
  const lastName = player.name.split(' ').slice(-1)[0];

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center transition-all duration-150 outline-none"
      style={{ gap: 4, transform: active ? 'scale(1.14)' : undefined }}
    >
      {/* Photo ring */}
      <div style={{
        position: 'relative',
        width: 48, height: 48,
        borderRadius: '50%',
        overflow: 'visible',
      }}>
        {/* Glow ring */}
        {active && (
          <div style={{
            position: 'absolute', inset: -3,
            borderRadius: '50%',
            border: `2px solid ${accent.color}`,
            boxShadow: `0 0 18px ${accent.color}80, 0 0 40px ${accent.color}30`,
            pointerEvents: 'none',
          }} />
        )}
        <div style={{
          width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
          border: `2px solid ${active ? accent.color : 'rgba(255,255,255,0.35)'}`,
          boxShadow: active ? `0 0 14px ${accent.color}60` : '0 2px 8px rgba(0,0,0,0.5)',
          transition: 'border-color 0.15s',
          background: '#1a1a2a',
        }}>
          {!imgErr
            ? <img src={player.photo} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
            : <div style={{ width: '100%', height: '100%', background: accent.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 15, color: '#050508' }}>{initials}</div>
          }
        </div>
        {/* Role badge */}
        <div style={{
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
          background: accent.bg,
          fontFamily: 'var(--font-label)', fontSize: 7, fontWeight: 700,
          color: '#050508', padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5,
          whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}>
          {role}
        </div>
      </div>

      {/* Name + score */}
      <div className="text-center" style={{ marginTop: 6 }}>
        <div style={{
          background: 'rgba(0,0,0,0.62)',
          backdropFilter: 'blur(4px)',
          borderRadius: 4,
          padding: '1px 6px',
          marginBottom: 1,
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#fff', lineHeight: 1.2, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
            {lastName}
          </p>
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: accent.color, lineHeight: 1, textShadow: `0 0 10px ${accent.color}90` }}>
          {player.talentScore.toFixed(1)}
        </p>
      </div>
    </button>
  );
}

// ─── PlayerPopup — shown OUTSIDE the pitch ───────────────────────────────────

function PlayerPopup({ player, role, onClose }: { player: Player; role: Role; onClose: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const accent = ROLE_ACCENT[role];

  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${accent.color}35`,
        borderRadius: 14,
        padding: '16px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${accent.color}18`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${accent.color}50`, flexShrink: 0 }}>
          {!imgErr
            ? <img src={player.photo} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
            : <div style={{ width: '100%', height: '100%', background: accent.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16, color: '#050508' }}>{initials}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: '#fff', lineHeight: 1.1, letterSpacing: '0.03em' }}>{player.name}</p>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', marginTop: 1 }}>
            {ROLE_LABEL[role]} · {player.age}a
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {player.teamLogo && <img src={player.teamLogo} alt="" className="w-4 h-4 object-contain opacity-60" />}
            <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.teamName}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: 4, flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'; }}
        >✕</button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { l: 'TALENT', v: player.talentScore.toFixed(1), c: accent.color },
          { l: 'GOL',    v: player.goals,                  c: '#ff3d5a' },
          { l: 'ASSIST', v: player.assists,                c: '#00d4ff' },
          { l: 'MINUTI', v: player.minutesPlayed,          c: '#00ff87' },
          { l: 'RATING', v: player.rating > 0 ? player.rating.toFixed(1) : '—', c: '#FFD700' },
          { l: 'ETA',    v: player.age,                    c: 'rgba(255,255,255,0.6)' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '7px 4px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1, color: c }}>{v}</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 8, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ReserveCard ─────────────────────────────────────────────────────────────

function ReserveCard({ player, role }: { player: Player; role: Role }) {
  const [imgErr, setImgErr] = useState(false);
  if (!player) return null;
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const accent = ROLE_ACCENT[role];

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '9px 12px', transition: 'border-color 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${accent.color}40`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'; }}
    >
      <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${accent.color}40`, flexShrink: 0 }}>
        {!imgErr
          ? <img src={player.photo} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
          : <div style={{ width: '100%', height: '100%', background: accent.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: '#050508' }}>{initials}</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#fff', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</p>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: 10, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.teamName}</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: accent.color, lineHeight: 1 }}>{player.talentScore.toFixed(1)}</div>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 8, fontWeight: 700, letterSpacing: 1, color: '#050508', background: accent.bg, padding: '1px 4px', borderRadius: 3 }}>{role}</span>
      </div>
    </div>
  );
}

// ─── XI Stats Panel ───────────────────────────────────────────────────────────

function XIStats({ starters }: { starters: Record<Role, Player[]> }) {
  const all = (Object.values(starters) as Player[][]).flat();
  if (all.length === 0) return null;

  const totalGoals   = all.reduce((s, p) => s + p.goals, 0);
  const totalAssists = all.reduce((s, p) => s + p.assists, 0);
  const avgScore     = (all.reduce((s, p) => s + p.talentScore, 0) / all.length).toFixed(1);
  const avgAge       = Math.round(all.reduce((s, p) => s + p.age, 0) / all.length);
  const topScorer    = [...all].sort((a, b) => b.goals - a.goals)[0];
  const topAssister  = [...all].sort((a, b) => b.assists - a.assists)[0];
  const topTalent    = [...all].sort((a, b) => b.talentScore - a.talentScore)[0];

  return (
    <div>
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'GOL XI',      value: totalGoals,   color: '#ff3d5a' },
          { label: 'ASSIST XI',   value: totalAssists, color: '#00d4ff' },
          { label: 'SCORE MEDIO', value: avgScore,     color: 'var(--color-neon)' },
          { label: 'ETÀ MEDIA',   value: avgAge,       color: 'rgba(255,255,255,0.7)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Top performers row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Top scorer',   player: topScorer,   value: `${topScorer?.goals ?? 0} gol`,   color: '#ff3d5a' },
          { label: 'Top assister', player: topAssister, value: `${topAssister?.assists ?? 0} ass`, color: '#00d4ff' },
          { label: 'Top talent',   player: topTalent,   value: topTalent?.talentScore.toFixed(1) ?? '—', color: 'var(--color-neon)' },
        ].map(({ label, player: p, value, color }) => (
          <div key={label} style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderLeft: `3px solid ${color}`,
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {p && (
              <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full object-cover shrink-0"
                style={{ border: `1.5px solid ${color}40` }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{p?.name.split(' ').slice(-1)[0]}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color, lineHeight: 1.2 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FormationPage ────────────────────────────────────────────────────────────

interface FormationPageProps { players: Player[] }

export function FormationPage({ players }: FormationPageProps) {
  const [selected, setSelected] = useState<{ player: Player; role: Role } | null>(null);
  const formation = buildFormation(players);

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⏳</div>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
          Carica prima i dati dalle classifiche.
        </p>
      </div>
    );
  }

  const handleClick = (player: Player, role: Role) => {
    setSelected(prev => prev?.player.id === player.id ? null : { player, role });
  };

  const missingSlots = (Object.keys(STARTERS) as Role[]).flatMap(role => {
    const have = formation.starters[role].length;
    const need = STARTERS[role];
    return Array.from({ length: need - have }, (_, i) => ({ role, slot: i }));
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">

      {/* ── Section title ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(to bottom, var(--color-neon), var(--color-neon-alt))', boxShadow: '0 0 10px rgba(0,255,135,0.5)' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 32px)', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
          Best XI
        </h2>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '3px 10px' }}>
          4 · 3 · 3
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,255,135,0.15), transparent)' }} />
      </div>

      {/* ── 2-col desktop layout ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* LEFT: Pitch */}
        <div className="lg:w-[380px] shrink-0">
          <div
            className="relative w-full overflow-hidden shadow-2xl"
            style={{
              aspectRatio: '2/3',
              borderRadius: 14,
              /* Grass stripes — alternating bands */
              background: `
                repeating-linear-gradient(
                  180deg,
                  #1e5c20 0px, #1e5c20 7%,
                  #215e23 7%, #215e23 14%
                )
              `,
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Outer border */}
            <div className="absolute pointer-events-none" style={{ inset: '3%', border: '1.5px solid rgba(255,255,255,0.22)', borderRadius: 2 }} />

            {/* Halfway line */}
            <div className="absolute pointer-events-none" style={{ left: '3%', right: '3%', top: '50%', height: '1.5px', background: 'rgba(255,255,255,0.22)' }} />

            {/* Center circle */}
            <div className="absolute pointer-events-none" style={{
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '20%', aspectRatio: '1', borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.22)',
            }} />
            {/* Center spot */}
            <div className="absolute pointer-events-none" style={{
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.35)',
            }} />

            {/* Top penalty area */}
            <div className="absolute pointer-events-none" style={{ top: '3%', left: '22%', right: '22%', height: '18%', border: '1.5px solid rgba(255,255,255,0.22)', borderTop: 'none' }} />
            {/* Top goal area */}
            <div className="absolute pointer-events-none" style={{ top: '3%', left: '34%', right: '34%', height: '7%', border: '1.5px solid rgba(255,255,255,0.22)', borderTop: 'none' }} />
            {/* Top penalty spot */}
            <div className="absolute pointer-events-none" style={{
              top: '15%', left: '50%', transform: 'translateX(-50%)',
              width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.35)',
            }} />

            {/* Bottom penalty area */}
            <div className="absolute pointer-events-none" style={{ bottom: '3%', left: '22%', right: '22%', height: '18%', border: '1.5px solid rgba(255,255,255,0.22)', borderBottom: 'none' }} />
            {/* Bottom goal area */}
            <div className="absolute pointer-events-none" style={{ bottom: '3%', left: '34%', right: '34%', height: '7%', border: '1.5px solid rgba(255,255,255,0.22)', borderBottom: 'none' }} />
            {/* Bottom penalty spot */}
            <div className="absolute pointer-events-none" style={{
              bottom: '15%', left: '50%', transform: 'translateX(-50%)',
              width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.35)',
            }} />

            {/* Corner arcs — top-left */}
            <div className="absolute pointer-events-none" style={{
              top: 'calc(3% - 1px)', left: 'calc(3% - 1px)',
              width: '5%', height: '3%',
              borderRight: '1.5px solid rgba(255,255,255,0.22)',
              borderBottom: '1.5px solid rgba(255,255,255,0.22)',
              borderBottomRightRadius: '100%',
            }} />
            {/* Corner arc — top-right */}
            <div className="absolute pointer-events-none" style={{
              top: 'calc(3% - 1px)', right: 'calc(3% - 1px)',
              width: '5%', height: '3%',
              borderLeft: '1.5px solid rgba(255,255,255,0.22)',
              borderBottom: '1.5px solid rgba(255,255,255,0.22)',
              borderBottomLeftRadius: '100%',
            }} />
            {/* Corner arc — bottom-left */}
            <div className="absolute pointer-events-none" style={{
              bottom: 'calc(3% - 1px)', left: 'calc(3% - 1px)',
              width: '5%', height: '3%',
              borderRight: '1.5px solid rgba(255,255,255,0.22)',
              borderTop: '1.5px solid rgba(255,255,255,0.22)',
              borderTopRightRadius: '100%',
            }} />
            {/* Corner arc — bottom-right */}
            <div className="absolute pointer-events-none" style={{
              bottom: 'calc(3% - 1px)', right: 'calc(3% - 1px)',
              width: '5%', height: '3%',
              borderLeft: '1.5px solid rgba(255,255,255,0.22)',
              borderTop: '1.5px solid rgba(255,255,255,0.22)',
              borderTopLeftRadius: '100%',
            }} />

            {/* Formation badge */}
            <div style={{
              position: 'absolute', top: 8, right: 10,
              fontFamily: 'var(--font-display)', fontSize: 13,
              color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em',
            }}>
              4 · 3 · 3
            </div>

            {/* Players */}
            {(Object.keys(STARTERS) as Role[]).flatMap(role =>
              Array.from({ length: STARTERS[role] }, (_, idx) => {
                const player = formation.starters[role][idx];
                const x = SLOT_X[role][idx];
                const y = ROLE_Y[role];
                return (
                  <div key={`${role}-${idx}`} className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                    {player
                      ? <PitchPlayer player={player} role={role} onClick={() => handleClick(player, role)} active={selected?.player.id === player.id} />
                      : <EmptySlot role={role} />
                    }
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Player popup + stats panel */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Selected player popup */}
          {selected ? (
            <PlayerPopup player={selected.player} role={selected.role} onClose={() => setSelected(null)} />
          ) : (
            <div style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 100,
            }}>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textAlign: 'center' }}>
                Clicca un giocatore<br />per vedere i dettagli
              </p>
            </div>
          )}

          {/* XI Stats */}
          <XIStats starters={formation.starters} />

          {/* Reserves */}
          {(Object.keys(STARTERS) as Role[]).some(r => formation.reserves[r]) && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                  Riserve
                </h3>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {(Object.keys(STARTERS) as Role[]).map(role => {
                  const reserve = formation.reserves[role];
                  return reserve ? <ReserveCard key={role} player={reserve} role={role} /> : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Missing slots warning */}
      {missingSlots.length > 0 && (
        <div className="flex items-start gap-2 mt-4" style={{ background: 'rgba(255,160,0,0.07)', border: '1px solid rgba(255,160,0,0.2)', borderRadius: 10, padding: '10px 14px' }}>
          <span style={{ color: '#FFD700', flexShrink: 0 }}>⚠</span>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,200,0,0.7)', letterSpacing: '0.5px' }}>
            {missingSlots.length} slot vuot{missingSlots.length > 1 ? 'i' : 'o'} — abilita più campionati o aumenta l'età max.
          </span>
        </div>
      )}
    </div>
  );
}
