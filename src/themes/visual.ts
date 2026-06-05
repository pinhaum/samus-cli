export type ThemeName = 'dark' | 'retro' | 'neon';

export interface VisualTheme {
  main: string;
  minimap: string;
  footer: string;
  detail: string;
  label: string;
}

export const THEMES: Record<ThemeName, VisualTheme> = {
  dark: {
    main: 'cyan',
    minimap: 'yellow',
    footer: 'red',
    detail: 'green',
    label: 'white',
  },
  retro: {
    main: 'green',
    minimap: 'green',
    footer: 'green',
    detail: 'green',
    label: 'green',
  },
  neon: {
    main: 'magenta',
    minimap: 'yellow',
    footer: 'magenta',
    detail: 'yellow',
    label: 'white',
  },
};

export const DEFAULT_THEME: ThemeName = 'dark';
