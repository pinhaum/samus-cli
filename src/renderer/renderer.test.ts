import { render } from './index';
import type { DungeonMap, DungeonRoom } from '../types';

const makeRoom = (overrides: Partial<DungeonRoom> = {}): DungeonRoom => ({
  frame: { functionName: 'UserService.findUser', file: 'user.service.ts', line: 42, column: 5, directory: 'user', isAnonymous: false },
  biome: 'cave',
  layout: 'square',
  isBossRoom: false,
  ...overrides,
});

const makeMap = (rooms: DungeonRoom[]): DungeonMap => ({
  rooms,
  boss: { name: 'Shape Shifter', icon: '👾' },
  threatLevel: 45,
  errorType: 'TypeError',
  errorMessage: "Cannot read properties of undefined (reading 'token')",
});

describe('render', () => {
  test('retorna um elemento por room', () => {
    const map = makeMap([makeRoom(), makeRoom(), makeRoom({ isBossRoom: true })]);
    expect(render(map)).toHaveLength(3);
  });

  test('cada linha de cada room cabe em 80 colunas', () => {
    const rooms = [
      makeRoom({ layout: 'corridor' }),
      makeRoom({ layout: 'L' }),
      makeRoom({ layout: 'T' }),
      makeRoom({ layout: 'square' }),
      makeRoom({ isBossRoom: true }),
    ];
    const map = makeMap(rooms);
    render(map).forEach(roomStr => {
      roomStr.split('\n').forEach(line => {
        expect(line.replace(/\p{Emoji}/gu, ' ').length).toBeLessThanOrEqual(80);
      });
    });
  });

  describe('room normal (square)', () => {
    test('exibe nome do bioma', () => {
      const output = render(makeMap([makeRoom({ biome: 'cave' })]))[0];
      expect(output).toContain('USER CAVE');
    });

    test('exibe ícone do bioma', () => {
      const output = render(makeMap([makeRoom({ biome: 'cave' })]))[0];
      expect(output).toContain('🕳');
    });

    test('exibe functionName', () => {
      const output = render(makeMap([makeRoom()]))[0];
      expect(output).toContain('UserService.findUser');
    });

    test('exibe file:line', () => {
      const output = render(makeMap([makeRoom()]))[0];
      expect(output).toContain('user.service.ts:42');
    });

    test('exibe tesouro quando presente', () => {
      const room = makeRoom({ treasure: { icon: '💎', name: 'Cache Hit' } });
      const output = render(makeMap([room]))[0];
      expect(output).toContain('💎');
      expect(output).toContain('Cache Hit');
    });

    test('não exibe tesouro quando ausente', () => {
      const output = render(makeMap([makeRoom()]))[0];
      expect(output).not.toContain('💎');
    });
  });

  describe('room anônima', () => {
    test('exibe "Unknown Room"', () => {
      const room = makeRoom({
        frame: { functionName: '<anonymous>', file: '<anonymous>', line: 1, isAnonymous: true },
        biome: 'forest',
      });
      const output = render(makeMap([room]))[0];
      expect(output).toContain('Unknown Room');
    });

    test('não exibe bioma de frame anônimo', () => {
      const room = makeRoom({
        frame: { functionName: '<anonymous>', file: '<anonymous>', line: 1, isAnonymous: true },
        biome: 'forest',
      });
      const output = render(makeMap([room]))[0];
      expect(output).not.toContain('FOREST');
    });
  });

  describe('boss room', () => {
    test('exibe nome e ícone do boss', () => {
      const room = makeRoom({ isBossRoom: true, layout: 'square' });
      const map = makeMap([room]);
      const output = render(map)[0];
      expect(output).toContain('Shape Shifter');
      expect(output).toContain('👾');
    });

    test('exibe errorType', () => {
      const room = makeRoom({ isBossRoom: true });
      const output = render(makeMap([room]))[0];
      expect(output).toContain('TypeError');
    });

    test('exibe errorMessage', () => {
      const room = makeRoom({ isBossRoom: true });
      const output = render(makeMap([room]))[0];
      expect(output).toContain("Cannot read properties of undefined");
    });

    test('exibe file e line do frame', () => {
      const room = makeRoom({ isBossRoom: true });
      const output = render(makeMap([room]))[0];
      expect(output).toContain('user.service.ts');
      expect(output).toContain('42');
    });

    test('não exibe tesouro mesmo se room tivesse um', () => {
      const room = makeRoom({ isBossRoom: true, treasure: { icon: '💎', name: 'Cache Hit' } });
      const output = render(makeMap([room]))[0];
      expect(output).not.toContain('Cache Hit');
    });
  });

  describe('layouts', () => {
    test('corridor tem menos linhas que square', () => {
      const corridor = render(makeMap([makeRoom({ layout: 'corridor' })]))[0];
      const square = render(makeMap([makeRoom({ layout: 'square' })]))[0];
      expect(corridor.split('\n').length).toBeLessThan(square.split('\n').length);
    });

    test('L e T são multi-linha', () => {
      const l = render(makeMap([makeRoom({ layout: 'L' })]))[0];
      const t = render(makeMap([makeRoom({ layout: 'T' })]))[0];
      expect(l.split('\n').length).toBeGreaterThan(1);
      expect(t.split('\n').length).toBeGreaterThan(1);
    });
  });
});
