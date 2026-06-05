#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { parse } from '../parser';
import { buildMap } from '../map';
import { render } from '../renderer';
import { launchUI } from '../ui';
import { exportMarkdown } from '../exporter';
import { THEMES, type ThemeName } from '../themes/visual';

const program = new Command();

program
  .name('samus-cli')
  .description('Transforms stack traces into navigable Metroid-style ASCII dungeons')
  .version('0.1.0')
  .argument('[file]', 'Stack trace file (omit to read from stdin)')
  .option('-t, --theme <name>', 'visual theme: dark | retro | neon', 'dark')
  .option('-e, --export <format>', 'export format: markdown')
  .option('-o, --output <file>', 'output file path (default: stdout)')
  .action(async (file: string | undefined, options: { theme: string; export?: string; output?: string }) => {
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

    const themeName = (options.theme in THEMES ? options.theme : 'dark') as ThemeName;

    try {
      const stack = parse(input);
      const map = buildMap(stack);
      const rooms = render(map);

      if (options.export === 'markdown') {
        const md = exportMarkdown(map, rooms);
        if (options.output) {
          writeFileSync(options.output, md, 'utf-8');
          console.log(`Exportado para ${options.output}`);
        } else {
          process.stdout.write(md);
        }
        return;
      }

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
