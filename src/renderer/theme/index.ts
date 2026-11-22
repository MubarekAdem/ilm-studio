import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,

  colors: {
    brand: {
      // Primary green palette
      50: '#e6f5ed',
      100: '#c0e6d1',
      200: '#97d4b3',
      300: '#6dc295',
      400: '#4db37f',
      500: '#2d6a4f', // primary green
      600: '#265e45',
      700: '#1e4f39',
      800: '#17402e',
      900: '#0f3023',
    },
    accent: {
      // Gold palette
      50: '#fdf6e3',
      100: '#f9e8b8',
      200: '#f0d88a',
      300: '#e6c85c',
      400: '#ddbc3c',
      500: '#d4a843', // accent gold
      600: '#c4963a',
      700: '#ae812f',
      800: '#986c25',
      900: '#734e15',
    },
    surface: {
      dark: '#16213e',
      light: '#ffffff',
    },
    background: {
      dark: '#1a1a2e',
      light: '#faf8f5',
    },
  },

  fonts: {
    heading: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    body: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    arabic: "'Amiri', 'Traditional Arabic', 'Simplified Arabic', serif",
  },

  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'background.dark' : 'background.light',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
      },
    }),
  },

  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'md',
      },
      variants: {
        primary: (props: { colorMode: string }) => ({
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            _disabled: { bg: 'brand.500' },
          },
          _active: { bg: 'brand.700' },
        }),
        accent: {
          bg: 'accent.500',
          color: 'gray.900',
          _hover: {
            bg: 'accent.600',
          },
          _active: { bg: 'accent.700' },
        },
        ghost: (props: { colorMode: string }) => ({
          color: props.colorMode === 'dark' ? 'gray.300' : 'gray.600',
          _hover: {
            bg: props.colorMode === 'dark'
              ? 'whiteAlpha.100'
              : 'blackAlpha.50',
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
          borderRadius: 'lg',
          borderWidth: '1px',
          borderColor: props.colorMode === 'dark'
            ? 'whiteAlpha.100'
            : 'gray.200',
          boxShadow: 'sm',
        },
      }),
    },

    Input: {
      variants: {
        filled: (props: { colorMode: string }) => ({
          field: {
            bg: props.colorMode === 'dark'
              ? 'whiteAlpha.50'
              : 'gray.50',
            borderWidth: '1px',
            borderColor: props.colorMode === 'dark'
              ? 'whiteAlpha.100'
              : 'gray.200',
            _hover: {
              bg: props.colorMode === 'dark'
                ? 'whiteAlpha.100'
                : 'gray.100',
            },
            _focus: {
              bg: props.colorMode === 'dark'
                ? 'whiteAlpha.100'
                : 'white',
              borderColor: 'brand.500',
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
