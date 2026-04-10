/**
 * fetch-data.js — scarica TUTTI i giocatori da API-Football con paginazione
 *                 e salva in public/data/players.json
 *
 * Uso: npm run fetch-data
 *
 * Requisiti: Node 18+, file .env con VITE_API_FOOTBALL_KEY
 *
 * Strategia:
 *   Usa /players?league=X&season=Y&page=N per ottenere TUTTI i giocatori
 *   (non solo i top 20 di ogni categoria statistica).
 *   Ogni pagina restituisce 20 giocatori; paginiamo finché non le abbiamo tutte.
 *
 * Stima chiamate (piano pagato):
 *   Serie A/B: ~25 pagine; Serie C: ~20 pag × 3; Primavera: ~15 × 2; Serie D: ~10 × 9
 *   Totale stimato: ~300-400 chiamate
 *   Con 300ms tra pagine + 3s tra campionati → completato in ~15-20 min
 */

import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Leggi API key da .env ────────────────────────────────────────────────────
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
const SEASON = 2025;
const LEAGUE_IDS = [135, 136, 138, 942, 943, 705, 706, 426, 427, 428, 429, 430, 431, 432, 433, 434];

const LEAGUE_NAMES = {
  135: 'Serie A',            136: 'Serie B',
  138: 'Serie C – Girone A', 942: 'Serie C – Girone B', 943: 'Serie C – Girone C',
  705: 'Primavera 1',        706: 'Primavera 2',
  426: 'Serie D – Girone A', 427: 'Serie D – Girone B', 428: 'Serie D – Girone C',
  429: 'Serie D – Girone D', 430: 'Serie D – Girone E', 431: 'Serie D – Girone F',
  432: 'Serie D – Girone G', 433: 'Serie D – Girone H', 434: 'Serie D – Girone I',
};

// Delay tra pagine dello stesso campionato (ms) — evita burst di richieste
const BETWEEN_PAGES_DELAY_MS = 350;
// Delay tra campionati diversi (ms)
const BETWEEN_LEAGUES_DELAY_MS = 3_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(leagueId, page, attempt = 1) {
  const url = `https://v3.football.api-sports.io/players?league=${leagueId}&season=${SEASON}&page=${page}`;
  const res = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY },
  });

  if (res.status === 429) {
    if (attempt <= 4) {
      const waitSec = attempt * 30;
      process.stdout.write(`\n    ⚠️  Rate limit (tentativo ${attempt}/4) — attendo ${waitSec}s... `);
      await sleep(waitSec * 1000);
      process.stdout.write('retry... ');
      return fetchPage(leagueId, page, attempt + 1);
    }
    throw new Error(`Rate limit persistente su league ${leagueId} pagina ${page}`);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status} per league ${leagueId} pagina ${page}`);

  const json = await res.json();
  if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
    throw new Error(`API error: ${Object.values(json.errors).join(', ')}`);
  }
  return json;
}

// ─── Scarica tutti i giocatori di un campionato (tutte le pagine) ─────────────
async function fetchAllPlayersForLeague(leagueId) {
  // Pagina 1: scopriamo quante pagine ci sono in totale
  const first = await fetchPage(leagueId, 1);
  const totalPages = first.paging?.total ?? 1;
  const allPlayers = [...(first.response ?? [])];

  process.stdout.write(`p1/${totalPages} `);

  for (let page = 2; page <= totalPages; page++) {
    await sleep(BETWEEN_PAGES_DELAY_MS);
    const data = await fetchPage(leagueId, page);
    allPlayers.push(...(data.response ?? []));
    process.stdout.write(`p${page} `);
  }

  return {
    get: 'players',
    parameters: { league: String(leagueId), season: String(SEASON) },
    errors: [],
    results: allPlayers.length,
    paging: { current: 1, total: totalPages },
    response: allPlayers,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Vivaio Talents — fetch COMPLETO con paginazione');
  console.log(`📅 Stagione: ${SEASON}/${SEASON + 1}`);
  console.log(`🏟️  Campionati: ${LEAGUE_IDS.length}`);
  console.log(`📡 Strategia: /players?league=X&season=Y&page=N (tutti i giocatori)\n`);

  const output = {
    fetchedAt: new Date().toISOString(),
    season: SEASON,
    format: 'allplayers_v2', // flag per distinguere dal vecchio formato
    leagues: {},
  };

  let totalCalls = 0;
  let totalPlayers = 0;

  for (let i = 0; i < LEAGUE_IDS.length; i++) {
    const leagueId = LEAGUE_IDS[i];
    const name = LEAGUE_NAMES[leagueId] ?? `League ${leagueId}`;

    if (i > 0) {
      process.stdout.write(`\n⏳ Attendo ${BETWEEN_LEAGUES_DELAY_MS / 1000}s... `);
      await sleep(BETWEEN_LEAGUES_DELAY_MS);
      process.stdout.write('✓\n');
    }

    process.stdout.write(`📥 [${String(i + 1).padStart(2)}/${LEAGUE_IDS.length}] ${name}... `);

    try {
      const result = await fetchAllPlayersForLeague(leagueId);
      totalCalls += result.paging.total;
      totalPlayers += result.results;

      output.leagues[leagueId] = { allplayers: result };
      console.log(`✅ (${result.results} giocatori, ${result.paging.total} pagine)`);
    } catch (err) {
      console.log(`\n❌ ${err.message}`);
      output.leagues[leagueId] = { error: err.message };
    }
  }

  // Salva il file
  const outPath = resolve(ROOT, 'public/data/players.json');
  mkdirSync(resolve(ROOT, 'public/data'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output));

  console.log(`\n✅ Completato!`);
  console.log(`📊 ${totalPlayers} giocatori totali da ${totalCalls} pagine API.`);
  console.log(`💾 Dati salvati in public/data/players.json`);
  console.log(`🌐 Riavvia il dev server per vedere i dati aggiornati.`);
}

main().catch(err => {
  console.error('\n❌ Errore fatale:', err.message);
  process.exit(1);
});
