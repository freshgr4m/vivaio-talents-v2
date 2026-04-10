import type { ApiPlayerResponse, Player } from '../types/player';

export function calcTalentScore(goals: number, assists: number, minutes: number, rating: number): number {
  return (goals * 4) + (assists * 3) + (minutes / 90 * 0.8) + (rating * 2);
}

export function parsePlayer(
  raw: ApiPlayerResponse,
  leagueId: number,
  _leagueName: string,
  season: number,
): Player | null {
  const stat = raw.statistics.find(s => s.league.id === leagueId) ?? raw.statistics[0];
  if (!stat) return null;

  // Calculate age at start of season (August 1st of season year) from birth date
  // The API returns current age which can be 1-2 years older than during the season
  const birthDate = raw.player.birth?.date
    ? new Date(raw.player.birth.date)
    : null;

  let ageAtSeasonStart: number;
  if (birthDate && !isNaN(birthDate.getTime())) {
    const seasonStart = new Date(`${season}-08-01`);
    ageAtSeasonStart = Math.floor(
      (seasonStart.getTime() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000)
    );
  } else {
    // Fallback: current age minus 1 (approximate)
    ageAtSeasonStart = raw.player.age - 1;
  }

  const nationality = raw.player.nationality;
  const minutes = stat.games.minutes ?? 0;
  const appearances = stat.games.appearences ?? 0;
  const goals = stat.goals.total ?? 0;
  const assists = stat.goals.assists ?? 0;
  const ratingRaw = parseFloat(stat.games.rating ?? '0') || 0;
  if (ageAtSeasonStart > 23) return null;
  if (nationality !== 'Italy') return null;

  const talentScore = parseFloat(calcTalentScore(goals, assists, minutes, ratingRaw).toFixed(2));

  return {
    id: raw.player.id,
    name: raw.player.name,
    age: ageAtSeasonStart, // show age during the season
    nationality,
    photo: raw.player.photo,
    teamName: stat.team.name,
    teamLogo: stat.team.logo,
    leagueId,
    leagueName: stat.league.name,
    position: stat.games.position ?? 'Unknown',
    goals,
    assists,
    minutesPlayed: minutes,
    appearances,
    rating: ratingRaw,
    talentScore,
  };
}
