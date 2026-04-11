# Sistema di Scoring — Vivaio Talents

## Obiettivo

Classificare i giovani calciatori italiani (U23) in modo **equo tra leghe diverse**,
evitando che un attaccante della Primavera con 28 gol appaia sopra un centrocampista
della Serie A con 5 gol e 5 assist.

---

## Formula

```
TalentScore = BaseScore × LeagueCoeff × AgeBonus
```

### 1 — BaseScore

Statistiche pure del giocatore nella stagione:

```
BaseScore = (Gol × 4) + (Assist × 3) + (Minuti / 90 × 0.8) + (Rating × 2)
```

| Componente | Peso | Motivazione |
|---|---|---|
| Gol | ×4 | Contributo diretto al risultato |
| Assist | ×3 | Contributo quasi diretto |
| Minuti / 90 | ×0.8 | Continuità e affidabilità |
| Rating medio | ×2 | Performance complessiva |

---

### 2 — Coefficiente Lega (LeagueCoeff)

Segnare 1 gol in Serie A vale molto di più che segnarne 1 in Primavera.
Il coefficiente moltiplica l'intero score base.

| Lega | ID API | Coefficiente | Motivazione |
|---|---|---|---|
| Serie A | 135 | **×4.0** | Top flight europeo, difese di livello mondiale |
| Serie B | 136 | **×2.5** | Secondo livello, pienamente professionistico |
| Serie C | 974 | **×1.3** | Terzo livello, ancora professionistico |
| Primavera 1 | 705 | **×1.3** | Élite giovanile, ma contro pari età |
| Primavera 2 | 706 | **×0.9** | Secondo livello giovanile |
| Serie D | 997 | **×0.7** | Semiprofessionistico |

> **Nota tecnica:** L'API di football-api restituisce i dati Serie C sotto l'ID lega 974
> (denominata internamente "Serie C - Supercoppa Lega Finals" ma contiene le stat
> della stagione regolare). Serie D usa ID 997.

---

### 3 — Bonus Età (AgeBonus)

Un 17enne che gioca e segna in Serie C è molto più raro di un 23enne nella stessa lega.
Ogni anno **sotto i 21** vale **+8%**.

```
AgeBonus = 1 + max(0, 21 - età) × 0.08
```

| Età | Bonus |
|---|---|
| 17 anni | **+32%** (×1.32) |
| 18 anni | **+24%** (×1.24) |
| 19 anni | **+16%** (×1.16) |
| 20 anni | **+8%** (×1.08) |
| 21-23 anni | nessun bonus (×1.0) |

> L'età viene calcolata al **1 agosto** dell'anno di inizio stagione, non alla data odierna.

---

## Esempi reali (stagione 2024/25)

| Giocatore | Lega | Età | Gol | Assist | Min | Rating | Score |
|---|---|---|---|---|---|---|---|
| S. Esposito | Serie A | 23 | 5 | 5 | ~1800 | 6.8 | **~272** |
| Abiuso | Serie B | 22 | 11 | 2 | ~2100 | 6.9 | **~236** |
| Gabbiani | Primavera 1 | 18 | 28 | — | ~2000 | — | **~219** |
| Mignani | Serie C | 21 | 18 | — | ~2400 | — | **~131** |

La Serie A torna correttamente in cima, la Primavera scala in modo proporzionato.

---

## Visualizzazione UI

### PlayerCard — sotto il TalentScore

```
[ 272.3 ]
  SCORE
[ ×4.0 ]              ← badge lega (oro Serie A, argento B, bronzo C)
```

Per i giocatori under 21:
```
[ 219.4 ]
  SCORE
[ ×1.3 ]  [ ⬆+24% ]  ← badge lega + badge età (verde)
```

Hovering sui badge mostra un **tooltip** con il breakdown completo:

```
COME SI CALCOLA
Base stat        45.2
Lega (×4.0)    = 180.8
Età 18a (+24%) = 224.2
─────────────────────
TALENT SCORE    272.3
```

### PlayerModal — sezione score compatta

Barra di progresso relativa al massimo in classifica + formula orizzontale:

```
[▓▓▓▓▓▓▓▓░░]

45.2    ×    ×4.0    ×    +24%    =    272.3
base        Serie A      18 anni
```

---

## Limiti e scelte di design

- **Portieri esclusi dalla classifica offensiva** — i saves non influenzano il TalentScore
  (campo `conceded` / `saves` non usati nella formula)
- **Solo calciatori italiani** — filtro `nationality === 'Italy'` nel parser
- **Solo U23** — filtro `ageAtSeasonStart <= 23` nel parser
- **Rating a 0** — se l'API non restituisce rating, contribuisce 0 allo score base
- **Giocatori trasferiti** — si usa l'**ultima entry** nell'array `statistics` (team più recente)
