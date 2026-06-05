import type { DungeonRoom, DungeonMap } from '../types';
import { BIOMES } from '../themes';

const BAR_WIDTH = 20;
const MINIMAP_COLS = 15;

export function buildThreatBar(level: number): string {
  const filled = Math.round((level / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${level}%`;
}

export function buildMinimap(
  rooms: DungeonRoom[],
  currentIndex: number,
  visited: Set<number>,
): string {
  const cells = rooms.map((room, i) => {
    if (i === currentIndex) return '@';
    if (room.isBossRoom) return 'X';
    if (visited.has(i)) return '■';
    return '□';
  });

  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += MINIMAP_COLS) {
    rows.push(cells.slice(i, i + MINIMAP_COLS).join(''));
  }

  const innerW = Math.min(MINIMAP_COLS, rooms.length);
  const top = `┌${'─'.repeat(innerW + 2)}┐`;
  const bottom = `└${'─'.repeat(innerW + 2)}┘`;
  const body = rows.map(r => `│ ${r.padEnd(innerW)} │`);

  return [top, ...body, bottom].join('\n');
}

export function buildDetailLines(room: DungeonRoom, _map: DungeonMap): string[] {
  const theme = BIOMES[room.biome];
  const treasure = room.treasure ? `${room.treasure.icon} ${room.treasure.name}` : '—';

  return [
    `Function: ${room.frame.functionName}`,
    `File:     ${room.frame.file}`,
    `Line:     ${room.frame.line}`,
    `Biome:    ${theme.icon} ${theme.name}`,
    `Treasure: ${treasure}`,
  ];
}
