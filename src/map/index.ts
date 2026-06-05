import type { ParsedStack, DungeonMap, DungeonRoom, Biome, RoomLayout, Treasure } from '../types';
import { resolveBoss } from '../bosses';
import { clamp } from '../utils';

const BIOME_MAP: Record<string, Biome> = {
  auth: 'castle',
  user: 'cave',
  api: 'fortress',
  database: 'sewer',
  db: 'sewer',
  cache: 'lab',
  queue: 'mine',
  payments: 'volcano',
  payment: 'volcano',
};

const LAYOUTS: RoomLayout[] = ['corridor', 'L', 'T', 'square'];

export function buildMap(stack: ParsedStack): DungeonMap {
  const boss = resolveBoss(stack.errorType);
  const threatLevel = calcThreatLevel(stack);

  // frames[0] is innermost (boss room) — place it last in rooms[]
  const reversed = [...stack.frames].reverse();

  const rooms: DungeonRoom[] = reversed.map((frame, i) => {
    const isBossRoom = i === reversed.length - 1;
    const biome = resolveBiome(frame.directory);
    const layout: RoomLayout = isBossRoom ? 'square' : deterministicLayout(frame.file, frame.line);
    const treasure = isBossRoom || frame.isAnonymous ? undefined : detectTreasure(frame.functionName, frame.file);

    return { frame, biome, layout, treasure, isBossRoom };
  });

  return { rooms, boss, threatLevel, errorType: stack.errorType, errorMessage: stack.errorMessage };
}

function resolveBiome(directory?: string): Biome {
  if (!directory) return 'forest';
  return BIOME_MAP[directory] ?? 'forest';
}

function deterministicLayout(file: string, line: number): RoomLayout {
  let hash = 0;
  const key = `${file}:${line}`;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash * 31) + key.charCodeAt(i)) >>> 0;
  }
  return LAYOUTS[hash % LAYOUTS.length];
}

function detectTreasure(functionName: string, file: string): Treasure | undefined {
  const fn = functionName.toLowerCase();
  if (fn.includes('cache') || fn.includes('memo')) return { icon: '💎', name: 'Cache Hit' };
  if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) return { icon: '⚔', name: 'Test Coverage' };
  if (file.endsWith('.docs.ts') || file.includes('/docs/')) return { icon: '📜', name: 'Documentation Found' };
  return undefined;
}

function calcThreatLevel(stack: ParsedStack): number {
  const frameScore = Math.min(stack.frames.length * 5, 50);
  const exceptionScore = calcExceptionScore(stack.errorType);
  const repetitionScore = calcRepetitionScore(stack);
  const recursionScore = calcRecursionScore(stack);
  return clamp(frameScore + exceptionScore + repetitionScore + recursionScore, 0, 100);
}

function calcExceptionScore(errorType: string): number {
  if (errorType === 'StackOverflowError' || errorType === 'OutOfMemoryError') return 30;
  if (errorType === 'TypeError' || errorType === 'ReferenceError') return 15;
  return 5;
}

function calcRepetitionScore(stack: ParsedStack): number {
  const fnCounts: Record<string, number> = {};
  for (const f of stack.frames) fnCounts[f.functionName] = (fnCounts[f.functionName] ?? 0) + 1;
  const recursiveFns = new Set(Object.keys(fnCounts).filter(fn => fnCounts[fn] >= 3));

  const fileCounts: Record<string, number> = {};
  for (const f of stack.frames) {
    if (!recursiveFns.has(f.functionName)) {
      fileCounts[f.file] = (fileCounts[f.file] ?? 0) + 1;
    }
  }
  const repetitions = Object.values(fileCounts).reduce((sum, n) => sum + Math.max(n - 1, 0), 0);
  return Math.min(repetitions * 5, 20);
}

function calcRecursionScore(stack: ParsedStack): number {
  const counts: Record<string, number> = {};
  for (const f of stack.frames) counts[f.functionName] = (counts[f.functionName] ?? 0) + 1;
  return Object.values(counts).some(n => n >= 3) ? 20 : 0;
}
