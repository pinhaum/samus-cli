import type { Boss } from '../types';

const BOSS_MAP: Record<string, Boss> = {
  NullPointerException:
    { name: 'Ghost of Nothingness', icon: '💀' },
  OutOfMemoryError:
    { name: 'Memory Eater', icon: '🧠' },
  ReferenceError:
    { name: 'The Forgotten One', icon: '👻' },
  StackOverflowError:
    { name: 'Infinite Hydra', icon: '🐉' },
  TimeoutError:
    { name: 'Ancient Clockkeeper', icon: '⏳' },
  TypeError:
    { name: 'Shape Shifter', icon: '👾' },
};

const UNKNOWN_BOSS: Boss = { name: 'Unknown Evil', icon: '👹' };

export function resolveBoss(errorType: string): Boss {
  return BOSS_MAP[errorType] ?? UNKNOWN_BOSS;
}
