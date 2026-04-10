/**
 * fetch-data.js — scarica i giocatori da API-Football e salva in public/data/players.json
 *
 * Strategia ibrida:
 *   Serie A e B (2025/26) → paginazione completa /players?page=N  (copertura ottima)
 *   Serie C, Primavera, Serie D (2024/25) → topscorers/topassists/ecc. (API copre solo il 2024)
 *
 * Uso: npm run fetch-data
 */

import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── API Key ──────────────────────────────────────────────────────────────────
let API_KEY;
try {
  const env = readFileSync(resolve(ROOT, '.env'), 'utf-8');
  API_KEY = env.match(/VITE_API_FOOTBALL_KEY=(.+)/)?.[1]?.trim();
} catch {
  console.error('❌ File .env non trovato. Crea .env con VITE_API_FOOTBALL_KEY=la_tua_key');
  process.exit(1);
}
if (!API_KEY || API_KEY === 'la_tua_api_key') {
  console.error('❌ VITE_API_FOOTBALL_KEY non valida nel file .env');
  process.exit(1);
}

// ─── Configurazione ───────────────────────────────────────────────────────────
// Serie A e B: stagione 2025 — dati 2025/26 completi nell'API
const SEASON_MAJOR = 2025;
// Leghe minori: stagione 2024 — l'API non ha ancora copertura completa per il 2025/26
const SEASON_MINOR = 2024;

const PAGINATED_LEAGUES = [135, 136]; // Serie A, Serie B
const TOPLISTS_LEAGUES  = [138, 942, 943, 705, 706, 426, 427, 428, 429, 430, 431, 432, 433, 434];
const TOPLISTS_ENDPOINTS = ['topscorers', 'topassists', 'topyellowcards', 'topredcards'];

const LEAGUE_NAMES = {
  135: 'Serie A',             136: 'Serie B',
  138: 'Serie C – Girone A',  942: 'Serie C – Girone B',  943: 'Serie C – Girone C',
  705: 'Primavera 1',         706: 'Primavera 2',
  426: 'Serie D – Girone A',  427: 'Serie D – Girone B',  428: 'Serie D – Girone C',
  429: 'Serie D – Girone D',  430: 'Serie D – Girone E',  431: 'Serie D – Girone F',
  432: 'Serie D – Girone G',  433: 'Serie D – Girone H',  434: 'Serie D – Girone I',
};

const BETWEEN_PAGES_DELAY_MS  = 350;
const BETWEEN_LEAGUES_DELAY_MS = 3_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function apiFetch(url, attempt = 1) {
  const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } });
  if (res.status === 429) {
    if (attempt <= 4) {
      const wait = attempt * 30;
      process.stdout.write(`\n    ⚠️  Rate limit (tentativo ${attempt}/4) — attendo ${wait}s... `);
      await sleep(wait * 1000);
      process.stdout.write('retry... ');
      return apiFetch(url, attempt + 1);
    }
    throw new Error(`Rate limit persistente: ${url}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const json = await res.json();
  if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
    throw new Error(`API error: ${Object.values(json.errors).join(', ')}`);
  }
  return json;
}

// ─── Paginazione completa (/players?page=N) ───────────────────────────────────
async function fetchAllPages(leagueId, season) {
  const first = await apiFetch(
    `https://v3.football.api-sports.io/players?league=${leagueId}&season=${season}&page=1`
  );
  const totalPages = first.paging?.total ?? 1;
  const all = [...(first.response ?? [])];
  process.stdout.write(`p1/${totalPages} `);

  for (let page = 2; page <= totalPages; page++) {
    await sleep(BETWEEN_PAGES_DELAY_MS);
    const data = await apiFetch(
      `https://v3.football.api-sports.io/players?league=${leagueId}&season=${season}&page=${page}`
    );
    all.push(...(data.response ?? []));
    process.stdout.write(`p${page} `);
  }

  return {
    get: 'players',
    parameters: { league: String(leagueId), season: String(season) },
    errors: [],
    results: all.length,
    paging: { current: 1, total: totalPages },
    response: all,
  };
}

// ─── Top-list endpoints (topscorers, topassists, ecc.) ───────────────────────
async function fetchToplist(leagueId, endpoint, season) {
  return apiFetch(
    `https://v3.football.api-sports.io/players/${endpoint}?league=${leagueId}&season=${season}`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const total = PAGINATED_LEAGUES.length + TOPLISTS_LEAGUES.length;
  console.log('🚀 Vivaio Talents — fetch ibrido');
  console.log(`📅 Serie A/B: ${SEASON_MAJOR}/${SEASON_MAJOR + 1}  |  Leghe minori: ${SEASON_MINOR}/${SEASON_MINOR + 1}`);
  console.log(`🏟️  Campionati: ${total}\n`);

  const output = {
    fetchedAt: new Date().toISOString(),
    seasons: { major: SEASON_MAJOR, minor: SEASON_MINOR },
    format: 'allplayers_v2',
    leagues: {},
  };

  let totalCalls = 0;
  let firstLeague = true;

  // ── Serie A e B: paginazione completa 2025/26 ─────────────────────────────
  console.log('📡 [PAGINAZIONE 2025/26] Serie A, Serie B');
  for (const leagueId of PAGINATED_LEAGUES) {
    if (!firstLeague) {
      process.stdout.write(`\n⏳ Attendo ${BETWEEN_LEAGUES_DELAY_MS / 1000}s... `);
      await sleep(BETWEEN_LEAGUES_DELAY_MS);
      process.stdout.write('✓\n');
    }
    firstLeague = false;
    process.stdout.write(`📥 ${LEAGUE_NAMES[leagueId]}... `);
    try {
      const result = await fetchAllPages(leagueId, SEASON_MAJOR);
      totalCalls += result.paging.total;
      output.leagues[leagueId] = { allplayers: result };
      console.log(`✅ (${result.results} giocatori, ${result.paging.total} pagine)`);
    } catch (err) {
      console.log(`\n❌ ${err.message}`);
      output.leagues[leagueId] = { error: err.message };
    }
  }

  // ── Leghe minori: toplists 2024/25 ────────────────────────────────────────
  console.log('\n📡 [TOPLISTS 2024/25] Serie C, Primavera, Serie D');
  for (const leagueId of TOPLISTS_LEAGUES) {
    process.stdout.write(`\n⏳ Attendo ${BETWEEN_LEAGUES_DELAY_MS / 1000}s... `);
    await sleep(BETWEEN_LEAGUES_DELAY_MS);
    process.stdout.write('✓\n');
    process.stdout.write(`📥 ${LEAGUE_NAMES[leagueId]}... `);
    try {
      const responses = await Promise.all(
        TOPLISTS_ENDPOINTS.map(ep => fetchToplist(leagueId, ep, SEASON_MINOR))
      );
      totalCalls += TOPLISTS_ENDPOINTS.length;
      const entries = responses.reduce((sum, r) => sum + (r.results ?? 0), 0);
      output.leagues[leagueId] = {};
      TOPLISTS_ENDPOINTS.forEach((ep, i) => { output.leagues[leagueId][ep] = responses[i]; });
      console.log(`✅ (${entries} entries)`);
    } catch (err) {
      console.log(`\n❌ ${err.message}`);
      output.leagues[leagueId] = { error: err.message };
    }
  }

  const outPath = resolve(ROOT, 'public/data/players.json');
  mkdirSync(resolve(ROOT, 'public/data'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output));

  console.log(`\n✅ Completato! ${totalCalls} chiamate API.`);
  console.log(`💾 Dati salvati in public/data/players.json`);
  console.log(`🌐 Riavvia il dev server per vedere i dati aggiornati.`);
}

main().catch(err => {
  console.error('\n❌ Errore fatale:', err.message);
  process.exit(1);
});
