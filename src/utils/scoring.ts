import type { ApiPlayerResponse, Player } from '../types/player';

// ─── Coefficienti difficoltà per lega ────────────────────────────────────────
// Più alta la lega, più difficile è performare → score base moltiplicato
export const LEAGUE_COEFFICIENTS: Record<number, number> = {
  135: 4.0,   // Serie A
  136: 2.5,   // Serie B
  974: 1.3,   // Serie C
  705: 1.3,   // Primavera 1 (elite giovanile)
  706: 0.9,   // Primavera 2
  997: 0.7,   // Serie D
};

// ─── Bonus età ────────────────────────────────────────────────────────────────
// Ogni anno sotto i 21 vale +8%. Un 17enne prende +32%.
// Ragionamento: fare le stesse cose a 17 anni è molto più raro che a 23.
export function calcAgeBonus(age: number): number {
  if (age >= 21) return 1.0;
  return 1 + (21 - age) * 0.08;
}

// ─── Score base (invariato) ───────────────────────────────────────────────────
function calcBaseScore(goals: number, assists: number, minutes: number, rating: number): number {
  return (goals * 4) + (assists * 3) + (minutes / 90 * 0.8) + (rating * 2);
}

// ─── Score finale con coefficienti ───────────────────────────────────────────
export function calcTalentScore(
  goals: number,
  assists: number,
  minutes: number,
  rating: number,
  leagueId: number,
  age: number,
): number {
  const base = calcBaseScore(goals, assists, minutes, rating);
  const leagueCoeff = LEAGUE_COEFFICIENTS[leagueId] ?? 1.0;
  const ageBonus = calcAgeBonus(age);
  return base * leagueCoeff * ageBonus;
}

export function parsePlayer(
  raw: ApiPlayerResponse,
  leagueId: number,
  _leagueName: string,
  season: number,
): Player | null {
  // Per giocatori trasferiti mid-season, prende l'ultima entry della lega (team più recente)
  const leagueStats = raw.statistics.filter(s => s.league.id === leagueId);
  const stat = leagueStats.length > 0 ? leagueStats[leagueStats.length - 1] : raw.statistics[raw.statistics.length - 1];
  if (!stat) return null;

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

  const leagueCoeff = LEAGUE_COEFFICIENTS[leagueId] ?? 1.0;
  const ageBonus = calcAgeBonus(ageAtSeasonStart);
  const talentScore = parseFloat(calcTalentScore(goals, assists, minutes, ratingRaw, leagueId, ageAtSeasonStart).toFixed(2));

  return {
    id: raw.player.id,
    name: raw.player.name,
    age: ageAtSeasonStart,
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
    leagueCoeff,
    ageBonus: parseFloat(ageBonus.toFixed(2)),
  };
}
