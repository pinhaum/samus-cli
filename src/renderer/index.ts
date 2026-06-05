import type { DungeonMap, DungeonRoom } from '../types';
import { BIOMES } from '../themes';

const W = 78; // inner width (80 total with borders)

export function render(map: DungeonMap): string[] {
  return map.rooms.map(room => renderRoom(room, map));
}

function renderRoom(room: DungeonRoom, map: DungeonMap): string {
  if (room.isBossRoom) return renderBossRoom(room, map);
  if (room.frame.isAnonymous) return renderUnknownRoom(room);

  switch (room.layout) {
    case 'corridor': return renderCorridor(room);
    case 'L': return renderL(room);
    case 'T': return renderT(room);
    case 'square': return renderSquare(room);
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function pad(s: string, width: number): string {
  return s.slice(0, width).padEnd(width);
}

function row(content: string, width = W): string {
  return `│ ${pad(content, width - 2)} │`;
}

function top(width = W): string { return `┌${'─'.repeat(width)}┐`; }
function bottom(width = W): string { return `└${'─'.repeat(width)}┘`; }
function blank(width = W): string { return row('', width); }

function biomeHeader(room: DungeonRoom): string {
  const theme = BIOMES[room.biome];
  return `${theme.icon} ${theme.name}`;
}

function fileRef(room: DungeonRoom): string {
  return `${room.frame.file}:${room.frame.line}`;
}

// ─── layouts ──────────────────────────────────────────────────────────────────

function renderSquare(room: DungeonRoom): string {
  const lines = [
    top(),
    blank(),
    row(biomeHeader(room)),
    row(room.frame.functionName),
    row(fileRef(room)),
  ];
  if (room.treasure) lines.push(row(`${room.treasure.icon} ${room.treasure.name}`));
  lines.push(blank());
  lines.push(bottom());
  return lines.join('\n');
}

function renderCorridor(room: DungeonRoom): string {
  const theme = BIOMES[room.biome];
  const treasure = room.treasure ? `  ${room.treasure.icon} ${room.treasure.name}` : '';
  const inner = `${theme.icon} ${theme.name}  ·  ${room.frame.functionName}  ·  ${fileRef(room)}${treasure}`;
  return [top(), row(inner), bottom()].join('\n');
}

function renderL(room: DungeonRoom): string {
  const half = Math.floor(W / 2);      // 39
  const rest = W - half - 2;           // 37 (right extension)

  const lines = [
    `┌${'─'.repeat(half)}┐`,
    `│ ${pad(biomeHeader(room), half - 2)} │`,
    `│ ${pad(room.frame.functionName, half - 2)} │`,
    `│ ${pad(fileRef(room), half - 2)} │`,
    `└${'─'.repeat(half - rest - 2)}┐${' '.repeat(rest)} │`,
    `${' '.repeat(half - rest - 1)}└${'─'.repeat(rest + 1)}┘`,
  ];
  if (room.treasure) {
    lines.splice(4, 0, `│ ${pad(`${room.treasure.icon} ${room.treasure.name}`, half - 2)} │`);
  }
  return lines.join('\n');
}

function renderT(room: DungeonRoom): string {
  const tabW = 16;
  const tabOffset = Math.floor((W - tabW) / 2);
  const leftW = tabOffset - 1;
  const rightW = W - tabOffset - tabW - 1;

  const lines = [
    `${' '.repeat(tabOffset)}┌${'─'.repeat(tabW)}┐`,
    `┌${'─'.repeat(leftW)}┘${' '.repeat(tabW)}└${'─'.repeat(rightW)}┐`,
    row(biomeHeader(room)),
    row(room.frame.functionName),
    row(fileRef(room)),
  ];
  if (room.treasure) lines.push(row(`${room.treasure.icon} ${room.treasure.name}`));
  lines.push(bottom());
  return lines.join('\n');
}

// ─── special rooms ────────────────────────────────────────────────────────────

function renderUnknownRoom(room: DungeonRoom): string {
  return [
    top(),
    blank(),
    row('??? Unknown Room ???'),
    row(fileRef(room)),
    blank(),
    bottom(),
  ].join('\n');
}

function renderBossRoom(room: DungeonRoom, map: DungeonMap): string {
  const msg = map.errorMessage.slice(0, W - 4);
  return [
    top(),
    blank(),
    row(`${map.boss.icon}  BOSS: ${map.boss.name}`),
    blank(),
    row(`${map.errorType}: ${msg}`),
    row(fileRef(room)),
    blank(),
    bottom(),
  ].join('\n');
}
