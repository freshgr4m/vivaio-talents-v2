import type { ApiResponse, Player } from '../types/player';
import { parsePlayer } from '../utils/scoring';

const BASE_URL = '/api-football';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEASON = 2025;

// Free plan: 10 req/min.
// We fire all endpoints for ONE league in parallel (4 calls at once),
// then wait 30s before the next league → ~8 calls/min → safely under 10/min.
const BETWEEN_LEAGUES_DELAY_MS = 30_000;

type StatEndpoint = 'topscorers' | 'topassists' | 'topyellowcards' | 'topredcards';
const ENDPOINTS: StatEndpoint[] = ['topscorers', 'topassists', 'topyellowcards', 'topredcards'];

let sessionApiCalls = 0;
export function getSessionApiCalls(): number { return sessionApiCalls; }
export function resetSessionApiCalls(): void { sessionApiCalls = 0; }

interface CacheEntry { timestamp: number; data: ApiResponse; }

function cacheKey(leagueId: number, endpoint: string): string {
  return `vivaio_v4_${endpoint}_${leagueId}_${SEASON}`;
}

function readCacheData(leagueId: number, endpoint: string): ApiResponse | null {
  try {
    const raw = localStorage.getItem(cacheKey(leagueId, endpoint));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(leagueId, endpoint));
      return null;
    }
    return entry.data;
  } catch { return null; }
}

export function readCache(leagueId: number): boolean {
  return ENDPOINTS.every(ep => readCacheData(leagueId, ep) !== null);
}

function writeCache(leagueId: number, endpoint: string, data: ApiResponse): void {
  try {
    localStorage.setItem(cacheKey(leagueId, endpoint), JSON.stringify({ timestamp: Date.now(), data }));
  } catch { /* localStorage full */ }
}

export function clearAllCache(): void {
  Object.keys(localStorage)
    .filter(k => k.startsWith('vivaio_'))
    .forEach(k => localStorage.removeItem(k));
  resetSessionApiCalls();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchEndpoint(leagueId: number, endpoint: StatEndpoint): Promise<ApiResponse> {
  const cached = readCacheData(leagueId, endpoint);
  if (cached) return cached;

  const url = `${BASE_URL}/players/${endpoint}?league=${leagueId}&season=${SEASON}`;
  const res = await fetch(url);
  sessionApiCalls++;

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? ': ' + text : ''}`);
  }

  const json: ApiResponse = await res.json();
  if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
    throw new Error(`API error: ${Object.values(json.errors).join(', ')}`);
  }

  writeCache(leagueId, endpoint, json);
  return json;
}

export interface LeagueResult {
  leagueId: number;
  players: Player[];
  error?: string;
}

export interface FetchProgress {
  leagueId: number;
  status: 'fetching' | 'done' | 'error' | 'cached';
  waitingSeconds?: number;
}

// ─── Load from static file (public/data/players.json) ────────────────────────

export async function loadStaticData(
  onResult: (r: LeagueResult) => void,
): Promise<{ ok: boolean; fetchedAt?: string }> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/players.json`);
    if (!res.ok) return { ok: false };
    const data = await res.json();
    if (!data?.leagues) return { ok: false };

    for (const [leagueIdStr, leagueData] of Object.entries(data.leagues) as [string, Record<string, unknown>][]) {
      const leagueId = Number(leagueIdStr);
      if (leagueData.error) {
        onResult({ leagueId, players: [], error: leagueData.error as string });
        continue;
      }

      // Nuovo formato (fetch-data v2): unica chiave "allplayers" con tutti i giocatori
      if (leagueData.allplayers) {
        const response = leagueData.allplayers as ApiResponse;
        if (response.response?.length) {
          onResult({ leagueId, players: buildPlayers(leagueId, [response]) });
        }
        continue;
      }

      // Vecchio formato (4 endpoint separati): topscorers, topassists, ecc.
      const responses = ENDPOINTS.map(ep => leagueData[ep]).filter(Boolean) as ApiResponse[];
      if (responses.length === 0) continue;
      onResult({ leagueId, players: buildPlayers(leagueId, responses) });
    }

    return { ok: true, fetchedAt: data.fetchedAt as string | undefined };
  } catch {
    return { ok: false };
  }
}

export async function fetchAllLeagues(
  leagueIds: number[],
  onProgress: (p: FetchProgress) => void,
  onResult: (r: LeagueResult) => void,
): Promise<void> {
  let needsDelayBeforeNext = false;

  for (const leagueId of leagueIds) {
    const allCached = ENDPOINTS.every(ep => readCacheData(leagueId, ep) !== null);

    if (allCached) {
      onProgress({ leagueId, status: 'cached' });
      onResult({ leagueId, players: buildPlayers(leagueId, ENDPOINTS.map(ep => readCacheData(leagueId, ep)!)) });
      continue;
    }

    // Wait between leagues (not before the very first real fetch)
    if (needsDelayBeforeNext) {
      onProgress({ leagueId, status: 'fetching', waitingSeconds: Math.ceil(BETWEEN_LEAGUES_DELAY_MS / 1000) });
      await sleep(BETWEEN_LEAGUES_DELAY_MS);
    }

    onProgress({ leagueId, status: 'fetching' });

    try {
      // Fire all 4 endpoints in parallel for this league
      const responses = await Promise.all(
        ENDPOINTS.map(ep => fetchEndpoint(leagueId, ep))
      );
      onProgress({ leagueId, status: 'done' });
      onResult({ leagueId, players: buildPlayers(leagueId, responses) });
    } catch (err) {
      onProgress({ leagueId, status: 'error' });
      onResult({ leagueId, players: [], error: String((err as Error)?.message ?? err) });
    }

    needsDelayBeforeNext = true;
  }
}

function buildPlayers(leagueId: number, responses: ApiResponse[]): Player[] {
  const seen = new Set<number>();
  const merged: ApiResponse['response'] = [];
  for (const resp of responses) {
    for (const item of resp.response) {
      if (!seen.has(item.player.id)) {
        seen.add(item.player.id);
        merged.push(item);
      }
    }
  }

  const players: Player[] = [];
  for (const raw of merged) {
    const p = parsePlayer(raw, leagueId, '', SEASON);
    if (p) players.push(p);
  }
  players.sort((a, b) => b.talentScore - a.talentScore);
  return players;
}
