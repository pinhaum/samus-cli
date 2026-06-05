#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { parse } from '../parser';
import { buildMap } from '../map';
import { render } from '../renderer';
import { launchUI } from '../ui';
import { type ThemeName } from '../themes/visual';

const program = new Command();

program
  .name('samus-cli')
  .description('Transforms stack traces into navigable Metroid-style ASCII dungeons')
  .version('0.1.0')
  .argument('[file]', 'Stack trace file (omit to read from stdin)')
  .option('-t, --theme <name>', 'visual theme: dark | retro | neon', 'dark')
  .action(async (file: string | undefined, options: { theme: string }) => {
    let input: string;

    if (file) {
      try {
        input = readFileSync(file, 'utf-8');
      } catch {
        console.error(`Erro: arquivo não encontrado — ${file}`);
        process.exit(1);
      }
    } else {
      input = await readStdin();
    }

    if (!input.trim()) {
      console.error('Erro: nenhum input recebido.');
      process.exit(1);
    }

    const themeName = (['dark', 'retro', 'neon'].includes(options.theme)
      ? options.theme
      : 'dark') as ThemeName;

    try {
      const stack = parse(input);
      const map = buildMap(stack);
      const rooms = render(map);
      launchUI(map, rooms, themeName);
    } catch (err) {
      console.error(`Erro: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

program.parse();
