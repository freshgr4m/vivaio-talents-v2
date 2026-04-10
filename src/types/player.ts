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
}

export interface League {
  id: number;
  name: string;
  label: string;
}

export const LEAGUES: League[] = [
  { id: 135, name: 'Serie A',             label: 'Serie A'     },
  { id: 136, name: 'Serie B',             label: 'Serie B'     },
  { id: 138, name: 'Serie C – Girone A',  label: 'Serie C'     },
  { id: 942, name: 'Serie C – Girone B',  label: 'Serie C'     },
  { id: 943, name: 'Serie C – Girone C',  label: 'Serie C'     },
  { id: 705, name: 'Primavera 1',         label: 'Primavera 1' },
  { id: 706, name: 'Primavera 2',         label: 'Primavera 2' },
  { id: 426, name: 'Serie D – Girone A',  label: 'Serie D'     },
  { id: 427, name: 'Serie D – Girone B',  label: 'Serie D'     },
  { id: 428, name: 'Serie D – Girone C',  label: 'Serie D'     },
  { id: 429, name: 'Serie D – Girone D',  label: 'Serie D'     },
  { id: 430, name: 'Serie D – Girone E',  label: 'Serie D'     },
  { id: 431, name: 'Serie D – Girone F',  label: 'Serie D'     },
  { id: 432, name: 'Serie D – Girone G',  label: 'Serie D'     },
  { id: 433, name: 'Serie D – Girone H',  label: 'Serie D'     },
  { id: 434, name: 'Serie D – Girone I',  label: 'Serie D'     },
];

export type PositionFilter = 'ALL' | 'F' | 'M' | 'D' | 'G';
export type AgeFilter = 18 | 20 | 23;
