import { useState } from 'react';
import type { Player } from '../types/player';

const POSITION_LABELS: Record<string, string> = {
  Attacker: 'ATT',
  Midfielder: 'MID',
  Defender: 'DIF',
  Goalkeeper: 'POR',
};

const POSITION_COLORS: Record<string, string> = {
  Attacker: 'text-red-400 border-red-400/30 bg-red-400/10',
  Midfielder: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  Defender: 'text-green-400 border-green-400/30 bg-green-400/10',
  Goalkeeper: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
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

      {/* Toggle A / B */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit mb-6">
        {([135, 136] as const).map(id => (
          <button
            key={id}
            onClick={() => { setLeague(id); setExpandedClub(null); }}
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
        <div className="grid grid-cols-[2rem_1fr_auto_auto_1.5rem] gap-x-4 px-5 py-3 text-white/25 text-xs font-medium uppercase tracking-wider border-b border-white/5">
          <span>#</span>
          <span>Club</span>
          <span className="text-right">Giocatori</span>
          <span className="text-right">Min totali</span>
          <span />
        </div>

        {ranking.map((club, i) => {
          const barW = Math.round((club.totalMinutes / maxMin) * 100);
          const pos = i + 1;
          const isExpanded = expandedClub === club.teamName;

          return (
            <div key={club.teamName} className="border-b border-white/5 last:border-0">

              {/* Club row */}
              <div
                className="relative grid grid-cols-[2rem_1fr_auto_auto_1.5rem] gap-x-4 px-5 py-3.5 items-center hover:bg-white/3 transition-colors cursor-pointer"
                onClick={() => setExpandedClub(isExpanded ? null : club.teamName)}
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

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-white/25 z-10 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Player list (expanded) */}
              {isExpanded && (
                <div className="bg-black/20 border-t border-white/5 px-4 py-3 space-y-1">
                  {club.players.map(p => {
                    const posLabel = POSITION_LABELS[p.position] ?? p.position?.slice(0, 3).toUpperCase() ?? '—';
                    const posColor = POSITION_COLORS[p.position] ?? 'text-white/50 border-white/20 bg-white/5';
                    const maxClubMin = club.players[0]?.minutesPlayed || 1;
                    const pBarW = Math.round((p.minutesPlayed / maxClubMin) * 100);

                    return (
                      <div
                        key={p.id}
                        className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => onPlayerClick(p)}
                      >
                        {/* Mini bar */}
                        <div
                          className="absolute left-0 top-0 h-full rounded-xl bg-[#FFD700]/5 pointer-events-none"
                          style={{ width: `${pBarW}%` }}
                        />

                        {/* Photo */}
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover bg-white/5 border border-white/10 shrink-0 z-10"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />

                        {/* Name + pos */}
                        <div className="flex-1 min-w-0 z-10">
                          <div className="flex items-center gap-2">
                            <span className="font-[Oswald] text-white text-sm truncate group-hover:text-[#FFD700] transition-colors">
                              {p.name}
                            </span>
                            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border font-[Oswald] ${posColor}`}>
                              {posLabel}
                            </span>
                          </div>
                          <div className="text-white/25 text-xs">{p.age} anni</div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 shrink-0 z-10">
                          <div className="text-center hidden sm:block">
                            <div className="font-[Oswald] text-sm text-white font-bold">{p.goals}</div>
                            <div className="text-[10px] text-white/25 uppercase">Gol</div>
                          </div>
                          <div className="text-center hidden sm:block">
                            <div className="font-[Oswald] text-sm text-white/70 font-bold">{p.assists}</div>
                            <div className="text-[10px] text-white/25 uppercase">Ass</div>
                          </div>
                          <div className="text-right">
                            <div className="font-[Oswald] text-sm text-[#FFD700] font-bold">
                              {p.minutesPlayed.toLocaleString('it-IT')}
                            </div>
                            <div className="text-[10px] text-white/25 uppercase">Min</div>
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

      {/* Club senza U23 */}
      {ranking.length < 20 && league === 135 && (
        <p className="text-white/20 text-xs text-center mt-4">
          {20 - ranking.length} club di {leagueName} non hanno U23 italiani in lista
        </p>
      )}
    </div>
  );
}
