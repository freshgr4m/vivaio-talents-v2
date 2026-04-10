import type { Player } from '../types/player';

interface ClubStat {
  teamName: string;
  teamLogo: string;
  playerCount: number;
  totalScore: number;
  avgScore: number;
  topLeague: string;
}

const LEAGUE_SHORT: Record<number, string> = {
  135: 'Serie A',     136: 'Serie B',
  138: 'Serie C',     942: 'Serie C',     943: 'Serie C',
  705: 'Primavera 1', 706: 'Primavera 2',
  426: 'Serie D',     427: 'Serie D',     428: 'Serie D',
  429: 'Serie D',     430: 'Serie D',     431: 'Serie D',
  432: 'Serie D',     433: 'Serie D',     434: 'Serie D',
};

function buildRanking(players: Player[]): ClubStat[] {
  const clubs = new Map<string, { logo: string; scores: number[]; leagues: Record<string, number> }>();

  for (const p of players) {
    const league = LEAGUE_SHORT[p.leagueId] ?? 'Altro';
    const existing = clubs.get(p.teamName);
    if (existing) {
      existing.scores.push(p.talentScore);
      existing.leagues[league] = (existing.leagues[league] ?? 0) + 1;
    } else {
      clubs.set(p.teamName, { logo: p.teamLogo, scores: [p.talentScore], leagues: { [league]: 1 } });
    }
  }

  return [...clubs.entries()]
    .map(([teamName, data]) => {
      const total = data.scores.reduce((a, b) => a + b, 0);
      return {
        teamName,
        teamLogo: data.logo,
        playerCount: data.scores.length,
        totalScore: Math.round(total * 10) / 10,
        avgScore: Math.round((total / data.scores.length) * 10) / 10,
        topLeague: Object.entries(data.leagues).sort((a, b) => b[1] - a[1])[0][0],
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 15);
}

// Podium colors per position
const PODIUM_ACCENT = [
  { color: '#FFD700', bg: 'rgba(255,215,0,0.08)',   border: 'rgba(255,215,0,0.3)',  label: '01' },
  { color: '#C0C0C0', bg: 'rgba(192,192,192,0.06)', border: 'rgba(192,192,192,0.2)', label: '02' },
  { color: '#CD7F32', bg: 'rgba(205,127,50,0.06)',  border: 'rgba(205,127,50,0.2)',  label: '03' },
];

interface Props { players: Player[] }

export function VivaiPage({ players }: Props) {
  const ranking = buildRanking(players);
  const maxScore = ranking[0]?.totalScore ?? 1;

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🏟</div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          NESSUN DATO
        </p>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6, letterSpacing: 1 }}>
          Esegui npm run fetch-data per scaricare i giocatori.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Section title ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(to bottom, var(--color-neon), var(--color-neon-alt))', boxShadow: '0 0 10px rgba(0,255,135,0.5)' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 36px)', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
          Vivai più produttivi
        </h2>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,255,135,0.15), transparent)' }} />
      </div>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', marginBottom: 24 }}>
        Classifica basata sul rendimento degli U23 italiani nelle divisioni italiane
      </p>

      {/* ── Podio top 3 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {ranking.slice(0, 3).map((club, i) => {
          const a = PODIUM_ACCENT[i];
          return (
            <div
              key={club.teamName}
              className="relative overflow-hidden flex flex-col items-center text-center"
              style={{
                background: `linear-gradient(135deg, ${a.bg} 0%, var(--color-bg-elevated) 70%)`,
                border: `1px solid ${a.border}`,
                borderRadius: 14,
                padding: '20px 12px 16px',
              }}
            >
              {/* Rank number — top left */}
              <div style={{
                position: 'absolute', top: 10, left: 12,
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                color: `${a.color}25`,
                lineHeight: 1,
              }}>
                {a.label}
              </div>

              <img
                src={club.teamLogo}
                alt={club.teamName}
                className="w-12 h-12 object-contain mb-3"
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
              />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', letterSpacing: '0.03em', lineHeight: 1.2, marginBottom: 8 }}>
                {club.teamName}
              </p>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: a.color, lineHeight: 1, textShadow: `0 0 16px ${a.color}50` }}>
                {club.totalScore}
              </div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                score totale
              </div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8, letterSpacing: '0.5px' }}>
                {club.playerCount} giocatori · {club.topLeague}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabella 4–15 ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: '2rem 1fr auto auto auto auto',
            gap: '0 16px',
            padding: '10px 20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {['#', 'Club', 'Giocatori', 'Score', 'Media', 'Liga'].map(h => (
            <span key={h} style={{
              fontFamily: 'var(--font-label)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)',
              textAlign: h !== '#' && h !== 'Club' ? 'right' : undefined,
            }}>
              {h}
            </span>
          ))}
        </div>

        {ranking.slice(3).map((club, i) => {
          const pos = i + 4;
          const barW = Math.round((club.totalScore / maxScore) * 100);
          return (
            <div
              key={club.teamName}
              className="relative grid items-center"
              style={{
                gridTemplateColumns: '2rem 1fr auto auto auto auto',
                gap: '0 16px',
                padding: '12px 20px',
                borderBottom: '1px solid var(--color-border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              {/* Background score bar */}
              <div className="absolute left-0 top-0 h-full pointer-events-none" style={{
                width: `${barW}%`,
                background: 'rgba(255,215,0,0.03)',
              }} />

              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'rgba(255,255,255,0.25)', zIndex: 1 }}>
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
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-neon)', textAlign: 'right', zIndex: 1 }}>
                {club.totalScore}
              </span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'right', zIndex: 1 }}>
                {club.avgScore}
              </span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right', whiteSpace: 'nowrap', zIndex: 1 }}>
                {club.topLeague}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 14, letterSpacing: '0.5px' }}>
        Top 15 club · ordinati per Talent Score totale degli U23 italiani
      </p>
    </div>
  );
}
