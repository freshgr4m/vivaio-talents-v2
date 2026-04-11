export interface ApiPlayerResponse {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: { date: string; place: string; country: string };
    nationality: string;
    height: string;
    weight: string;
    photo: string;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string; logo: string; season: number };
    games: { appearences: number; lineups: number; minutes: number; position: string; rating: string | null; captain: boolean };
    goals: { total: number | null; assists: number | null; conceded: number | null; saves: number | null };
    cards: { yellow: number; yellowred: number; red: number };
  }>;
}

export interface ApiResponse {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: ApiPlayerResponse[];
}

export interface Player {
  id: number;
  name: string;
  age: number;
  nationality: string;
  photo: string;
  teamName: string;
  teamLogo: string;
  leagueId: number;
  leagueName: string;
  position: string;
  goals: number;
  assists: number;
  minutesPlayed: number;
  appearances: number;
  rating: number;
  talentScore: number;
  leagueCoeff: number;
  ageBonus: number;
}

export interface League {
  id: number;
  name: string;
  label: string;
}

export const LEAGUES: League[] = [
  { id: 135, name: 'Serie A',      label: 'Serie A'     },
  { id: 136, name: 'Serie B',      label: 'Serie B'     },
  { id: 974, name: 'Serie C',      label: 'Serie C'     },
  { id: 997, name: 'Serie D',      label: 'Serie D'     },
  { id: 705, name: 'Primavera 1',  label: 'Primavera 1' },
  { id: 706, name: 'Primavera 2',  label: 'Primavera 2' },
];

export type PositionFilter = 'ALL' | 'F' | 'M' | 'D' | 'G';
export type AgeFilter = 18 | 20 | 23;
