import { buildMap } from './index';
import type { ParsedStack } from '../types';

const makeStack = (overrides: Partial<ParsedStack> = {}): ParsedStack => ({
  errorType: 'TypeError',
  errorMessage: "Cannot read properties of undefined",
  frames: [
    { functionName: 'AuthController.login', file: 'auth.controller.ts', line: 18, column: 23, directory: 'auth', isAnonymous: false },
    { functionName: 'UserService.findUser', file: 'user.service.ts', line: 42, column: 5, directory: 'user', isAnonymous: false },
    { functionName: 'CacheManager.get', file: 'cache.manager.ts', line: 11, column: 18, directory: 'cache', isAnonymous: false },
  ],
  ...overrides,
});

describe('buildMap', () => {
  describe('rooms', () => {
    test('produz uma room por frame', () => {
      const map = buildMap(makeStack());
      expect(map.rooms).toHaveLength(3);
    });

    test('última room é a boss room (frame mais interno = frames[0])', () => {
      const map = buildMap(makeStack());
      expect(map.rooms[map.rooms.length - 1].isBossRoom).toBe(true);
      expect(map.rooms[0].isBossRoom).toBe(false);
    });

    test('boss room não tem tesouro', () => {
      const map = buildMap(makeStack());
      const boss = map.rooms[map.rooms.length - 1];
      expect(boss.treasure).toBeUndefined();
    });
  });

  describe('biomas', () => {
    test.each([
      ['auth', 'castle'],
      ['user', 'cave'],
      ['api', 'fortress'],
      ['database', 'sewer'],
      ['db', 'sewer'],
      ['cache', 'lab'],
      ['queue', 'mine'],
      ['payments', 'volcano'],
      ['payment', 'volcano'],
    ])('directory "%s" → bioma "%s"', (directory, expectedBiome) => {
      const stack = makeStack({
        frames: [{ functionName: 'fn', file: 'f.ts', line: 1, directory, isAnonymous: false }],
      });
      const map = buildMap(stack);
      expect(map.rooms[0].biome).toBe(expectedBiome);
    });

    test('directory sem match → bioma forest', () => {
      const stack = makeStack({
        frames: [{ functionName: 'fn', file: 'f.ts', line: 1, directory: 'desconhecido', isAnonymous: false }],
      });
      const map = buildMap(stack);
      expect(map.rooms[0].biome).toBe('forest');
    });

    test('frame anônimo → bioma forest', () => {
      const stack = makeStack({
        frames: [{ functionName: '<anonymous>', file: '<anonymous>', line: 1, isAnonymous: true }],
      });
      const map = buildMap(stack);
      expect(map.rooms[0].biome).toBe('forest');
    });
  });

  describe('layout', () => {
    test('boss room sempre usa layout square', () => {
      const map = buildMap(makeStack());
      const boss = map.rooms[map.rooms.length - 1];
      expect(boss.layout).toBe('square');
    });

    test('rooms normais têm layout válido', () => {
      const valid = ['corridor', 'L', 'T', 'square'];
      const map = buildMap(makeStack());
      map.rooms.slice(0, -1).forEach(room => {
        expect(valid).toContain(room.layout);
      });
    });
  });

  describe('tesouros', () => {
    test('functionName com "cache" → Cache Hit', () => {
      // frames[0]=boss (innermost), frames[1]=outermost → rooms[0]
      const stack = makeStack({
        frames: [
          { functionName: 'caller', file: 'other.ts', line: 2, directory: 'api', isAnonymous: false },
          { functionName: 'CacheManager.get', file: 'cache.ts', line: 1, directory: 'cache', isAnonymous: false },
        ],
      });
      const map = buildMap(stack);
      expect(map.rooms[0].treasure?.name).toBe('Cache Hit');
    });

    test('file .test.ts → Test Coverage', () => {
      const stack = makeStack({
        frames: [
          { functionName: 'caller', file: 'other.ts', line: 2, directory: 'api', isAnonymous: false },
          { functionName: 'describe', file: 'auth.test.ts', line: 1, directory: 'auth', isAnonymous: false },
        ],
      });
      const map = buildMap(stack);
      expect(map.rooms[0].treasure?.name).toBe('Test Coverage');
    });

    test('file .spec.ts → Test Coverage', () => {
      const stack = makeStack({
        frames: [
          { functionName: 'caller', file: 'other.ts', line: 2, directory: 'api', isAnonymous: false },
          { functionName: 'it', file: 'auth.spec.ts', line: 1, directory: 'auth', isAnonymous: false },
        ],
      });
      const map = buildMap(stack);
      expect(map.rooms[0].treasure?.name).toBe('Test Coverage');
    });

    test('frame anônimo nunca tem tesouro', () => {
      // rooms[0] = anônimo (outermost), rooms[1] = boss
      const stack = makeStack({
        frames: [
          { functionName: 'caller', file: 'other.ts', line: 2, directory: 'api', isAnonymous: false },
          { functionName: 'cacheResult', file: 'cache.ts', line: 1, isAnonymous: true },
        ],
      });
      const map = buildMap(stack);
      expect(map.rooms[0].treasure).toBeUndefined();
    });

    test('frame sem condição de tesouro não recebe tesouro', () => {
      const stack = makeStack({
        frames: [
          { functionName: 'caller', file: 'other.ts', line: 2, directory: 'api', isAnonymous: false },
          { functionName: 'normalFn', file: 'service.ts', line: 1, directory: 'api', isAnonymous: false },
        ],
      });
      const map = buildMap(stack);
      expect(map.rooms[0].treasure).toBeUndefined();
    });
  });

  describe('boss', () => {
    test.each([
      ['TypeError', 'Shape Shifter', '👾'],
      ['ReferenceError', 'The Forgotten One', '👻'],
      ['NullPointerException', 'Ghost of Nothingness', '💀'],
      ['StackOverflowError', 'Infinite Hydra', '🐉'],
      ['OutOfMemoryError', 'Memory Eater', '🧠'],
      ['TimeoutError', 'Ancient Clockkeeper', '⏳'],
      ['SomeRandomError', 'Unknown Evil', '👹'],
    ])('%s → boss "%s" com ícone "%s"', (errorType, name, icon) => {
      const map = buildMap(makeStack({ errorType }));
      expect(map.boss.name).toBe(name);
      expect(map.boss.icon).toBe(icon);
    });
  });

  describe('threatLevel', () => {
    test('clampado entre 0 e 100', () => {
      const manyFrames = Array.from({ length: 30 }, (_, i) => ({
        functionName: 'fn', file: 'f.ts', line: i, directory: 'api', isAnonymous: false,
      }));
      const map = buildMap(makeStack({ errorType: 'StackOverflowError', frames: manyFrames }));
      expect(map.threatLevel).toBeGreaterThanOrEqual(0);
      expect(map.threatLevel).toBeLessThanOrEqual(100);
    });

    test('recursão (mesma função 3+x) adiciona 20', () => {
      const stack: ParsedStack = {
        errorType: 'TypeError',
        errorMessage: 'err',
        frames: [
          { functionName: 'recurse', file: 'r.ts', line: 1, directory: 'api', isAnonymous: false },
          { functionName: 'recurse', file: 'r.ts', line: 1, directory: 'api', isAnonymous: false },
          { functionName: 'recurse', file: 'r.ts', line: 1, directory: 'api', isAnonymous: false },
          { functionName: 'caller', file: 'other.ts', line: 2, directory: 'user', isAnonymous: false },
        ],
      };
      // frameScore = 4*5=20, exceptionScore=15 (TypeError), repetitionScore=0, recursionScore=20 → 55
      const map = buildMap(stack);
      expect(map.threatLevel).toBe(55);
    });

    test('StackOverflowError adiciona 30 ao exceptionScore', () => {
      const stack: ParsedStack = {
        errorType: 'StackOverflowError',
        errorMessage: 'err',
        frames: [
          { functionName: 'fn', file: 'a.ts', line: 1, directory: 'api', isAnonymous: false },
          { functionName: 'fn2', file: 'b.ts', line: 2, directory: 'user', isAnonymous: false },
        ],
      };
      // frameScore=10, exceptionScore=30, repetitionScore=0, recursionScore=0 → 40
      const map = buildMap(stack);
      expect(map.threatLevel).toBe(40);
    });

    test('arquivos repetidos adicionam 5 por repetição', () => {
      const stack: ParsedStack = {
        errorType: 'SomeError',
        errorMessage: 'err',
        frames: [
          { functionName: 'fn1', file: 'a.ts', line: 1, directory: 'api', isAnonymous: false },
          { functionName: 'fn2', file: 'a.ts', line: 2, directory: 'api', isAnonymous: false },
          { functionName: 'fn3', file: 'a.ts', line: 3, directory: 'api', isAnonymous: false },
        ],
      };
      // frameScore=15, exceptionScore=5, repetitionScore=10 (2 repetições de a.ts), recursionScore=0 → 30
      const map = buildMap(stack);
      expect(map.threatLevel).toBe(30);
    });
  });
});
