/**
 * fetch-data.js — scarica tutti i giocatori italiani da API-Football
 *
 * Strategia per lega:
 *   Serie A (135) / Serie B (136) / Primavera 1 (705) / Primavera 2 (706)
 *     → paginazione completa, stats reali incluse nella risposta
 *
 *   Serie C (974) / Serie D (997)
 *     → FASE 1: paginazione per scoprire tutti gli italiani U23 (stats null nell'API)
 *     → FASE 2: fetch individuale per ogni giocatore per ottenere le stats reali
 *     Motivo: l'API restituisce stats null nella paginazione per questi campionati,
 *             ma le stats reali sono disponibili tramite /players?id=X
 *
 * Uso: npm run fetch-data
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
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

// Leghe con paginazione diretta (stats reali nella risposta)
const PAGINATED_LEAGUES = [
  { id: 135, name: 'Serie A',        season: 2025 },
  { id: 136, name: 'Serie B',        season: 2025 },
  { id: 705, name: 'Primavera 1',    season: 2024 },
  { id: 706, name: 'Primavera 2',    season: 2024 },
];

// Leghe a 2 fasi: paginazione per discovery + fetch individuale per stats
const TWO_PHASE_LEAGUES = [
  { id: 974, name: 'Serie C',        season: 2024 },
  { id: 997, name: 'Serie D',        season: 2024 },
];

// Soglia anno di nascita per filtro U23 (born >= MIN_BIRTH_YEAR)
// Usiamo 2000 per dare un po' di margine sopra i 23 anni
const MIN_BIRTH_YEAR = 2000;

const BETWEEN_PAGES_DELAY_MS    = 350;
const BETWEEN_LEAGUES_DELAY_MS  = 2_000;
const BETWEEN_PLAYERS_DELAY_MS  = 250;  // delay tra fetch individuali

const CHECKPOINT_PATH = resolve(ROOT, 'scripts/.fetch-checkpoint.json');
const OUT_PATH        = resolve(ROOT, 'public/data/players.json');

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

function isU23Candidate(player) {
  const birthDate = player.birth?.date;
  if (!birthDate) return false;
  const year = parseInt(birthDate.split('-')[0], 10);
  return year >= MIN_BIRTH_YEAR;
}

// ─── Checkpoint ───────────────────────────────────────────────────────────────
function loadCheckpoint() {
  if (!existsSync(CHECKPOINT_PATH)) return {};
  try { return JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8')); } catch { return {}; }
}

function saveCheckpoint(data) {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(data, null, 2));
}

function clearCheckpoint() {
  if (existsSync(CHECKPOINT_PATH)) {
    try { writeFileSync(CHECKPOINT_PATH, '{}'); } catch { /* ignore */ }
  }
}

function saveOutput(output) {
  mkdirSync(resolve(ROOT, 'public/data'), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(output));
}

// ─── FASE UNICA: paginazione completa (Serie A/B/Primavera) ───────────────────
async function fetchPaginated(leagueId, season) {
  const first = await apiFetch(
    `https://v3.football.api-sports.io/players?league=${leagueId}&season=${season}&page=1`
  );
  const totalPages = first.paging?.total ?? 1;
  const italians = (first.response ?? []).filter(p => p.player.nationality === 'Italy');
  process.stdout.write(`p1/${totalPages}(${italians.length}🇮🇹) `);

  let allItalians = [...italians];
  let totalCalls = 1;

  for (let page = 2; page <= totalPages; page++) {
    await sleep(BETWEEN_PAGES_DELAY_MS);
    const data = await apiFetch(
      `https://v3.football.api-sports.io/players?league=${leagueId}&season=${season}&page=${page}`
    );
    totalCalls++;
    const pageItalians = (data.response ?? []).filter(p => p.player.nationality === 'Italy');
    allItalians.push(...pageItalians);

    if (page % 10 === 0 || page === totalPages) {
      process.stdout.write(`p${page}(${allItalians.length}🇮🇹) `);
    }
  }

  return { allItalians, totalPages, totalCalls };
}

// ─── FASE 1: discovery paginata (Serie C/D, stats null ma IDs validi) ─────────
async function discoverItalianU23Ids(leagueId, season) {
  const first = await apiFetch(
    `https://v3.football.api-sports.io/players?league=${leagueId}&season=${season}&page=1`
  );
  const totalPages = first.paging?.total ?? 1;

  const candidates = new Map(); // playerId → { name, birth }
  const addCandidates = (response) => {
    for (const item of response ?? []) {
      if (item.player.nationality !== 'Italy') continue;
      if (!isU23Candidate(item.player)) continue;
      if (!candidates.has(item.player.id)) {
        candidates.set(item.player.id, item.player);
      }
    }
  };

  addCandidates(first.response);
  process.stdout.write(`p1/${totalPages}(${candidates.size}👤) `);
  let totalCalls = 1;

  for (let page = 2; page <= totalPages; page++) {
    await sleep(BETWEEN_PAGES_DELAY_MS);
    const data = await apiFetch(
      `https://v3.football.api-sports.io/players?league=${leagueId}&season=${season}&page=${page}`
    );
    totalCalls++;
    addCandidates(data.response);

    if (page % 10 === 0 || page === totalPages) {
      process.stdout.write(`p${page}(${candidates.size}👤) `);
    }
  }

  return { candidateIds: [...candidates.keys()], totalPages, totalCalls };
}

// ─── FASE 2: fetch individuale per stats reali ────────────────────────────────
async function fetchIndividualStats(playerIds, season, leagueId) {
  const results = [];
  const total = playerIds.length;
  process.stdout.write(`\n   📊 Fetch stats individuali: ${total} giocatori... `);

  let fetched = 0;
  for (const playerId of playerIds) {
    if (fetched > 0) await sleep(BETWEEN_PLAYERS_DELAY_MS);

    try {
      const data = await apiFetch(
        `https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`
      );
      const player = data.response?.[0];
      if (!player) { fetched++; continue; }

      // Filtra stats per la lega corretta
      const stat = player.statistics?.find(s => s.league.id === leagueId);
      if (!stat) { fetched++; continue; }

      // Ricostruisci nel formato ApiPlayerResponse atteso dall'app
      results.push({
        player: player.player,
        statistics: player.statistics.filter(s => s.league.id === leagueId),
      });
    } catch {
      // Ignora errori individuali, continuiamo con gli altri
    }

    fetched++;
    if (fetched % 50 === 0 || fetched === total) {
      process.stdout.write(`${fetched}/${total} `);
    }
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const checkpoint = loadCheckpoint();
  const isResume = Object.keys(checkpoint).length > 0;

  console.log('🚀 Vivaio Talents — fetch completo con stats reali');
  console.log(`🏟️  Leghe: ${PAGINATED_LEAGUES.length + TWO_PHASE_LEAGUES.length}`);
  if (isResume) {
    const done = Object.keys(checkpoint).length;
    console.log(`♻️  Resume: ${done} leghe già completate`);
  }
  console.log('');

  let output = {
    fetchedAt: new Date().toISOString(),
    seasons: { major: 2025, minor: 2024 },
    format: 'allplayers_v2',
    leagues: {},
  };

  if (isResume && existsSync(OUT_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
      output = { ...existing, fetchedAt: new Date().toISOString() };
    } catch { /* inizia da zero */ }
  }

  let totalCalls = 0;
  let firstLeague = true;

  // ── Leghe con paginazione diretta ─────────────────────────────────────────
  for (const league of PAGINATED_LEAGUES) {
    const { id: leagueId, name, season } = league;

    if (checkpoint[leagueId]) {
      console.log(`⏭️  ${name} — già completata (${checkpoint[leagueId]} italiani)`);
      continue;
    }

    if (!firstLeague) {
      process.stdout.write(`\n⏳ Pausa ${BETWEEN_LEAGUES_DELAY_MS / 1000}s... `);
      await sleep(BETWEEN_LEAGUES_DELAY_MS);
      process.stdout.write('✓\n');
    }
    firstLeague = false;

    process.stdout.write(`📥 ${name} (${season}/${season + 1})... `);

    try {
      const { allItalians, totalPages, totalCalls: calls } = await fetchPaginated(leagueId, season);
      totalCalls += calls;

      output.leagues[leagueId] = {
        allplayers: {
          get: 'players',
          parameters: { league: String(leagueId), season: String(season) },
          errors: [],
          results: allItalians.length,
          paging: { current: 1, total: totalPages },
          response: allItalians,
        }
      };

      saveOutput(output);
      checkpoint[leagueId] = allItalians.length;
      saveCheckpoint(checkpoint);

      console.log(`\n   ✅ ${allItalians.length} italiani | ${totalPages} pagine | ${calls} chiamate`);
    } catch (err) {
      console.log(`\n   ❌ ${err.message}`);
      saveOutput(output);
      process.exit(1);
    }
  }

  // ── Leghe a 2 fasi: Serie C e Serie D ────────────────────────────────────
  for (const league of TWO_PHASE_LEAGUES) {
    const { id: leagueId, name, season } = league;

    if (checkpoint[leagueId]) {
      console.log(`⏭️  ${name} — già completata (${checkpoint[leagueId]} italiani)`);
      continue;
    }

    process.stdout.write(`\n⏳ Pausa ${BETWEEN_LEAGUES_DELAY_MS / 1000}s... `);
    await sleep(BETWEEN_LEAGUES_DELAY_MS);
    process.stdout.write('✓\n');

    process.stdout.write(`📥 ${name} (${season}/${season + 1}) — Fase 1 discovery... `);

    try {
      // FASE 1: scopri tutti gli IDs degli italiani U23
      const { candidateIds, totalPages, totalCalls: calls1 } = await discoverItalianU23Ids(leagueId, season);
      totalCalls += calls1;
      console.log(`\n   → ${candidateIds.length} candidati italiani U23+ trovati in ${totalPages} pagine (${calls1} chiamate)`);

      // Pausa tra le due fasi
      await sleep(BETWEEN_LEAGUES_DELAY_MS);

      // FASE 2: fetch stats individuali
      const playersWithStats = await fetchIndividualStats(candidateIds, season, leagueId);
      totalCalls += candidateIds.length;

      output.leagues[leagueId] = {
        allplayers: {
          get: 'players',
          parameters: { league: String(leagueId), season: String(season) },
          errors: [],
          results: playersWithStats.length,
          paging: { current: 1, total: totalPages },
          response: playersWithStats,
        }
      };

      saveOutput(output);
      checkpoint[leagueId] = playersWithStats.length;
      saveCheckpoint(checkpoint);

      console.log(`\n   ✅ ${playersWithStats.length} italiani con stats reali | ${candidateIds.length + calls1} chiamate totali`);
    } catch (err) {
      console.log(`\n   ❌ ${err.message}`);
      saveOutput(output);
      process.exit(1);
    }
  }

  clearCheckpoint();

  // ── Riepilogo ─────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Fetch completato! ${totalCalls} chiamate API totali`);
  let totalItalians = 0;
  for (const [id, lg] of Object.entries(output.leagues)) {
    if (lg.allplayers) {
      const lName = [...PAGINATED_LEAGUES, ...TWO_PHASE_LEAGUES].find(l => l.id === Number(id))?.name ?? id;
      console.log(`   ${lName}: ${lg.allplayers.results} italiani`);
      totalItalians += lg.allplayers.results;
    }
  }
  console.log(`\n   Totale: ${totalItalians} giocatori italiani`);
  console.log(`💾 Salvato in public/data/players.json`);
  console.log(`🌐 Riavvia il dev server per vedere i dati aggiornati.`);
}

main().catch(err => {
  console.error('\n❌ Errore fatale:', err.message);
  console.error('ℹ️  Riesegui npm run fetch-data per riprendere dal checkpoint');
  process.exit(1);
});
