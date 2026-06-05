import { parse } from './index';

const SAMPLE = `TypeError: Cannot read properties of undefined (reading 'token')
    at AuthController.login (/app/src/auth/auth.controller.ts:18:23)
    at UserService.findUser (/app/src/user/user.service.ts:42:5)
    at CacheManager.get (/app/src/cache/cache.manager.ts:11:18)
    at Object.<anonymous> (/app/src/api/routes.ts:7:3)
    at <anonymous>:1:1
    at node:internal/modules/cjs/loader:1234:14`;

describe('parse', () => {
  test('extrai errorType e errorMessage da primeira linha', () => {
    const result = parse(SAMPLE);
    expect(result.errorType).toBe('TypeError');
    expect(result.errorMessage).toBe("Cannot read properties of undefined (reading 'token')");
  });

  test('produz um frame por linha "at"', () => {
    const result = parse(SAMPLE);
    expect(result.frames).toHaveLength(6);
  });

  test('frame normal extrai functionName, file, line, column', () => {
    const result = parse(SAMPLE);
    const frame = result.frames[0];
    expect(frame.functionName).toBe('AuthController.login');
    expect(frame.file).toBe('auth.controller.ts');
    expect(frame.line).toBe(18);
    expect(frame.column).toBe(23);
    expect(frame.isAnonymous).toBe(false);
  });

  test('infere directory do primeiro segmento após src/', () => {
    const result = parse(SAMPLE);
    expect(result.frames[0].directory).toBe('auth');
    expect(result.frames[1].directory).toBe('user');
    expect(result.frames[2].directory).toBe('cache');
  });

  test('frame com <anonymous> recebe isAnonymous true', () => {
    const result = parse(SAMPLE);
    const anon = result.frames[4];
    expect(anon.isAnonymous).toBe(true);
  });

  test('frame com prefixo node: recebe isAnonymous true', () => {
    const result = parse(SAMPLE);
    const internal = result.frames[5];
    expect(internal.isAnonymous).toBe(true);
  });

  test('stack malformada sem frames válidos lança erro amigável', () => {
    expect(() => parse('TypeError: algo deu errado\n    at isso não é um frame')).toThrow(
      'Nenhum frame válido encontrado na stack trace.'
    );
  });

  test('stack sem linha de exceção lança erro amigável', () => {
    expect(() => parse('    at foo (/app/src/foo.ts:1:1)')).toThrow(
      'Formato de stack trace inválido.'
    );
  });
});
