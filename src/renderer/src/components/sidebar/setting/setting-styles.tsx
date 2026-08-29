const isElectron = window.api !== undefined;
export const settingStyles = {
  settingUI: {
    container: {
      width: '100%',
      height: '100%',
      p: 4,
      gap: 4,
      position: 'relative',
      overflowY: 'auto',
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
      content: {},
      trigger: {
        color: 'whiteAlpha.600',
        fontSize: 'xs',
        fontWeight: 'medium',
        px: 2.5,
        py: 2,
        borderRadius: '4px',
        whiteSpace: 'nowrap' as const,
        _selected: {
          color: 'white',
          bg: 'whiteAlpha.100',
          boxShadow: 'inset 0 -2px 0 var(--chakra-colors-blue-400)',
        },
        _hover: {
          color: 'white',
          bg: 'whiteAlpha.50',
        },
      },
      list: {
        display: 'flex',
        justifyContent: 'flex-start',
        width: '100%',
        gap: 1,
        p: 1,
        mb: 5,
        bg: 'blackAlpha.300',
        border: '1px solid',
        borderColor: 'whiteAlpha.100',
        borderRadius: '6px',
        overflowX: 'auto',
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
      bg: '#111315',
      width: 'min(480px, 100vw)',
      maxWidth: '480px',
      height: isElectron ? 'calc(100vh - 30px)' : '100vh',
      borderRight: '1px solid',
      borderColor: 'whiteAlpha.200',
      boxShadow: '16px 0 48px rgba(0, 0, 0, 0.38)',
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      position: 'relative',
      px: 5,
      py: 4.5,
      borderBottom: '1px solid',
      borderColor: 'whiteAlpha.100',
    },
    drawerTitle: {
      color: 'white',
      fontSize: 'lg',
      fontWeight: 'semibold',
    },
    drawerBody: {
      px: 5,
      py: 4,
      css: {
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-thumb': {
          bg: 'whiteAlpha.200',
          borderRadius: 'full',
        },
      },
    },
    drawerFooter: {
      px: 5,
      py: 4,
      gap: 2,
      borderTop: '1px solid',
      borderColor: 'whiteAlpha.100',
      bg: '#111315',
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
        color: 'whiteAlpha.800',
      },
    },
    select: {
      root: {
        colorPalette: 'gray',
        bg: 'gray.800',
      },
      trigger: {
        bg: 'gray.800',
      },
    },
    input: {
      bg: 'gray.800',
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
      color: 'gray.600',
    },
  },
  common: {
    field: {
      orientation: 'horizontal' as const,
    },
    fieldLabel: {
      fontSize: 'sm',
      color: 'whiteAlpha.800',
      whiteSpace: 'nowrap' as const,
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
        bg: 'whiteAlpha.100',
        borderColor: 'whiteAlpha.200',
        _hover: {
          bg: 'whiteAlpha.200',
        },
      },
    },
    container: {
      gap: 5,
      maxW: 'full',
      css: { '--field-label-width': '120px' },
    },
    input: {
      bg: 'whiteAlpha.100',
      borderColor: 'whiteAlpha.200',
      _hover: {
        bg: 'whiteAlpha.200',
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
