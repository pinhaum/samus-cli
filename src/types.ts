export interface ParsedFrame {
  functionName: string;
  file: string;
  line: number;
  column?: number;
  directory?: string;
  isAnonymous: boolean;
}

export interface ParsedStack {
  errorType: string;
  errorMessage: string;
  frames: ParsedFrame[];
}

export type Biome =
  | 'castle'
  | 'cave'
  | 'fortress'
  | 'sewer'
  | 'lab'
  | 'mine'
  | 'volcano'
  | 'forest';

export type RoomLayout = 'corridor' | 'L' | 'T' | 'square';

export interface Treasure {
  icon: string;
  name: string;
}

export interface DungeonRoom {
  frame: ParsedFrame;
  biome: Biome;
  layout: RoomLayout;
  treasure?: Treasure;
  isBossRoom: boolean;
}

export interface Boss {
  name: string;
  icon: string;
}

export interface DungeonMap {
  rooms: DungeonRoom[];
  boss: Boss;
  threatLevel: number;
  errorType: string;
  errorMessage: string;
}
