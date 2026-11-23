/**
 * Supabase Design Kit (v1) UI Tokens for Ilm Studio
 * Source: .claude/skills/livery-supabase-com/tokens.json & rules.md
 */

export const SUPABASE_THEME = {
  colors: {
    accent: '#0e7e4e',
    accentLight: '#3ecf8e',
    dark: {
      bg: '#121212',
      surface: '#181818',
      surfaceElevated: '#202020',
      surfaceHover: '#282828',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.16)',
      text: '#ededed',
      textMuted: '#8c8c8c',
    },
    light: {
      bg: '#fdfdfd',
      surface: '#ffffff',
      surfaceElevated: '#f7f7f7',
      surfaceHover: '#eeeeee',
      border: '#e9e9e9',
      borderHover: '#d0d0d0',
      text: '#030303',
      textMuted: '#696969',
    },
  },
  radius: {
    sm: '5px',
    button: '9px',
    card: '11px',
    largeCard: '21px',
    pill: '9999px',
  },
  shadows: {
    soft: 'rgba(0, 0, 0, 0.04) 0px 1px 3px 0px, rgba(0, 0, 0, 0.027) 0px 1px 0px 0px inset',
    card: 'rgba(0, 0, 0, 0.04) 0px 1px 3px 0px, rgba(0, 0, 0, 0.027) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset',
    hover: 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px',
  },
} as const;
