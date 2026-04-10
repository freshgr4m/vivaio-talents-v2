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

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface Props {
  players: Player[];
}

export function VivaiPage({ players }: Props) {
  const ranking = buildRanking(players);
  const maxScore = ranking[0]?.totalScore ?? 1;

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/20">
        <span className="text-5xl mb-4">🏟</span>
        <p className="text-lg font-[Oswald]">Nessun dato disponibile</p>
        <p className="text-sm mt-1">Esegui npm run fetch-data per scaricare i giocatori.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-[Oswald] text-3xl font-bold text-white uppercase tracking-wide">
          I vivai più produttivi
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Classifica basata sul rendimento degli U23 italiani nelle prime divisioni italiane
        </p>
      </div>

      {/* Podio top 3 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {ranking.slice(0, 3).map((club, i) => (
          <div
            key={club.teamName}
            className={`relative bg-[#13131e] rounded-2xl p-5 flex flex-col items-center text-center border ${
              i === 0 ? 'border-[#FFD700]/40' : 'border-white/8'
            }`}
          >
            <span className="text-2xl mb-2">{MEDAL[i + 1]}</span>
            <img
              src={club.teamLogo}
              alt={club.teamName}
              className="w-12 h-12 object-contain mb-2"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <p className="font-[Oswald] text-sm font-bold text-white leading-tight mb-1">
              {club.teamName}
            </p>
            <p className={`font-[Oswald] text-2xl font-bold ${i === 0 ? 'text-[#FFD700]' : 'text-white/80'}`}>
              {club.totalScore}
            </p>
            <p className="text-white/30 text-xs">score totale</p>
            <p className="text-white/40 text-xs mt-2">
              {club.playerCount} giocatori · {club.topLeague}
            </p>
          </div>
        ))}
      </div>

      {/* Tabella 4–15 */}
      <div className="bg-[#13131e] rounded-2xl border border-white/8 overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_auto_auto_auto_auto] gap-x-4 px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-wider border-b border-white/5">
          <span>#</span>
          <span>Club</span>
          <span className="text-right">Giocatori</span>
          <span className="text-right">Score tot.</span>
          <span className="text-right">Media</span>
          <span className="text-right">Campionato</span>
        </div>

        {ranking.slice(3).map((club, i) => {
          const pos = i + 4;
          const barW = Math.round((club.totalScore / maxScore) * 100);
          return (
            <div
              key={club.teamName}
              className="relative grid grid-cols-[2rem_1fr_auto_auto_auto_auto] gap-x-4 px-5 py-3.5 items-center border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
            >
              {/* Score bar sottile in background */}
              <div
                className="absolute left-0 top-0 h-full bg-[#FFD700]/4 pointer-events-none"
                style={{ width: `${barW}%` }}
              />

              <span className="font-[Oswald] text-white/30 text-sm z-10">{pos}</span>

              <div className="flex items-center gap-3 z-10 min-w-0">
                <img
                  src={club.teamLogo}
                  alt={club.teamName}
                  className="w-7 h-7 object-contain shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="font-[Oswald] text-white text-sm truncate">{club.teamName}</span>
              </div>

              <span className="text-white/50 text-sm text-right z-10">{club.playerCount}</span>
              <span className="font-[Oswald] text-[#FFD700] text-sm text-right z-10">{club.totalScore}</span>
              <span className="text-white/50 text-sm text-right z-10">{club.avgScore}</span>
              <span className="text-white/30 text-xs text-right z-10 whitespace-nowrap">{club.topLeague}</span>
            </div>
          );
        })}
      </div>

      <p className="text-white/20 text-xs text-center mt-4">
        Top 15 club · ordinati per Talent Score totale degli U23 italiani in lista
      </p>
    </div>
  );
}
