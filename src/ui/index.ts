import blessed from 'blessed';
import * as fs from 'fs';
import * as tty from 'tty';
import type { DungeonMap } from '../types';
import { buildMinimap, buildThreatBar, buildDetailLines } from './helpers';

export function launchUI(map: DungeonMap, roomStrings: string[]): void {
  // When stdin is a pipe (data was read from it), reopen /dev/tty for keyboard input
  let input: NodeJS.ReadableStream = process.stdin;
  if (!process.stdin.isTTY) {
    const fd = fs.openSync('/dev/tty', 'r+');
    input = new tty.ReadStream(fd);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const screen = blessed.screen({ smartCSR: true, title: 'samus-cli', input: input as any, output: process.stdout });

  let currentIndex = 0;
  const visited = new Set<number>([0]);

  // ── layout constants ────────────────────────────────────────────────────────
  const MINIMAP_W = 22;
  const FOOTER_H = 3;
  const MAIN_W = screen.width as number - MINIMAP_W - 1;

  // ── widgets ─────────────────────────────────────────────────────────────────
  const mainBox = blessed.box({
    top: 0, left: 0,
    width: MAIN_W, height: `100%-${FOOTER_H}`,
    scrollable: true, alwaysScroll: true,
    keys: false, mouse: false,
    border: { type: 'line' },
    label: ' samus-cli ',
    style: { border: { fg: 'cyan' }, label: { fg: 'cyan', bold: true } },
    content: '',
  });

  const minimapBox = blessed.box({
    top: 0, right: 0,
    width: MINIMAP_W, height: 'shrink',
    border: { type: 'line' },
    label: ' map ',
    style: { border: { fg: 'yellow' }, label: { fg: 'yellow' } },
    content: '',
  });

  const footerBox = blessed.box({
    bottom: 0, left: 0,
    width: '100%', height: FOOTER_H,
    border: { type: 'line' },
    label: ' threat level ',
    style: { border: { fg: 'red' }, label: { fg: 'red' } },
    content: '',
  });

  const detailBox = blessed.box({
    top: 'center', left: 'center',
    width: 44, height: 9,
    border: { type: 'line' },
    label: ' room details ',
    style: { border: { fg: 'green' }, label: { fg: 'green' }, bg: 'black' },
    hidden: true,
    content: '',
  });

  screen.append(mainBox);
  screen.append(minimapBox);
  screen.append(footerBox);
  screen.append(detailBox);

  // ── render helpers ──────────────────────────────────────────────────────────
  function refresh() {
    mainBox.setContent(roomStrings[currentIndex]);
    minimapBox.setContent(buildMinimap(map.rooms, currentIndex, visited));
    footerBox.setContent(`Threat Level: ${buildThreatBar(map.threatLevel)}`);
    screen.render();
  }

  function openDetail() {
    const room = map.rooms[currentIndex];
    detailBox.setContent(buildDetailLines(room, map).join('\n'));
    detailBox.show();
    screen.render();
  }

  function closeDetail() {
    detailBox.hide();
    screen.render();
  }

  // ── navigation ──────────────────────────────────────────────────────────────
  screen.key(['up', 'k'], () => {
    if (detailBox.hidden === false) return;
    if (currentIndex > 0) {
      currentIndex--;
      visited.add(currentIndex);
      refresh();
    }
  });

  screen.key(['down', 'j'], () => {
    if (detailBox.hidden === false) return;
    if (currentIndex < map.rooms.length - 1) {
      currentIndex++;
      visited.add(currentIndex);
      refresh();
    }
  });

  screen.key(['enter'], () => {
    if (detailBox.hidden === false) {
      closeDetail();
    } else {
      openDetail();
    }
  });

  screen.key(['escape', 'q'], () => {
    if (detailBox.hidden === false) {
      closeDetail();
    } else {
      process.exit(0);
    }
  });

  refresh();
}
