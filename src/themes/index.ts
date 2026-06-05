import type { Biome } from '../types';

export interface BiomeTheme {
  name: string;
  icon: string;
}

export const BIOMES: Record<Biome, BiomeTheme> = {
  castle:  { name: 'AUTH CASTLE',   icon: '🏰' },
  cave:    { name: 'USER CAVE',     icon: '🕳' },
  fortress:{ name: 'API FORTRESS',  icon: '🛡' },
  sewer:   { name: 'DB SEWER',      icon: '🚧' },
  lab:     { name: 'CACHE LAB',     icon: '🧪' },
  mine:    { name: 'QUEUE MINE',    icon: '⛏' },
  volcano: { name: 'PAYMENT VOLCANO', icon: '🌋' },
  forest:  { name: 'FOREST',        icon: '🌲' },
};
