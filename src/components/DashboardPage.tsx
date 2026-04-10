import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Player } from '../types/player';

// ─── League groups for spotlight ─────────────────────────────────────────────

const LEAGUE_GROUPS = [
  { name: 'Serie A',      ids: [135],                              color: '#00ff87',  short: 'A'  },
  { name: 'Serie B',      ids: [136],                              color: '#00d4ff',  short: 'B'  },
  { name: 'Serie C',      ids: [138, 942, 943],                   color: '#FFD700',  short: 'C'  },
  { name: 'Serie D',      ids: [426,427,428,429,430,431,432,433,434], color: '#a855f7', short: 'D' },
  { name: 'Primavera 1',  ids: [705],                              color: '#ff3d5a',  short: 'P1' },
  { name: 'Primavera 2',  ids: [706],                              color: '#ff8c42',  short: 'P2' },
];

const POSITION_LABELS: Record<string, string> = {
  Attacker: 'ATT', Midfielder: 'MID', Defender: 'DIF', Goalkeeper: 'POR',
};
const POSITION_COLOR: Record<string, string> = {
  Attacker: '#ff3d5a', Midfielder: '#00d4ff', Defender: '#00ff87', Goalkeeper: '#FFD700',
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div style={{ width: 4, height: 26, borderRadius: 2, flexShrink: 0, background: 'linear-gradient(to bottom, var(--color-neon), var(--color-neon-alt))', boxShadow: '0 0 10px rgba(0,255,135,0.5)' }} />
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3vw, 28px)', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
          {title}
        </h2>
        {sub && <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', marginTop: 2 }}>{sub}</p>}
      </div>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,255,135,0.15), transparent)' }} />
    </div>
  );
}

// ─── Compact player row (Top 5) ───────────────────────────────────────────────

function TopPlayerRow({ player, rank, onClick }: { player: Player; rank: number; onClick: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const posColor = POSITION_COLOR[player.position] ?? 'rgba(255,255,255,0.5)';
  const posLabel = POSITION_LABELS[player.position] ?? '—';

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const rankColor  = rankColors[rank - 1] ?? 'rgba(255,255,255,0.2)';

  return (
    <div
      className="flex items-center gap-3 cursor-pointer group"
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        background: 'var(--color-bg-elevated)',
        border: `1px solid var(--color-border)`,
        borderLeft: `3px solid ${rankColor}`,
        transition: 'background 0.15s, box-shadow 0.15s',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${rankColor}25`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-elevated)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Rank */}
      <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: rankColor, lineHeight: 1 }}>{rank}</span>
      </div>

      {/* Photo */}
      <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${rankColor}35`, flexShrink: 0, background: '#1a1a2a' }}>
        {!imgErr
          ? <img src={player.photo} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13, color: rankColor }}>
              {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
        }
      </div>

      {/* Name + team */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: '#fff', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          className="group-hover:text-[#00ff87] transition-colors duration-150">
          {player.name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {player.teamLogo && <img src={player.teamLogo} alt="" className="w-3.5 h-3.5 object-contain opacity-50" />}
          <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.teamName}</span>
        </div>
      </div>

      {/* Position badge */}
      <span style={{
        fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '1px',
        color: posColor, background: `${posColor}15`,
        border: `1px solid ${posColor}35`,
        padding: '2px 6px', borderRadius: 4, flexShrink: 0,
      }}>
        {posLabel}
      </span>

      {/* Score */}
      <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 8, borderLeft: '1px solid var(--color-border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-neon)', lineHeight: 1, textShadow: '0 0 10px rgba(0,255,135,0.4)' }}>
          {player.talentScore.toFixed(1)}
        </div>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: 8, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(0,255,135,0.4)' }}>SCORE</div>
      </div>
    </div>
  );
}

// ─── League spotlight card ───────────────────────────────────────────────────

function LeagueCard({ name, color, topPlayer, playerCount, onClick }: {
  name: string; color: string; topPlayer: Player | null;
  playerCount: number; onClick: (p: Player) => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderTop: `3px solid ${color}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${color}18`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      {/* League header */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', letterSpacing: '0.05em' }}>{name}</span>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color, background: `${color}15`, padding: '2px 8px', borderRadius: 4 }}>
          {playerCount} talenti
        </span>
      </div>

      {topPlayer ? (
        <div
          className="flex items-center gap-3 cursor-pointer"
          style={{ padding: '12px 14px' }}
          onClick={() => onClick(topPlayer)}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        >
          <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${color}40`, flexShrink: 0, background: '#1a1a2a' }}>
            {!imgErr
              ? <img src={topPlayer.photo} alt={topPlayer.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, color }}>
                  {topPlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topPlayer.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {topPlayer.teamLogo && <img src={topPlayer.teamLogo} alt="" className="w-3.5 h-3.5 object-contain opacity-50" />}
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 10, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {topPlayer.teamName}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color, lineHeight: 1, textShadow: `0 0 12px ${color}50` }}>
              {topPlayer.talentScore.toFixed(1)}
            </div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 8, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: `${color}60` }}>
              #{1} LEGA
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px 14px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Nessun dato</p>
        </div>
      )}
    </div>
  );
}

// ─── Rising Star card ────────────────────────────────────────────────────────

function RisingStarCard({ player, onClick }: { player: Player; onClick: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const posColor = POSITION_COLOR[player.position] ?? 'rgba(255,255,255,0.5)';
  const posLabel = POSITION_LABELS[player.position] ?? '—';

  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        transition: 'background 0.15s',
      }}
      onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-elevated)'; }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.15)', background: '#1a1a2a' }}>
          {!imgErr
            ? <img src={player.photo} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, color: posColor }}>
                {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
          }
        </div>
        {/* Age badge */}
        <div style={{
          position: 'absolute', bottom: -4, right: -4,
          background: 'var(--color-neon)', color: '#050508',
          fontFamily: 'var(--font-label)', fontSize: 7, fontWeight: 700,
          padding: '1px 3px', borderRadius: 3,
        }}>
          {player.age}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
          {player.name}
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '1px', color: posColor, background: `${posColor}15`, padding: '1px 4px', borderRadius: 3 }}>
            {posLabel}
          </span>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: 10, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.leagueName.replace('Campionato ', '').replace('Serie ', 'S.')}
          </span>
        </div>
      </div>

      {/* Stats: min + score */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-neon)', lineHeight: 1 }}>
          {player.talentScore.toFixed(1)}
        </div>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
          {player.minutesPlayed > 0 ? `${player.minutesPlayed}' giocati` : '—'}
        </div>
      </div>
    </div>
  );
}

// ─── Top Vivai card ──────────────────────────────────────────────────────────

function VivaioCard({ rank, teamName, teamLogo, totalScore, playerCount, topPlayer }: {
  rank: number; teamName: string; teamLogo: string;
  totalScore: number; playerCount: number; topPlayer: Player | null;
}) {
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const rankColor  = rankColors[rank - 1] ?? 'rgba(255,255,255,0.3)';

  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Rank + name */}
      <div className="flex items-center gap-3">
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: `${rankColor}80`, lineHeight: 1, flexShrink: 0 }}>
          {String(rank).padStart(2, '0')}
        </span>
        <img src={teamLogo} alt={teamName} className="w-9 h-9 object-contain shrink-0"
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {teamName}
          </div>
          <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
            {playerCount} talenti monitorati
          </div>
        </div>
      </div>

      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: rankColor, lineHeight: 1, textShadow: `0 0 16px ${rankColor}50` }}>
          {totalScore}
        </span>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
          score totale
        </span>
      </div>

      {/* Top player */}
      {topPlayer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
          <img src={topPlayer.photo} alt={topPlayer.name} className="w-6 h-6 rounded-full object-cover"
            style={{ border: `1px solid ${rankColor}40` }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Top: {topPlayer.name}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: rankColor, flexShrink: 0 }}>
            {topPlayer.talentScore.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

interface Props {
  players: Player[];
  onPlayerClick: (p: Player) => void;
  loading: boolean;
}

export function DashboardPage({ players, onPlayerClick, loading }: Props) {
  const pageRef    = useRef<HTMLDivElement>(null);
  const bannerRef  = useRef<HTMLDivElement>(null);
  const statsRef   = useRef<HTMLDivElement>(null);

  // ── Computed data ───────────────────────────────────────────────────────────

  const totalGoals   = players.reduce((s, p) => s + p.goals, 0);
  const totalAssists = players.reduce((s, p) => s + p.assists, 0);
  const avgScore     = players.length > 0
    ? (players.reduce((s, p) => s + p.talentScore, 0) / players.length).toFixed(1)
    : '—';
  const avgAge = players.length > 0
    ? (players.reduce((s, p) => s + p.age, 0) / players.length).toFixed(1)
    : '—';

  // Top 5 overall
  const top5 = [...players].sort((a, b) => b.talentScore - a.talentScore).slice(0, 5);

  // League spotlight
  const leagueSpotlight = LEAGUE_GROUPS.map(group => {
    const inLeague = players.filter(p => group.ids.includes(p.leagueId));
    const topPlayer = inLeague.length > 0
      ? inLeague.reduce((best, p) => p.talentScore > best.talentScore ? p : best, inLeague[0])
      : null;
    return { ...group, topPlayer, playerCount: inLeague.length };
  }).filter(g => g.playerCount > 0);

  // Rising Stars: U20, min > 100 minutes, sorted by talentScore
  const risingStars = players
    .filter(p => p.age <= 20 && p.minutesPlayed > 100)
    .sort((a, b) => b.talentScore - a.talentScore)
    .slice(0, 5);

  // Top 3 Vivai
  const clubMap = new Map<string, { logo: string; scores: number[]; players: Player[] }>();
  for (const p of players) {
    const ex = clubMap.get(p.teamName);
    if (ex) { ex.scores.push(p.talentScore); ex.players.push(p); }
    else clubMap.set(p.teamName, { logo: p.teamLogo, scores: [p.talentScore], players: [p] });
  }
  const topVivai = [...clubMap.entries()]
    .map(([name, d]) => ({
      teamName: name,
      teamLogo: d.logo,
      totalScore: Math.round(d.scores.reduce((a, b) => a + b, 0) * 10) / 10,
      playerCount: d.scores.length,
      topPlayer: d.players.reduce((best, p) => p.talentScore > best.talentScore ? p : best, d.players[0]),
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);

  // ── GSAP entrance + counter + parallax ─────────────────────────────────────
  useEffect(() => {
    if (!pageRef.current || loading) return;

    // 1. Staggered section entrance
    const sections = pageRef.current.querySelectorAll('[data-section]');
    gsap.fromTo(sections,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' }
    );

    // 2. Banner scale-in
    if (bannerRef.current) {
      gsap.fromTo(bannerRef.current,
        { scale: 1.04, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'power2.out' }
      );
    }

    // 3. Count-up on stat numbers
    if (statsRef.current) {
      const counters = statsRef.current.querySelectorAll<HTMLElement>('[data-count]');
      counters.forEach(el => {
        const target = parseFloat(el.dataset.count ?? '0');
        const isFloat = !Number.isInteger(target);
        const proxy = { val: 0 };
        gsap.to(proxy, {
          val: target,
          duration: 1.4,
          ease: 'power2.out',
          delay: 0.4,
          onUpdate: () => {
            el.textContent = isFloat
              ? proxy.val.toFixed(1)
              : String(Math.round(proxy.val));
          },
        });
      });
    }

    // 4. Top-player rows slide in from left
    if (pageRef.current) {
      const rows = pageRef.current.querySelectorAll('[data-row]');
      gsap.fromTo(rows,
        { opacity: 0, x: -18 },
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out', delay: 0.3 }
      );
    }
  }, [loading, players.length]);

  // ── Empty / loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <svg className="w-8 h-8 animate-spin mb-4" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--color-neon)' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>CARICAMENTO DATI…</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div style={{ fontSize: 56, opacity: 0.2, marginBottom: 16 }}>📊</div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nessun dato</p>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 8, letterSpacing: '1px' }}>
          Esegui <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>npm run fetch-data</code> per iniziare
        </p>
      </div>
    );
  }

  return (
    <div ref={pageRef}>

      {/* ── BANNER full-bleed ─────────────────────────────────────────────── */}
      <div ref={bannerRef} data-section style={{ width: '100%', lineHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <img
          src="/vivaio-talents-v2/banner4.png"
          alt="Vivaio Talents Banner"
          style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 340 }}
        />
        {/* Left fade */}
        <div style={{
          position: 'absolute', inset: 0, right: 'auto', width: '18%',
          background: 'linear-gradient(to right, var(--color-bg), transparent)',
          pointerEvents: 'none',
        }} />
        {/* Right fade */}
        <div style={{
          position: 'absolute', inset: 0, left: 'auto', width: '18%',
          background: 'linear-gradient(to left, var(--color-bg), transparent)',
          pointerEvents: 'none',
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* ── 1. NUMERI DELLA STAGIONE ──────────────────────────────────────── */}
      <section data-section ref={statsRef}>
        <SectionHeader title="Numeri della stagione" sub="Stagione 2025/26 · U23 italiani" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Talenti monitorati', value: players.length,        count: players.length,                      color: 'var(--color-neon)', bgImg: null         },
            { label: 'Gol segnati',        value: totalGoals,            count: totalGoals,                          color: '#ff3d5a',           bgImg: 'card1.png'  },
            { label: 'Assist totali',      value: totalAssists,          count: totalAssists,                        color: '#00d4ff',           bgImg: 'card2.png'  },
            { label: 'Score medio',        value: avgScore,              count: parseFloat(avgScore as string) || 0, color: '#FFD700',           bgImg: 'card3.png'  },
          ].map(({ label, value, count, color, bgImg }) => (
            <div key={label} style={{
              background: bgImg
                ? `url(/vivaio-talents-v2/${bgImg}) center/cover no-repeat`
                : `linear-gradient(135deg, ${color}0a 0%, var(--color-bg-elevated) 70%)`,
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: '18px 16px',
              textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Overlay per leggibilità (solo card con immagine) */}
              {bgImg && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(5,5,8,0.72) 0%, rgba(5,5,8,0.55) 100%)',
                  pointerEvents: 'none',
                }} />
              )}
              {/* Decorative glow dot */}
              {!bgImg && <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `${color}10`, pointerEvents: 'none' }} />}
              <div
                data-count={count}
                style={{ position: 'relative', fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)', color: bgImg ? '#fff' : color, lineHeight: 1, textShadow: bgImg ? '0 0 20px rgba(255,255,255,0.4)' : `0 0 20px ${color}60` }}
              >
                {value}
              </div>
              <div style={{ position: 'relative', fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. TOP 5 + RISING STARS ────────────────────────────────────────── */}
      <section data-section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

        {/* Top 5 */}
        <div>
          <SectionHeader title="Top 5 Talenti" sub="Migliore talent score overall" />
          <div className="space-y-2">
            {top5.map((p, i) => (
              <div key={`${p.id}-${p.leagueId}`} data-row>
                <TopPlayerRow player={p} rank={i + 1} onClick={() => onPlayerClick(p)} />
              </div>
            ))}
          </div>
        </div>

        {/* Rising Stars */}
        <div>
          <SectionHeader title="Rising Stars" sub="Under 20 con minutaggio significativo" />
          {risingStars.length > 0 ? (
            <div className="space-y-2">
              {risingStars.map(p => (
                <RisingStarCard key={`${p.id}-${p.leagueId}`} player={p} onClick={() => onPlayerClick(p)} />
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '20px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                Nessun U20 con minutaggio sufficiente nei filtri attivi
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. SPOTLIGHT PER LEGA ──────────────────────────────────────────── */}
      <section data-section>
        <SectionHeader title="Spotlight per lega" sub="Il #1 talento in ogni divisione" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {leagueSpotlight.map(group => (
            <LeagueCard
              key={group.name}
              name={group.name}
              color={group.color}
              topPlayer={group.topPlayer}
              playerCount={group.playerCount}
              onClick={onPlayerClick}
            />
          ))}
        </div>
      </section>

      {/* ── 4. TOP VIVAI ────────────────────────────────────────────────────── */}
      {topVivai.length > 0 && (
        <section data-section>
          <SectionHeader title="Top Vivai" sub="Club con il maggior patrimonio di talenti U23" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topVivai.map((club, i) => (
              <VivaioCard
                key={club.teamName}
                rank={i + 1}
                teamName={club.teamName}
                teamLogo={club.teamLogo}
                totalScore={club.totalScore}
                playerCount={club.playerCount}
                topPlayer={club.topPlayer}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── 5. QUICK INFO footer ────────────────────────────────────────────── */}
      <section data-section>
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
        }}>
          {[
            { label: 'ETÀ MEDIA XI', value: `${avgAge} anni` },
            { label: 'LIGHE COPERTE', value: leagueSpotlight.length },
            { label: 'GOL / ASSIST RATIO', value: totalAssists > 0 ? (totalGoals / totalAssists).toFixed(2) : '—' },
            { label: 'GIOCATORI UNDER 20', value: players.filter(p => p.age <= 20).length },
            { label: 'ATTACCANTI', value: players.filter(p => p.position === 'Attacker').length },
            { label: 'CENTROCAMPISTI', value: players.filter(p => p.position === 'Midfielder').length },
            { label: 'DIFENSORI', value: players.filter(p => p.position === 'Defender').length },
            { label: 'PORTIERI', value: players.filter(p => p.position === 'Goalkeeper').length },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      </div>
    </div>
  );
}
