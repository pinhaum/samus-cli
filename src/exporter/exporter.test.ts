import { exportMarkdown } from './index';
import type { DungeonMap, DungeonRoom } from '../types';

const makeRoom = (overrides: Partial<DungeonRoom> = {}): DungeonRoom => ({
  frame: { functionName: 'UserService.findUser', file: 'user.service.ts', line: 42, isAnonymous: false },
  biome: 'cave',
  layout: 'square',
  isBossRoom: false,
  ...overrides,
});

const map: DungeonMap = {
  rooms: [
    makeRoom(),
    makeRoom({ isBossRoom: true }),
  ],
  boss: { name: 'Shape Shifter', icon: '👾' },
  threatLevel: 45,
  errorType: 'TypeError',
  errorMessage: 'Cannot read properties of undefined',
};

const roomStrings = ['ASCII_ROOM_1', 'ASCII_BOSS_ROOM'];

describe('exportMarkdown', () => {
  test('contém o errorType no cabeçalho', () => {
    expect(exportMarkdown(map, roomStrings)).toContain('TypeError');
  });

  test('contém nome e ícone do boss', () => {
    const md = exportMarkdown(map, roomStrings);
    expect(md).toContain('Shape Shifter');
    expect(md).toContain('👾');
  });

  test('contém threat level', () => {
    expect(exportMarkdown(map, roomStrings)).toContain('45');
  });

  test('contém o ASCII de cada sala em bloco de código', () => {
    const md = exportMarkdown(map, roomStrings);
    expect(md).toContain('ASCII_ROOM_1');
    expect(md).toContain('ASCII_BOSS_ROOM');
  });

  test('salas estão em blocos de código markdown', () => {
    expect(exportMarkdown(map, roomStrings)).toContain('```');
  });

  test('boss room tem label especial', () => {
    expect(exportMarkdown(map, roomStrings)).toContain('Boss Room');
  });

  test('retorna string não vazia', () => {
    const md = exportMarkdown(map, roomStrings);
    expect(typeof md).toBe('string');
    expect(md.length).toBeGreaterThan(0);
  });
});
