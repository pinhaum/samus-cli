import type { DungeonMap } from '../types';

export function exportMarkdown(map: DungeonMap, rooms: string[]): string {
  const lines: string[] = [
    `# Dungeon Map — ${map.errorType}`,
    '',
    `**Boss:** ${map.boss.icon} ${map.boss.name}  `,
    `**Threat Level:** ${map.threatLevel}%  `,
    `**Error:** \`${map.errorType}: ${map.errorMessage}\``,
    '',
    '---',
    '',
  ];

  map.rooms.forEach((room, i) => {
    const label = room.isBossRoom
      ? `## 👹 Boss Room — ${map.boss.name}`
      : `## Room ${i + 1} — ${room.frame.functionName}`;
    lines.push(label, '');
    lines.push('```');
    lines.push(rooms[i]);
    lines.push('```', '');
  });

  return lines.join('\n');
}
