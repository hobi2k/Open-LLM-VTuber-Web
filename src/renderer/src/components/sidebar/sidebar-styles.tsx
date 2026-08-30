import { css } from '@emotion/react';

const isElectron = window.api !== undefined;

const commonStyles = {
  scrollbar: {
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
  panel: {
    border: '1px solid',
    borderColor: '#273039',
    borderRadius: '7px',
    bg: '#11171b',
  },
  title: {
    fontSize: 'lg',
    fontWeight: 'semibold',
    color: 'white',
    mb: 4,
  },
};

export const sidebarStyles = {
  sidebar: {
    container: (isCollapsed: boolean) => ({
      position: 'absolute' as const,
      left: 0,
      top: 0,
      height: '100%',
      width: 'min(440px, 100vw)',
      bg: '#0d1114',
      transform: isCollapsed
        ? 'translateX(calc(-100% + 24px))'
        : 'translateX(0)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 0,
      overflow: isCollapsed ? 'visible' : 'hidden',
      pb: '3',
    }),
    toggleButton: {
      position: 'absolute',
      right: 0,
      top: 0,
      width: '24px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#8e99a3',
      _hover: { color: '#eef2f5', bg: '#20282e' },
      bg: '#151b20',
      borderLeft: '1px solid #273039',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1,
    },
    content: {
      flex: 1,
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 3,
      overflow: 'hidden',
    },
    header: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      px: 4,
      py: 3,
      borderBottom: '1px solid',
      borderColor: '#20282e',
      bg: '#101519',
    },
    headerButton: {
      variant: 'ghost' as const,
      minWidth: '36px',
      width: '36px',
      height: '36px',
      p: 0,
      flexShrink: 0,
      borderRadius: '5px',
      color: '#a8b1b9',
      border: '1px solid transparent',
      _hover: {
        color: '#f2f5f7',
        bg: '#20282e',
        borderColor: '#303b44',
      },
      _focusVisible: {
        outline: '2px solid #77a8ff',
        outlineOffset: '1px',
      },
    },
  },

  chatHistoryPanel: {
    container: {
      flex: 1,
      overflow: 'hidden',
      px: 3,
      display: 'flex',
      flexDirection: 'column',
    },
    title: commonStyles.title,
    messageList: {
      ...commonStyles.panel,
      p: 0,
      width: '100%',
      flex: 1,
      overflowY: 'auto',
      css: {
        ...commonStyles.scrollbar,
        scrollPaddingBottom: '1rem',
      },
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    },
  },

  systemLogPanel: {
    container: {
      width: '100%',
      overflow: 'hidden',
      px: 4,
      minH: '200px',
      marginTop: 'auto',
    },
    title: commonStyles.title,
    logList: {
      ...commonStyles.panel,
      p: 4,
      height: '200px',
      overflowY: 'auto',
      fontFamily: 'mono',
      css: commonStyles.scrollbar,
    },
    entry: {
      p: 2,
      borderRadius: 'md',
      _hover: {
        bg: 'whiteAlpha.50',
      },
    },
  },

  chatBubble: {
    container: {
      display: 'flex',
      position: 'relative',
      _hover: {
        bg: 'whiteAlpha.50',
      },
      py: 1,
      px: 2,
      borderRadius: 'md',
    },
    message: {
      maxW: '90%',
      bg: 'transparent',
      p: 2,
    },
    text: {
      fontSize: 'xs',
      color: 'whiteAlpha.900',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
    },
    dot: {
      position: 'absolute',
      w: '2',
      h: '2',
      borderRadius: 'full',
      bg: 'white',
      top: '2',
    },
  },

  historyDrawer: {
    listContainer: {
      flex: 1,
      overflowY: 'auto',
      px: 4,
      py: 2,
      css: commonStyles.scrollbar,
    },
    historyItem: {
      mb: 4,
      p: 3,
      borderRadius: 'md',
      bg: 'whiteAlpha.50',
      cursor: 'pointer',
      transition: 'all 0.2s',
      _hover: {
        bg: 'whiteAlpha.100',
      },
    },
    historyItemSelected: {
      bg: 'whiteAlpha.200',
      borderLeft: '3px solid',
      borderColor: 'blue.500',
    },
    historyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2,
    },
    timestamp: {
      fontSize: 'sm',
      color: 'whiteAlpha.700',
      fontFamily: 'mono',
    },
    deleteButton: {
      variant: 'ghost' as const,
      colorScheme: 'red' as const,
      size: 'sm' as const,
      color: 'red.300',
      opacity: 0.8,
      _hover: {
        opacity: 1,
        bg: 'whiteAlpha.200',
      },
    },
    messagePreview: {
      fontSize: 'sm',
      color: 'whiteAlpha.900',
      noOfLines: 2,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    drawer: {
      content: {
        background: 'var(--chakra-colors-gray-900)',
        maxWidth: '440px',
        marginTop: isElectron ? '30px' : '0',
        height: isElectron ? 'calc(100vh - 30px)' : '100vh',
      },
      title: {
        color: 'white',
      },
      closeButton: {
        color: 'white',
      },
      actionButton: {
        color: 'white',
        borderColor: 'white',
        variant: 'outline' as const,
      },
    },
  },

  cameraPanel: {
    container: {
      width: '97%',
      overflow: 'hidden',
      px: 4,
      minH: '240px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
    },
    title: commonStyles.title,
    videoContainer: {
      ...commonStyles.panel,
      width: '100%',
      height: '240px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'all 0.2s',
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      transform: 'scaleX(-1)',
      borderRadius: '8px',
      display: 'block',
    } as const,
  },

  screenPanel: {
    container: {
      width: '97%',
      overflow: 'hidden',
      px: 4,
      minH: '240px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
    },
    title: commonStyles.title,
    screenContainer: {
      ...commonStyles.panel,
      width: '100%',
      height: '240px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'all 0.2s',
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      borderRadius: '8px',
      display: 'block',
    } as const,
  },

  // Add Browser Panel Styles
  browserPanel: {
    container: {
      width: '97%',
      overflow: 'hidden',
      px: 4,
      minH: '240px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
    },
    title: commonStyles.title,
    browserContainer: {
      ...commonStyles.panel,
      width: '100%',
      height: '240px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'all 0.2s',
      cursor: 'pointer',
      _hover: {
        bg: 'whiteAlpha.100',
      },
    },
    iframe: {
      width: '100%',
      height: '100%',
      border: 'none',
      borderRadius: '8px',
    } as const,
  },

  bottomTab: {
    container: {
      width: '100%',
      px: 3,
      position: 'relative' as const,
      zIndex: 0,
    },
    tabs: {
      width: '100%',
      bg: 'whiteAlpha.50',
      borderRadius: 'lg',
      p: '1',
    },
    list: {
      borderBottom: 'none',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '1',
      width: '100%',
      p: '1',
      bg: '#11171b',
      border: '1px solid #273039',
      borderRadius: '7px',
    },
    trigger: {
      color: '#8f9aa4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      minWidth: 0,
      minHeight: '38px',
      px: 2,
      py: 2,
      lineHeight: '1.3',
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      textAlign: 'center',
      borderRadius: '5px',
      _hover: {
        color: '#eef2f5',
        bg: '#1d252b',
      },
      _selected: {
        color: '#eef2f5',
        bg: '#29343d',
        boxShadow: 'inset 0 0 0 1px rgba(148, 179, 211, 0.2)',
      },
    },
  },

  groupDrawer: {
    section: {
      mb: 6,
    },
    sectionTitle: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'white',
      mb: 3,
    },
    inviteBox: {
      display: 'flex',
      gap: 2,
    },
    input: {
      bg: 'whiteAlpha.100',
      border: 'none',
      color: 'white',
      _placeholder: {
        color: 'whiteAlpha.400',
      },
    },
    memberList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    },
    memberItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      p: 2,
      borderRadius: 'md',
      bg: 'whiteAlpha.100',
    },
    memberText: {
      color: 'white',
      fontSize: 'sm',
    },
    removeButton: {
      size: 'sm',
      color: 'red.300',
      bg: 'transparent',
      _hover: {
        bg: 'whiteAlpha.200',
      },
    },
    button: {
      color: 'white',
      bg: 'whiteAlpha.100',
      _hover: {
        bg: 'whiteAlpha.200',
      },
    },
    clipboardButton: {
      color: 'white',
      bg: 'transparent',
      _hover: {
        bg: 'whiteAlpha.200',
      },
      size: 'sm',
    },
  },

  // Add styles for the Tool Call Indicator
  toolCallIndicator: {
    container: {
      pl: '42px',
      pr: '10px',
      my: '1',
      gap: 2,
      width: '100%',
      minWidth: 0,
      minHeight: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    icon: {
      color: 'blue.300',
      boxSize: '14px',
    },
    text: {
      fontSize: 'xs',
      color: '#8f9aa4',
      lineHeight: '1.45',
      minWidth: 0,
      overflowWrap: 'anywhere',
    },
    spinner: {
      size: 'xs',
      color: 'blue.300',
      ml: 0,
    },
    completedIcon: {
      color: 'green.300',
      boxSize: '14px',
      ml: 0,
    },
    errorIcon: {
      color: 'red.300',
      boxSize: '14px',
      ml: 0,
    },
  },
};

export const chatPanelStyles = css`
  .cs-message-list {
    background: #0d1114 !important;
    padding: 8px 10px 16px !important;
    overflow-x: hidden !important;
  }

  .cs-message-list__scroll-wrapper {
    overflow-x: hidden !important;
  }

  .cs-message {
    margin: 14px 0 !important;
    min-width: 0 !important;
  }

  .cs-message__content {
    background-color: #192126 !important;
    border: 1px solid #29343c !important;
    border-radius: 7px !important;
    padding: 10px 12px !important;
    color: #edf1f4 !important;
    font-size: 0.875rem !important;
    line-height: 1.62 !important;
    margin-top: 5px !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.13);
  }

  .cs-message__text {
    padding: 0 !important;
    min-width: 0 !important;
    white-space: pre-wrap !important;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
  }

  .cs-message--outgoing .cs-message__content {
    background-color: #23302f !important;
    border-color: #324643 !important;
  }

  .cs-chat-container {
    background: transparent !important;
    border: 0 !important;
    border-radius: 0 !important;
    padding: 0 !important;
  }

  .cs-main-container {
    border: none !important;
    background: transparent !important;
    width: calc(100% - 24px) !important;
    min-width: 0 !important;
    margin-left: 0 !important;
  }

  .cs-message__sender {
    position: static !important;
    display: block !important;
    max-width: 100% !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    line-height: 1.35 !important;
    color: #aeb8c0 !important;
    white-space: normal !important;
    overflow-wrap: anywhere !important;
  }

  .cs-message__content-wrapper {
    max-width: calc(100% - 44px) !important;
    min-width: 0 !important;
    margin: 0 7px !important;
  }

  .cs-avatar {
    background-color: #35658d !important;
    color: white !important;
    width: 30px !important;
    min-width: 30px !important;
    height: 30px !important;
    font-size: 13px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    overflow: hidden !important;
  }

  .cs-message--outgoing .cs-avatar {
    background-color: #43715f !important;
  }

  .cs-message__header {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
`;
