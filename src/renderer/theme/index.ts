import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,

  colors: {
    // Supabase primary green palette (tokens.json: accent #0e7e4e / on-accent #ffffff)
    brand: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#0e7e4e', // Primary Supabase green
      600: '#05603a',
      700: '#044e2f',
      800: '#033b24',
      900: '#022919',
    },
    // Supabase UI tokens
    supabase: {
      accent: '#0e7e4e',
      accentLight: '#3ecf8e',
      darkBg: '#121212',
      darkSurface: '#181818',
      darkSurfaceAlt: '#232323',
      darkBorder: '#282828',
      darkText: '#ededed',
      darkMuted: '#8c8c8c',
      lightBg: '#fdfdfd',
      lightSurface: '#ffffff',
      lightSurfaceAlt: '#eeeeee',
      lightBorder: '#e9e9e9',
      lightText: '#030303',
      lightMuted: '#696969',
    },
    accent: {
      // Warm accent palette (kept for Quran bookmarks & highlighting)
      50: '#fdf6e3',
      100: '#f9e8b8',
      200: '#f0d88a',
      300: '#e6c85c',
      400: '#ddbc3c',
      500: '#d4a843',
      600: '#c4963a',
      700: '#ae812f',
      800: '#986c25',
      900: '#734e15',
    },
    surface: {
      dark: '#181818',
      light: '#ffffff',
    },
    background: {
      dark: '#121212',
      light: '#fdfdfd',
    },
  },

  fonts: {
    heading: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    arabic: "'Amiri', 'Traditional Arabic', 'Simplified Arabic', serif",
  },

  radii: {
    none: '0px',
    sm: '5px',
    base: '8px',
    md: '9px',
    lg: '11px', // Supabase primary radius (tokens.json: 11px)
    xl: '16px',
    '2xl': '21px', // Supabase card radius variant
    full: '9999px',
  },

  shadows: {
    supabase: 'rgba(0, 0, 0, 0.04) 0px 1px 3px 0px, rgba(0, 0, 0, 0.027) 0px 1px 0px 0px inset',
    supabaseCard: 'rgba(0, 0, 0, 0.04) 0px 1px 3px 0px, rgba(0, 0, 0, 0.027) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset',
    supabaseHover: 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px',
  },

  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'background.dark' : 'background.light',
        color: props.colorMode === 'dark' ? '#ededed' : '#030303',
        fontFamily: 'body',
        letterSpacing: '-0.01em',
      },
    }),
  },

  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: 'md', // 9px per Supabase recipe
        transition: 'all 0.15s ease',
      },
      variants: {
        primary: (props: { colorMode: string }) => ({
          bg: props.colorMode === 'dark' ? '#3ecf8e' : '#0e7e4e',
          color: props.colorMode === 'dark' ? '#030303' : '#ffffff',
          _hover: {
            bg: props.colorMode === 'dark' ? '#46df9a' : '#0a6a41',
            _disabled: { bg: props.colorMode === 'dark' ? '#3ecf8e' : '#0e7e4e' },
          },
          _active: {
            bg: props.colorMode === 'dark' ? '#2dbb7d' : '#075232',
          },
        }),
        solid: (props: { colorMode: string; colorScheme: string }) => {
          if (props.colorScheme === 'green') {
            return {
              bg: props.colorMode === 'dark' ? '#3ecf8e' : '#0e7e4e',
              color: props.colorMode === 'dark' ? '#030303' : '#ffffff',
              _hover: {
                bg: props.colorMode === 'dark' ? '#46df9a' : '#0a6a41',
              },
            };
          }
          return {};
        },
        outline: (props: { colorMode: string; colorScheme: string }) => {
          if (props.colorScheme === 'green') {
            return {
              borderColor: props.colorMode === 'dark' ? 'rgba(62, 207, 142, 0.35)' : 'rgba(14, 126, 78, 0.35)',
              color: props.colorMode === 'dark' ? '#3ecf8e' : '#0e7e4e',
              _hover: {
                bg: props.colorMode === 'dark' ? 'rgba(62, 207, 142, 0.08)' : 'rgba(14, 126, 78, 0.06)',
                borderColor: props.colorMode === 'dark' ? '#3ecf8e' : '#0e7e4e',
              },
            };
          }
          return {
            borderColor: props.colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            color: props.colorMode === 'dark' ? '#ededed' : '#030303',
            _hover: {
              bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50',
            },
          };
        },
        ghost: (props: { colorMode: string }) => ({
          color: props.colorMode === 'dark' ? '#8c8c8c' : '#696969',
          _hover: {
            color: props.colorMode === 'dark' ? '#ededed' : '#030303',
            bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50',
          },
        }),
      },
      defaultProps: {
        variant: 'primary',
      },
    },

    Card: {
      baseStyle: (props: { colorMode: string }) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'surface.dark' : 'surface.light',
          borderRadius: 'lg', // 11px
          borderWidth: '1px',
          borderColor: props.colorMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e9e9e9',
          boxShadow: 'supabase',
        },
      }),
    },

    Input: {
      variants: {
        filled: (props: { colorMode: string }) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f4f4f4',
            borderRadius: 'md', // 9px
            borderWidth: '1px',
            borderColor: props.colorMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e9e9e9',
            color: props.colorMode === 'dark' ? '#ededed' : '#030303',
            _hover: {
              bg: props.colorMode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : '#eeeeee',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? '#181818' : '#ffffff',
              borderColor: props.colorMode === 'dark' ? '#3ecf8e' : '#0e7e4e',
              boxShadow: props.colorMode === 'dark'
                ? '0 0 0 1px #3ecf8e'
                : '0 0 0 1px #0e7e4e',
            },
          },
        }),
      },
      defaultProps: {
        variant: 'filled',
      },
    },
  },
});

export default theme;
