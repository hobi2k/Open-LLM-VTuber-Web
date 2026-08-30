const isElectron = window.api !== undefined;
export const settingStyles = {
  settingUI: {
    container: {
      width: '100%',
      height: '100%',
      p: 0,
      gap: 5,
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden',
      css: {
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          bg: 'whiteAlpha.100',
          borderRadius: 'full',
        },
        '&::-webkit-scrollbar-thumb': {
          bg: 'whiteAlpha.300',
          borderRadius: 'full',
        },
      },
    },
    header: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    title: {
      ml: 4,
      fontSize: 'lg',
      fontWeight: 'bold',
    },
    tabs: {
      root: {
        width: '100%',
        variant: 'plain' as const,
        colorPalette: 'gray',
      },
      content: {
        width: '100%',
        minWidth: 0,
      },
      trigger: {
        color: '#96a0aa',
        fontSize: 'xs',
        fontWeight: 'semibold',
        lineHeight: '1.25',
        minWidth: 0,
        minHeight: '42px',
        px: 2,
        py: 2.5,
        gap: 1.5,
        borderRadius: '5px',
        whiteSpace: 'normal' as const,
        overflowWrap: 'anywhere' as const,
        textAlign: 'center' as const,
        _selected: {
          color: '#f4f7fa',
          bg: '#29323a',
          boxShadow: 'inset 0 0 0 1px rgba(148, 179, 211, 0.26)',
        },
        _hover: {
          color: '#f4f7fa',
          bg: '#20272d',
        },
      },
      list: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        width: '100%',
        gap: 1.5,
        p: 1.5,
        mb: 6,
        bg: '#12171b',
        border: '1px solid',
        borderColor: '#252d34',
        borderRadius: '7px',
      },
    },
    footer: {
      width: '100%',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 2,
      mt: 'auto',
      pt: 4,
      borderTop: '1px solid',
      borderColor: 'whiteAlpha.200',
    },
    drawerContent: {
      bg: '#0d1114',
      color: '#edf1f4',
      width: 'min(440px, 100vw)',
      maxWidth: '440px',
      height: isElectron ? 'calc(100vh - 30px)' : '100vh',
      borderRight: '1px solid',
      borderColor: '#273039',
      boxShadow: '22px 0 64px rgba(0, 0, 0, 0.48)',
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      position: 'relative',
      minHeight: '72px',
      px: 6,
      py: 5,
      borderBottom: '1px solid',
      borderColor: '#20272d',
      bg: '#101519',
    },
    drawerTitle: {
      color: '#f4f7fa',
      fontSize: 'lg',
      fontWeight: 'semibold',
      lineHeight: '1.25',
      overflowWrap: 'anywhere' as const,
    },
    drawerBody: {
      px: 6,
      py: 5,
      overflowX: 'hidden',
      css: {
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-thumb': {
          bg: 'whiteAlpha.200',
          borderRadius: 'full',
        },
      },
    },
    drawerFooter: {
      px: 6,
      py: 4.5,
      gap: 2,
      borderTop: '1px solid',
      borderColor: '#20272d',
      bg: '#101519',
    },
    closeButton: {
      position: 'absolute',
      right: 1,
      top: 1,
      color: 'white',

    },
  },
  general: {
    container: {
      align: 'stretch',
      gap: 6,
      p: 4,
    },
    field: {
      label: {
        color: '#d8dee4',
        lineHeight: '1.45',
        whiteSpace: 'normal' as const,
        overflowWrap: 'anywhere' as const,
      },
    },
    select: {
      root: {
        colorPalette: 'gray',
        bg: '#12181d',
      },
      trigger: {
        bg: '#12181d',
        color: '#eef2f5',
        borderColor: '#2b343c',
        _hover: {
          bg: '#171e24',
          borderColor: '#3a4651',
        },
      },
    },
    input: {
      bg: '#12181d',
      color: '#eef2f5',
      borderColor: '#2b343c',
      minHeight: '40px',
      _hover: {
        bg: '#171e24',
        borderColor: '#3a4651',
      },
      _focusVisible: {
        borderColor: '#77a8ff',
        boxShadow: '0 0 0 1px #77a8ff',
      },
    },
    buttonGroup: {
      gap: 4,
      width: '100%',
    },
    button: {
      width: '50%',
      variant: 'outline' as const,
      bg: 'blue',
      color: 'white',
      _hover: {
        bg: 'whiteAlpha.300',
      },
    },
    fieldLabel: {
      fontSize: '14px',
      color: '#d8dee4',
    },
  },
  common: {
    field: {
      orientation: 'horizontal' as const,
      gap: 3,
      minWidth: 0,
    },
    fieldLabel: {
      fontSize: 'sm',
      color: '#d8dee4',
      lineHeight: '1.45',
      whiteSpace: 'normal' as const,
      overflowWrap: 'anywhere' as const,
    },
    switch: {
      size: 'md' as const,
      colorPalette: 'blue' as const,
      variant: 'solid' as const,
    },
    numberInput: {
      root: {
        pattern: '[0-9]*\\.?[0-9]*',
        inputMode: 'decimal' as const,
      },
      input: {
        bg: '#12181d',
        borderColor: '#2b343c',
        color: '#eef2f5',
        minHeight: '40px',
        _hover: {
          bg: '#171e24',
          borderColor: '#3a4651',
        },
        _focusVisible: {
          borderColor: '#77a8ff',
          boxShadow: '0 0 0 1px #77a8ff',
        },
      },
    },
    container: {
      gap: 4.5,
      maxW: 'full',
      width: '100%',
      minWidth: 0,
    },
    input: {
      bg: '#12181d',
      borderColor: '#2b343c',
      color: '#eef2f5',
      minHeight: '40px',
      _hover: {
        bg: '#171e24',
        borderColor: '#3a4651',
      },
      _focusVisible: {
        borderColor: '#77a8ff',
        boxShadow: '0 0 0 1px #77a8ff',
      },
    },
  },
  live2d: {
    container: {
      gap: 8,
      maxW: 'sm',
      css: { '--field-label-width': '120px' },
    },
    emotionMap: {
      title: {
        fontWeight: 'bold',
        mb: 4,
      },
      entry: {
        mb: 2,
      },
      button: {
        colorPalette: 'blue',
        mt: 2,
      },
      deleteButton: {
        colorPalette: 'red',
      },
    },
  },
};
