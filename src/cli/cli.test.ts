import { spawnSync } from 'child_process';
import path from 'path';

const CLI = path.resolve(__dirname, '../../src/cli/index.ts');
const TSNODE = path.resolve(__dirname, '../../node_modules/.bin/ts-node');
const CWD = path.resolve(__dirname, '../..');

function run(args: string[], input?: string) {
  return spawnSync(TSNODE, [CLI, ...args], {
    encoding: 'utf-8',
    cwd: CWD,
    input,
    timeout: 10_000,
  });
}

describe('CLI', () => {
  test('arquivo inexistente → exit 1 com mensagem amigável', () => {
    const result = run(['fixtures/nao-existe.log']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Erro: arquivo não encontrado');
  });

  test('input vazio via stdin → exit 1 com mensagem amigável', () => {
    const result = run([], '');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Erro: nenhum input recebido');
  });

  test('stack trace malformada → exit 1 com mensagem amigável', () => {
    const result = run([], 'isso não é uma stack trace válida\nsem frames');
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Erro:/);
  });
});
