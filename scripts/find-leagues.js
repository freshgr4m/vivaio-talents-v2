/**
 * find-leagues.js — trova i league ID italiani per la stagione 2025
 * Uso: node scripts/find-leagues.js
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let API_KEY;
try {
  const env = readFileSync(resolve(ROOT, '.env'), 'utf-8');
  API_KEY = env.match(/VITE_API_FOOTBALL_KEY=(.+)/)?.[1]?.trim();
} catch {
  console.error('❌ File .env non trovato');
  process.exit(1);
}

const res = await fetch('https://v3.football.api-sports.io/leagues?country=Italy&season=2025', {
  headers: { 'x-apisports-key': API_KEY },
});
const json = await res.json();

console.log('\n🇮🇹 Campionati italiani disponibili per stagione 2025:\n');
for (const entry of json.response) {
  const l = entry.league;
  const s = entry.seasons?.find(s => s.year === 2025);
  console.log(`  ID: ${String(l.id).padEnd(6)} | ${l.name}`);
}
