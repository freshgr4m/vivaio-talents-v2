import { useState } from 'react';
import type { Player } from '../types/player';

interface ClubStat {
  teamName: string;
  teamLogo: string;
  playerCount: number;
  totalMinutes: number;
  avgMinutes: number;
  topPlayer: Player;
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
      const totalMinutes = data.players.reduce((s, p) => s + p.minutesPlayed, 0);
      const topPlayer = [...data.players].sort((a, b) => b.minutesPlayed - a.minutesPlayed)[0];
      return {
        teamName,
        teamLogo: data.logo,
        playerCount: data.players.length,
        totalMinutes,
        avgMinutes: Math.round(totalMinutes / data.players.length),
        topPlayer,
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

  const ranking = buildRanking(players, league);
  const maxMin = ranking[0]?.totalMinutes ?? 1;

  // Stats globali
  const allInLeague = players.filter(p => p.leagueId === league);
  const totalMin = allInLeague.reduce((s, p) => s + p.minutesPlayed, 0);
  const leagueName = league === 135 ? 'Serie A' : 'Serie B';

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/20">
        <span className="text-5xl mb-4">⏱</span>
        <p className="text-lg font-[Oswald]">Nessun dato per {leagueName}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h2 className="font-[Oswald] text-3xl font-bold text-white uppercase tracking-wide">
          Minutaggio Watch
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Quali club stanno facendo giocare i giovani italiani U23?
        </p>
      </div>

      {/* Banner crisi */}
      <div className="bg-red-500/8 border border-red-500/20 rounded-2xl px-5 py-4 mb-6 flex items-start gap-4">
        <span className="text-2xl shrink-0">🚨</span>
        <div>
          <p className="text-red-400 font-[Oswald] text-base font-bold">
            Solo l'1.9% dei minuti in Serie A va a giovani italiani Under 21
          </p>
          <p className="text-red-400/60 text-xs mt-1">
            Italia esclusa dal Mondiale per la 3ª volta consecutiva · Fonte: FIGC / Tuttosport, aprile 2026
          </p>
        </div>
      </div>

      {/* Toggle A / B */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit mb-6">
        {([135, 136] as const).map(id => (
          <button
            key={id}
            onClick={() => setLeague(id)}
            className={`px-5 py-2 rounded-lg text-sm font-[Oswald] font-medium transition-all ${
              league === id
                ? 'bg-[#FFD700] text-black font-semibold'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {id === 135 ? 'Serie A' : 'Serie B'}
          </button>
        ))}
      </div>

      {/* Sommario */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#13131e] border border-white/8 rounded-xl p-4 text-center">
          <div className="font-[Oswald] text-2xl text-white font-bold">{ranking.length}</div>
          <div className="text-white/30 text-xs mt-1">Club che usano U23 italiani</div>
        </div>
        <div className="bg-[#13131e] border border-white/8 rounded-xl p-4 text-center">
          <div className="font-[Oswald] text-2xl text-white font-bold">{allInLeague.length}</div>
          <div className="text-white/30 text-xs mt-1">Giocatori U23 italiani in {leagueName}</div>
        </div>
        <div className="bg-[#13131e] border border-white/8 rounded-xl p-4 text-center">
          <div className="font-[Oswald] text-2xl text-[#FFD700] font-bold">
            {totalMin > 0 ? (totalMin / allInLeague.length).toFixed(0) : '—'}
          </div>
          <div className="text-white/30 text-xs mt-1">Minuti medi a giocatore</div>
        </div>
      </div>

      {/* Classifica club */}
      <div className="bg-[#13131e] rounded-2xl border border-white/8 overflow-hidden">
        {/* Header tabella */}
        <div className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 px-5 py-3 text-white/25 text-xs font-medium uppercase tracking-wider border-b border-white/5">
          <span>#</span>
          <span>Club</span>
          <span className="text-right">Giocatori</span>
          <span className="text-right">Min totali</span>
          <span className="text-right hidden sm:block">Top player</span>
        </div>

        {ranking.map((club, i) => {
          const barW = Math.round((club.totalMinutes / maxMin) * 100);
          const pos = i + 1;
          return (
            <div
              key={club.teamName}
              className="relative grid grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 px-5 py-3.5 items-center border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
            >
              {/* Barra background */}
              <div
                className="absolute left-0 top-0 h-full bg-[#FFD700]/5 pointer-events-none transition-all"
                style={{ width: `${barW}%` }}
              />

              {/* Pos */}
              <span className={`font-[Oswald] text-sm z-10 ${pos === 1 ? 'text-[#FFD700]' : pos <= 3 ? 'text-white/50' : 'text-white/25'}`}>
                {pos}
              </span>

              {/* Club */}
              <div className="flex items-center gap-3 z-10 min-w-0">
                <img
                  src={club.teamLogo}
                  alt={club.teamName}
                  className="w-7 h-7 object-contain shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="font-[Oswald] text-white text-sm truncate">{club.teamName}</span>
              </div>

              {/* Giocatori */}
              <span className="text-white/50 text-sm text-right z-10">{club.playerCount}</span>

              {/* Minuti */}
              <div className="text-right z-10">
                <span className="font-[Oswald] text-[#FFD700] font-bold text-sm">
                  {club.totalMinutes.toLocaleString('it-IT')}
                </span>
                <div className="text-white/20 text-xs">∅ {club.avgMinutes}</div>
              </div>

              {/* Top player */}
              <button
                onClick={() => onPlayerClick(club.topPlayer)}
                className="hidden sm:block text-right z-10 hover:text-white transition-colors"
              >
                <span className="text-white/40 text-xs truncate max-w-[120px] block">
                  {club.topPlayer.name}
                </span>
                <span className="text-white/20 text-xs">{club.topPlayer.minutesPlayed} min</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Club senza U23 */}
      {ranking.length < 20 && league === 135 && (
        <p className="text-white/20 text-xs text-center mt-4">
          {20 - ranking.length} club di {leagueName} non hanno U23 italiani in lista
        </p>
      )}
    </div>
  );
}
