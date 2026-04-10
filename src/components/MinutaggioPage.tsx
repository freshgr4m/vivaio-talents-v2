import { useState } from 'react';
import type { Player } from '../types/player';

const POSITION_LABELS: Record<string, string> = {
  Attacker: 'ATT', Midfielder: 'MID', Defender: 'DIF', Goalkeeper: 'POR',
};

const POSITION_ACCENT: Record<string, { color: string; bg: string }> = {
  Attacker:   { color: '#ff3d5a', bg: 'rgba(255,61,90,0.15)'  },
  Midfielder: { color: '#00d4ff', bg: 'rgba(0,212,255,0.15)'  },
  Defender:   { color: '#00ff87', bg: 'rgba(0,255,135,0.15)'  },
  Goalkeeper: { color: '#FFD700', bg: 'rgba(255,215,0,0.15)'  },
};

interface ClubStat {
  teamName: string;
  teamLogo: string;
  playerCount: number;
  totalMinutes: number;
  avgMinutes: number;
  players: Player[];
}

function buildRanking(players: Player[], leagueId: number): ClubStat[] {
  const clubs = new Map<string, { logo: string; players: Player[] }>();

  for (const p of players) {
    if (p.leagueId !== leagueId) continue;
    const existing = clubs.get(p.teamName);
    if (existing) {
      existing.players.push(p);
    } else {
      clubs.set(p.teamName, { logo: p.teamLogo, players: [p] });
    }
  }

  return [...clubs.entries()]
    .map(([teamName, data]) => {
      const sorted = [...data.players].sort((a, b) => b.minutesPlayed - a.minutesPlayed);
      const totalMinutes = sorted.reduce((s, p) => s + p.minutesPlayed, 0);
      return {
        teamName,
        teamLogo: data.logo,
        playerCount: sorted.length,
        totalMinutes,
        avgMinutes: Math.round(totalMinutes / sorted.length),
        players: sorted,
      };
    })
    .filter(c => c.totalMinutes > 0 || c.playerCount > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

interface Props {
  players: Player[];
  onPlayerClick: (player: Player) => void;
}

export function MinutaggioPage({ players, onPlayerClick }: Props) {
  const [league, setLeague] = useState<135 | 136>(135);
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  const ranking = buildRanking(players, league);
  const maxMin = ranking[0]?.totalMinutes ?? 1;

  const allInLeague = players.filter(p => p.leagueId === league);
  const totalMin = allInLeague.reduce((s, p) => s + p.minutesPlayed, 0);
  const leagueName = league === 135 ? 'Serie A' : 'Serie B';

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⏱</div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          NESSUN DATO
        </p>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
          per {leagueName}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Section title ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3">
        <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(to bottom, var(--color-neon), var(--color-neon-alt))', boxShadow: '0 0 10px rgba(0,255,135,0.5)' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 36px)', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
          Minutaggio Watch
        </h2>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,255,135,0.15), transparent)' }} />
      </div>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', marginBottom: 20 }}>
        Quali club stanno facendo giocare i giovani italiani U23?
      </p>

      {/* ── Toggle A / B ───────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6" style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: 4,
        width: 'fit-content',
      }}>
        {([135, 136] as const).map(id => (
          <button
            key={id}
            onClick={() => { setLeague(id); setExpandedClub(null); }}
            className="transition-all"
            style={league === id ? {
              padding: '6px 20px',
              borderRadius: 7,
              background: 'var(--color-neon)',
              color: '#050508',
              fontFamily: 'var(--font-label)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              boxShadow: '0 0 12px rgba(0,255,135,0.3)',
            } : {
              padding: '6px 20px',
              borderRadius: 7,
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-label)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            {id === 135 ? 'Serie A' : 'Serie B'}
          </button>
        ))}
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: ranking.length, label: 'Club con U23 italiani' },
          { value: allInLeague.length, label: `U23 in ${leagueName}` },
          { value: totalMin > 0 ? Math.round(totalMin / allInLeague.length).toLocaleString('it-IT') : '—', label: 'Min medi', accent: true },
        ].map(({ value, label, accent }) => (
          <div key={label} style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '14px 12px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: accent ? 'var(--color-neon)' : '#fff', lineHeight: 1, textShadow: accent ? '0 0 12px rgba(0,255,135,0.4)' : undefined }}>
              {value}
            </div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Club ranking table ──────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div className="grid items-center" style={{
          gridTemplateColumns: '2rem 1fr auto auto 1.5rem',
          gap: '0 16px',
          padding: '10px 20px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {['#', 'Club', 'Giocatori', 'Min totali', ''].map(h => (
            <span key={h} style={{
              fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
            }}>
              {h}
            </span>
          ))}
        </div>

        {ranking.map((club, i) => {
          const barW = Math.round((club.totalMinutes / maxMin) * 100);
          const pos = i + 1;
          const isExpanded = expandedClub === club.teamName;

          return (
            <div key={club.teamName} style={{ borderBottom: '1px solid var(--color-border)' }}>

              {/* Club row */}
              <div
                className="relative grid items-center cursor-pointer"
                style={{
                  gridTemplateColumns: '2rem 1fr auto auto 1.5rem',
                  gap: '0 16px',
                  padding: '12px 20px',
                  transition: 'background 0.15s',
                }}
                onClick={() => setExpandedClub(isExpanded ? null : club.teamName)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {/* Background bar */}
                <div className="absolute left-0 top-0 h-full pointer-events-none" style={{ width: `${barW}%`, background: 'rgba(0,255,135,0.03)' }} />

                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 18,
                  color: pos === 1 ? 'var(--color-neon)' : pos <= 3 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                  zIndex: 1,
                }}>
                  {pos}
                </span>

                <div className="flex items-center gap-3" style={{ zIndex: 1, minWidth: 0 }}>
                  <img
                    src={club.teamLogo}
                    alt={club.teamName}
                    className="w-6 h-6 object-contain shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {club.teamName}
                  </span>
                </div>

                <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'right', zIndex: 1 }}>
                  {club.playerCount}
                </span>

                <div style={{ textAlign: 'right', zIndex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-neon)', lineHeight: 1 }}>
                    {club.totalMinutes.toLocaleString('it-IT')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>
                    ∅ {club.avgMinutes}
                  </div>
                </div>

                <svg
                  className={`transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.2)', zIndex: 1 }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded players */}
              {isExpanded && (
                <div style={{ background: 'rgba(0,0,0,0.18)', borderTop: '1px solid var(--color-border)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {club.players.map(p => {
                    const posLabel  = POSITION_LABELS[p.position] ?? p.position?.slice(0, 3).toUpperCase() ?? '—';
                    const posAcc    = POSITION_ACCENT[p.position] ?? { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)' };
                    const maxClubMin = club.players[0]?.minutesPlayed || 1;
                    const pBarW     = Math.round((p.minutesPlayed / maxClubMin) * 100);

                    return (
                      <div
                        key={p.id}
                        className="relative flex items-center gap-3 cursor-pointer group"
                        style={{ padding: '8px 12px', borderRadius: 8, transition: 'background 0.15s' }}
                        onClick={() => onPlayerClick(p)}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                      >
                        {/* Mini bar */}
                        <div className="absolute left-0 top-0 h-full pointer-events-none" style={{ width: `${pBarW}%`, background: 'rgba(0,255,135,0.04)', borderRadius: 8 }} />

                        {/* Photo */}
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          style={{ border: `1.5px solid ${posAcc.color}30`, background: 'rgba(255,255,255,0.04)', zIndex: 1 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />

                        {/* Name + pos */}
                        <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
                          <div className="flex items-center gap-2">
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--color-neon)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = '#fff'; }}
                            >
                              {p.name}
                            </span>
                            <span style={{
                              fontFamily: 'var(--font-label)', fontSize: 8, fontWeight: 700, letterSpacing: 1,
                              color: posAcc.color, background: posAcc.bg,
                              border: `1px solid ${posAcc.color}40`,
                              padding: '1px 5px', borderRadius: 4, flexShrink: 0,
                            }}>
                              {posLabel}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                            {p.age} anni
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 shrink-0" style={{ zIndex: 1 }}>
                          <div className="text-center hidden sm:block">
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', lineHeight: 1 }}>{p.goals}</div>
                            <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Gol</div>
                          </div>
                          <div className="text-center hidden sm:block">
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>{p.assists}</div>
                            <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Ass</div>
                          </div>
                          <div className="text-right">
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-neon)', lineHeight: 1 }}>
                              {p.minutesPlayed.toLocaleString('it-IT')}
                            </div>
                            <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Min</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {ranking.length < 20 && league === 135 && (
        <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 12, letterSpacing: '0.5px' }}>
          {20 - ranking.length} club di {leagueName} non hanno U23 italiani in lista
        </p>
      )}
    </div>
  );
}
