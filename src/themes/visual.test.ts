import { THEMES, DEFAULT_THEME, type ThemeName } from './visual';

const THEME_NAMES: ThemeName[] = ['dark', 'retro', 'neon'];
const REQUIRED_KEYS = ['main', 'minimap', 'footer', 'detail', 'label'] as const;

describe('THEMES', () => {
  test.each(THEME_NAMES)('tema "%s" tem todas as chaves obrigatórias', (name) => {
    const theme = THEMES[name];
    REQUIRED_KEYS.forEach(key => {
      expect(theme).toHaveProperty(key);
      expect(typeof theme[key]).toBe('string');
    });
  });

  test('DEFAULT_THEME é "dark"', () => {
    expect(DEFAULT_THEME).toBe('dark');
  });

  test('retro usa apenas verde em todas as chaves', () => {
    const t = THEMES.retro;
    REQUIRED_KEYS.forEach(key => expect(t[key]).toBe('green'));
  });

  test('dark e neon são diferentes entre si', () => {
    expect(THEMES.dark.main).not.toBe(THEMES.neon.main);
  });
});
