import { buildMinimap, buildThreatBar, buildDetailLines } from './helpers';
import type { DungeonRoom, DungeonMap } from '../types';

const makeRoom = (overrides: Partial<DungeonRoom> = {}): DungeonRoom => ({
  frame: { functionName: 'fn', file: 'f.ts', line: 1, isAnonymous: false },
  biome: 'forest',
  layout: 'square',
  isBossRoom: false,
  ...overrides,
});

const makeMap = (rooms: DungeonRoom[]): DungeonMap => ({
  rooms,
  boss: { name: 'Shape Shifter', icon: '👾' },
  threatLevel: 60,
  errorType: 'TypeError',
  errorMessage: "Cannot read properties of undefined",
});

// ─── buildThreatBar ────────────────────────────────────────────────────────────

describe('buildThreatBar', () => {
  test('60% preenche 12 de 20 blocos', () => {
    const bar = buildThreatBar(60);
    const filled = (bar.match(/█/g) ?? []).length;
    const empty = (bar.match(/░/g) ?? []).length;
    expect(filled).toBe(12);
    expect(empty).toBe(8);
  });

  test('0% → todos os blocos vazios', () => {
    const bar = buildThreatBar(0);
    expect(bar).not.toContain('█');
    expect((bar.match(/░/g) ?? []).length).toBe(20);
  });

  test('100% → todos os blocos preenchidos', () => {
    const bar = buildThreatBar(100);
    expect(bar).not.toContain('░');
    expect((bar.match(/█/g) ?? []).length).toBe(20);
  });

  test('exibe percentual no final', () => {
    expect(buildThreatBar(60)).toContain('60%');
    expect(buildThreatBar(0)).toContain('0%');
    expect(buildThreatBar(100)).toContain('100%');
  });
});

// ─── buildMinimap ──────────────────────────────────────────────────────────────

describe('buildMinimap', () => {
  const rooms = [
    makeRoom(),
    makeRoom(),
    makeRoom({ isBossRoom: true }),
  ];

  test('sala atual marcada com @', () => {
    const map = buildMinimap(rooms, 1, new Set([0]));
    expect(map).toContain('@');
  });

  test('boss room marcada com X', () => {
    const map = buildMinimap(rooms, 0, new Set());
    expect(map).toContain('X');
  });

  test('sala visitada marcada com ■', () => {
    const map = buildMinimap(rooms, 1, new Set([0]));
    expect(map).toContain('■');
  });

  test('sala não visitada marcada com □', () => {
    const map = buildMinimap(rooms, 0, new Set([0]));
    expect(map).toContain('□');
  });

  test('tem borda', () => {
    const map = buildMinimap(rooms, 0, new Set());
    expect(map).toContain('┌');
    expect(map).toContain('┘');
  });
});

// ─── buildDetailLines ──────────────────────────────────────────────────────────

describe('buildDetailLines', () => {
  const room = makeRoom({
    frame: { functionName: 'AuthController.login', file: 'auth.controller.ts', line: 18, directory: 'auth', isAnonymous: false },
    biome: 'castle',
    treasure: { icon: '💎', name: 'Cache Hit' },
  });

  test('inclui functionName', () => {
    const lines = buildDetailLines(room, makeMap([room]));
    expect(lines.join('\n')).toContain('AuthController.login');
  });

  test('inclui file', () => {
    const lines = buildDetailLines(room, makeMap([room]));
    expect(lines.join('\n')).toContain('auth.controller.ts');
  });

  test('inclui line number', () => {
    const lines = buildDetailLines(room, makeMap([room]));
    expect(lines.join('\n')).toContain('18');
  });

  test('inclui nome do bioma', () => {
    const lines = buildDetailLines(room, makeMap([room]));
    expect(lines.join('\n')).toContain('AUTH CASTLE');
  });

  test('inclui tesouro quando presente', () => {
    const lines = buildDetailLines(room, makeMap([room]));
    expect(lines.join('\n')).toContain('Cache Hit');
  });

  test('exibe traço quando sem tesouro', () => {
    const noTreasure = makeRoom({ frame: { functionName: 'fn', file: 'f.ts', line: 1, isAnonymous: false }, biome: 'forest' });
    const lines = buildDetailLines(noTreasure, makeMap([noTreasure]));
    expect(lines.join('\n')).toContain('—');
  });
});
