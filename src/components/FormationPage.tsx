import { useState } from 'react';
import type { Player } from '../types/player';

// ─── helpers ────────────────────────────────────────────────────────────────

type Role = 'GK' | 'DEF' | 'MID' | 'ATT';

function toRole(position: string): Role {
  if (position === 'Goalkeeper') return 'GK';
  if (position === 'Defender')   return 'DEF';
  if (position === 'Midfielder') return 'MID';
  return 'ATT'; // Attacker / Forward
}

const ROLE_LABEL: Record<Role, string> = {
  GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', ATT: 'Attaccante',
};
const ROLE_COLOR: Record<Role, string> = {
  GK:  'bg-yellow-400 text-black',
  DEF: 'bg-blue-500  text-white',
  MID: 'bg-green-500 text-white',
  ATT: 'bg-red-500   text-white',
};

// Starters needed per role in 4-3-3
const STARTERS: Record<Role, number> = { GK: 1, DEF: 4, MID: 3, ATT: 3 };

// X positions (%) per role per slot (left→right)
const SLOT_X: Record<Role, number[]> = {
  GK:  [50],
  DEF: [13, 35, 65, 87],
  MID: [20, 50, 80],
  ATT: [15, 50, 85],
};
// Y position (%) from top of pitch (ATT at top, GK at bottom)
const ROLE_Y: Record<Role, number> = { ATT: 14, MID: 38, DEF: 62, GK: 83 };

function buildFormation(players: Player[]): Formation {
  // Deduplicate by player ID (keep highest talent score per player)
  const byId = new Map<number, Player>();
  for (const p of players) {
    const existing = byId.get(p.id);
    if (!existing || p.talentScore > existing.talentScore) byId.set(p.id, p);
  }

  const groups: Record<Role, Player[]> = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const p of byId.values()) {
    groups[toRole(p.position)].push(p);
  }
  for (const role of Object.keys(groups) as Role[]) {
    groups[role].sort((a, b) => b.talentScore - a.talentScore);
  }

  // Take whatever is available — partial formation is fine
  const starters: Record<Role, Player[]> = {
    GK:  groups.GK.slice(0, STARTERS.GK),
    DEF: groups.DEF.slice(0, STARTERS.DEF),
    MID: groups.MID.slice(0, STARTERS.MID),
    ATT: groups.ATT.slice(0, STARTERS.ATT),
  };
  // Reserve only if there's a player left after starters
  const reserves: Partial<Record<Role, Player>> = {};
  for (const role of Object.keys(STARTERS) as Role[]) {
    const r = groups[role][STARTERS[role]];
    if (r) reserves[role] = r;
  }

  return { starters, reserves };
}

interface Formation {
  starters: Record<Role, Player[]>;
  reserves: Partial<Record<Role, Player>>;
}

// ─── EmptySlot ───────────────────────────────────────────────────────────────

function EmptySlot({ role }: { role: Role }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
        <span className="text-white/20 text-xs font-bold font-[Oswald]">{role}</span>
      </div>
      <p className="text-white/20 text-[10px]">—</p>
    </div>
  );
}

// ─── PitchPlayer ─────────────────────────────────────────────────────────────

function PitchPlayer({ player, role, onClick, active }: {
  player: Player; role: Role; onClick: () => void; active: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const rc = ROLE_COLOR[role];

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 group transition-all duration-150 ${active ? 'scale-110' : 'hover:scale-105'}`}
    >
      <div className={`relative w-12 h-12 rounded-full border-2 overflow-hidden shadow-lg transition-all
        ${active ? 'border-[#FFD700] shadow-[#FFD700]/40 shadow-lg' : 'border-white/30 group-hover:border-white/70'}`}>
        {!imgErr
          ? <img src={player.photo} alt={player.name} onError={() => setImgErr(true)}
              className="w-full h-full object-cover" />
          : <div className={`w-full h-full flex items-center justify-center text-xs font-bold font-[Oswald] ${rc}`}>
              {initials}
            </div>
        }
        {/* Role badge */}
        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2
          text-[8px] font-bold px-1 rounded-sm leading-none py-px ${rc}`}>
          {role}
        </span>
      </div>
      <div className="text-center">
        <p className="text-white text-[11px] font-semibold leading-tight max-w-[72px] truncate drop-shadow-md">
          {player.name.split(' ').slice(-1)[0]}
        </p>
        <p className="text-[#FFD700] text-[10px] font-[Oswald] leading-none drop-shadow-md">
          {player.talentScore.toFixed(1)}
        </p>
      </div>
    </button>
  );
}

// ─── PlayerPopup ─────────────────────────────────────────────────────────────

function PlayerPopup({ player, role, onClose }: { player: Player; role: Role; onClose: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 rounded-2xl"
      onClick={onClose}>
      <div className="bg-[#13131e] border border-white/10 rounded-2xl p-5 w-64 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#FFD700]/40 shrink-0">
            {!imgErr
              ? <img src={player.photo} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover"/>
              : <div className={`w-full h-full flex items-center justify-center font-bold font-[Oswald] ${ROLE_COLOR[role]}`}>{initials}</div>
            }
          </div>
          <div>
            <p className="font-[Oswald] text-white font-bold text-base leading-tight">{player.name}</p>
            <p className="text-white/40 text-xs">{ROLE_LABEL[role]} · {player.age} anni</p>
            <p className="text-white/50 text-xs truncate">{player.teamName}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/70 text-lg leading-none">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { l: 'TALENT', v: player.talentScore.toFixed(1), gold: true },
            { l: 'RATING', v: player.rating > 0 ? player.rating.toFixed(1) : '—' },
            { l: 'GOL',    v: player.goals },
            { l: 'ASSIST', v: player.assists },
            { l: 'MINUTI', v: player.minutesPlayed },
            { l: 'LEGA',   v: player.leagueName.replace('Serie ', 'S.').replace('Campionato Primavera', 'Prim.') },
          ].map(({ l, v, gold }) => (
            <div key={l} className="bg-white/5 rounded-lg py-2 px-1">
              <div className={`font-[Oswald] text-lg font-bold leading-none ${gold ? 'text-[#FFD700]' : 'text-white'}`}>{v}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ReserveCard ─────────────────────────────────────────────────────────────

function ReserveCard({ player, role }: { player: Player; role: Role }) {
  const [imgErr, setImgErr] = useState(false);
  if (!player) return null;
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl p-3 transition-colors">
      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
        {!imgErr
          ? <img src={player.photo} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover"/>
          : <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${ROLE_COLOR[role]}`}>{initials}</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">{player.name}</p>
        <p className="text-white/40 text-[10px] truncate">{player.teamName}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="font-[Oswald] text-sm font-bold text-[#FFD700]">{player.talentScore.toFixed(1)}</div>
        <span className={`text-[9px] font-bold px-1 rounded ${ROLE_COLOR[role]}`}>{role}</span>
      </div>
    </div>
  );
}

// ─── FormationPage ────────────────────────────────────────────────────────────

interface FormationPageProps {
  players: Player[];
}

export function FormationPage({ players }: FormationPageProps) {
  const [selected, setSelected] = useState<{ player: Player; role: Role } | null>(null);

  const formation = buildFormation(players);

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <p className="text-white/40 text-sm">Carica prima i dati dalle classifiche.</p>
      </div>
    );
  }

  const handleClick = (player: Player, role: Role) => {
    setSelected(prev => prev?.player.id === player.id ? null : { player, role });
  };

  // Count missing slots for the info bar
  const missingSlots = (Object.keys(STARTERS) as Role[]).flatMap(role => {
    const have = formation.starters[role].length;
    const need = STARTERS[role];
    return Array.from({ length: need - have }, (_, i) => ({ role, slot: i }));
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Pitch */}
      <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl mb-6"
        style={{ background: 'linear-gradient(180deg, #1a4a1a 0%, #1e5c1e 50%, #1a4a1a 100%)' }}>

        {/* Field lines */}
        {/* Outer border */}
        <div className="absolute inset-[3%] border border-white/20 rounded-sm pointer-events-none" />
        {/* Halfway line */}
        <div className="absolute left-[3%] right-[3%] top-1/2 h-px bg-white/20 pointer-events-none" />
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[22%] aspect-square rounded-full border border-white/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-1.5 h-1.5 rounded-full bg-white/30 pointer-events-none" />
        {/* Top penalty area */}
        <div className="absolute top-[3%] left-[25%] right-[25%] h-[16%]
          border border-white/20 border-t-0 pointer-events-none" />
        {/* Bottom penalty area */}
        <div className="absolute bottom-[3%] left-[25%] right-[25%] h-[16%]
          border border-white/20 border-b-0 pointer-events-none" />

        {/* Players on pitch — filled + empty slots */}
        {(Object.keys(STARTERS) as Role[]).flatMap(role =>
          Array.from({ length: STARTERS[role] }, (_, idx) => {
            const player = formation.starters[role][idx];
            const x = SLOT_X[role][idx];
            const y = ROLE_Y[role];
            return (
              <div
                key={`${role}-${idx}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {player
                  ? <PitchPlayer
                      player={player}
                      role={role}
                      onClick={() => handleClick(player, role)}
                      active={selected?.player.id === player.id}
                    />
                  : <EmptySlot role={role} />
                }
              </div>
            );
          })
        )}

        {/* Popup overlay */}
        {selected && (
          <PlayerPopup
            player={selected.player}
            role={selected.role}
            onClose={() => setSelected(null)}
          />
        )}

        {/* Formation label */}
        <div className="absolute top-2 right-3 font-[Oswald] text-white/30 text-sm tracking-widest">
          4 · 3 · 3
        </div>
      </div>

      {/* Warning if slots are missing */}
      {missingSlots.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 text-sm text-amber-300/80">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>
            {missingSlots.length} slot{missingSlots.length > 1 ? 's' : ''} vuot{missingSlots.length > 1 ? 'i' : 'o'} —
            i dati gratuiti dell'API non coprono abbastanza{' '}
            {[...new Set(missingSlots.map(s => ROLE_LABEL[s.role]))].join(', ')}.
            Prova ad abilitare più campionati o aumenta l'età max.
          </span>
        </div>
      )}

      {/* Reserves */}
      {(Object.keys(STARTERS) as Role[]).some(r => formation.reserves[r]) && (
        <div>
          <h3 className="font-[Oswald] text-white/50 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>Riserve</span>
            <div className="flex-1 h-px bg-white/10" />
            <span>1 per ruolo</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(STARTERS) as Role[]).map(role => {
              const reserve = formation.reserves[role];
              return reserve
                ? <ReserveCard key={role} player={reserve} role={role} />
                : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
