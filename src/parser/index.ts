import type { ParsedStack, ParsedFrame } from '../types';

const EXCEPTION_RE = /^(\w+(?:\.\w+)*Error|\w+Exception|\w+Error): (.+)$/;
const FRAME_RE = /^\s+at (.+) \((.+):(\d+):(\d+)\)$|^\s+at (.+):(\d+):(\d+)$/;

export function parse(input: string): ParsedStack {
  const lines = input.trim().split('\n');

  const match = EXCEPTION_RE.exec(lines[0]);
  if (!match) throw new Error('Formato de stack trace inválido.');

  const [, errorType, errorMessage] = match;

  const frames: ParsedFrame[] = [];
  for (let i = 1; i < lines.length; i++) {
    const frame = parseFrame(lines[i]);
    if (frame) frames.push(frame);
  }

  if (frames.length === 0) throw new Error('Nenhum frame válido encontrado na stack trace.');

  return { errorType, errorMessage, frames };
}

function parseFrame(line: string): ParsedFrame | null {
  const m = FRAME_RE.exec(line);
  if (!m) return null;

  const isLocationOnly = m[5] !== undefined;

  if (isLocationOnly) {
    const location = m[5];
    const lineNum = parseInt(m[6], 10);
    const col = parseInt(m[7], 10);
    const isAnon = location === '<anonymous>' || location.startsWith('node:');
    return {
      functionName: '<anonymous>',
      file: isAnon ? location : extractFile(location),
      line: lineNum,
      column: col,
      directory: isAnon ? undefined : inferDirectory(location),
      isAnonymous: true,
    };
  }

  const funcName = m[1];
  const fullPath = m[2];
  const lineNum = parseInt(m[3], 10);
  const col = parseInt(m[4], 10);

  const pathIsReal = !fullPath.startsWith('node:') && fullPath !== '<anonymous>';
  const funcIsLiteralAnon = funcName === '<anonymous>';
  const funcHasAnonSuffix = funcName.includes('<anonymous>') && !funcIsLiteralAnon;

  const isAnon = funcIsLiteralAnon || !pathIsReal;

  // "Object.<anonymous>" with real path → normalize to "Object"
  const normalizedFunc = (funcHasAnonSuffix && pathIsReal)
    ? funcName.replace(/\.<anonymous>.*/, '')
    : funcName;

  return {
    functionName: isAnon ? '<anonymous>' : normalizedFunc,
    file: isAnon ? fullPath : extractFile(fullPath),
    line: lineNum,
    column: col,
    directory: isAnon ? undefined : inferDirectory(fullPath),
    isAnonymous: isAnon,
  };
}

function extractFile(fullPath: string): string {
  return fullPath.split('/').pop() ?? fullPath;
}

function inferDirectory(fullPath: string): string | undefined {
  const srcIdx = fullPath.indexOf('/src/');
  if (srcIdx !== -1) {
    const afterSrc = fullPath.slice(srcIdx + 5);
    const segment = afterSrc.split('/')[0];
    return segment || undefined;
  }
  const parts = fullPath.split('/');
  return parts.length > 1 ? parts[parts.length - 2] : undefined;
}
