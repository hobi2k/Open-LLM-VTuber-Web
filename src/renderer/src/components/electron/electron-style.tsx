import { SystemStyleObject } from '@chakra-ui/react';

export const inputSubtitleStyles = {
  container: {
    position: 'fixed' as const,
    zIndex: 1000,
    userSelect: 'none',
    willChange: 'left, top',
    padding: 0,
    transition: 'left 90ms linear, top 90ms linear',
  },

  dock: {
    w: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    gap: '0',
    p: '0',
    borderRadius: '8px',
    overflow: 'visible',
    border: '1px solid rgba(175, 198, 210, 0.38)',
    boxShadow: '0 18px 50px rgba(0, 0, 0, 0.42), 0 2px 10px rgba(0, 0, 0, 0.28)',
    bg: 'rgba(17, 23, 27, 0.94)',
    backdropFilter: 'blur(22px) saturate(125%)',
    _focusWithin: {
      borderColor: 'rgba(126, 180, 207, 0.78)',
      boxShadow: '0 18px 50px rgba(0, 0, 0, 0.46), 0 0 0 1px rgba(126, 180, 207, 0.2)',
    },
    css: { WebkitUserSelect: 'none' },
  },

  attachmentTray: {
    px: '2.5',
    py: '2',
    borderBottom: '1px solid rgba(175, 198, 210, 0.16)',
    bg: 'rgba(29, 39, 45, 0.72)',
    borderTopRadius: '8px',
  },

  composerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2',
    px: '2.5',
    pt: '1.5',
    pb: '2',
    borderTop: '1px solid rgba(175, 198, 210, 0.12)',
    bg: 'rgba(8, 13, 16, 0.24)',
  },

  utilityGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5',
    flexShrink: 0,
  },

  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    flexShrink: 0,
  },

  box: {
    w: '100%',
    rounded: '8px',
    overflow: 'hidden',
    border: '1px solid rgba(166, 187, 200, 0.28)',
    boxShadow: '0 18px 55px rgba(0, 0, 0, 0.42)',
    bg: 'rgba(14, 20, 24, 0.94)',
    backdropFilter: 'blur(18px)',
    css: { WebkitUserSelect: 'none' },
  },

  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2.5',
    minH: '220px',
    maxH: 'min(520px, 58vh)',
    overflowY: 'auto',
    px: '3',
    py: '3',
    overscrollBehavior: 'contain',
  },

  timelineText: {
    color: '#e3e9ec',
    fontSize: 'sm',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    userSelect: 'text',
  },

  textMessage: (role: 'ai' | 'human'): SystemStyleObject => ({
    maxW: role === 'human' ? '84%' : '92%',
    minW: '0',
    px: '3',
    py: '2.5',
    borderRadius: role === 'human' ? '7px 7px 2px 7px' : '7px 7px 7px 2px',
    bg: role === 'human' ? '#263f4a' : '#172126',
    border: role === 'human' ? '1px solid #385a68' : '1px solid #28353c',
  }),

  reasoningMessage: {
    alignSelf: 'flex-start',
    maxW: '94%',
    border: '1px solid #31576e',
    borderRadius: '7px 7px 7px 2px',
    bg: '#142936',
    px: '3',
    py: '2.5',
    minW: '0',
  },

  activityMessage: {
    alignSelf: 'flex-start',
    maxW: '96%',
    border: '1px solid #2a373e',
    borderRadius: '6px',
    bg: '#11191d',
    px: '3',
    py: '2.5',
    minW: '0',
  },

  activityIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '7',
    height: '7',
    flexShrink: 0,
    color: '#9eb8c7',
    bg: '#1c282e',
    borderRadius: '5px',
  },

  activityTitle: {
    color: '#e0e6e9',
    fontSize: 'xs',
    fontWeight: 'semibold',
    lineHeight: '1.45',
    mt: '1',
    overflowWrap: 'anywhere',
  },

  activityCode: {
    color: '#a8bac4',
    bg: '#0b1114',
    borderRadius: '4px',
    fontFamily: 'mono',
    fontSize: '2xs',
    lineHeight: '1.55',
    mt: '2',
    px: '2',
    py: '1.5',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    maxH: '72px',
    overflowY: 'auto',
    userSelect: 'text',
  },

  activityOutput: {
    color: '#83949e',
    fontFamily: 'mono',
    fontSize: '2xs',
    lineHeight: '1.55',
    mt: '2',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    maxH: '72px',
    overflowY: 'auto',
    userSelect: 'text',
  },

  emptyText: {
    color: '#70808b',
    fontSize: 'xs',
    textAlign: 'center' as const,
    my: 'auto',
  },

  statusBox: {
    bg: '#10171b',
    px: '3',
    py: '2.5',
    borderBottom: '1px solid #2a353c',
    cursor: 'grab',
    _active: { cursor: 'grabbing' },
  },

  statusText: {
    fontSize: 'xs',
    color: 'whiteAlpha.800',
  },

  iconButton: {
    width: '36px',
    height: '36px',
    minW: '36px',
    variant: 'ghost',
    borderRadius: '5px',
    color: '#9fb0b9',
    _hover: { bg: '#26343b', color: '#f2f7f9' },
    _active: { bg: '#31434c', transform: 'translateY(1px)' },
    _disabled: { color: '#56666f', cursor: 'not-allowed' },
  },

  inputBox: {
    bg: '#10171b',
    borderTop: '1px solid #2a353c',
  },

  input: {
    minW: '0',
    minH: '54px',
    maxH: '140px',
    resize: 'none',
    bg: 'transparent',
    color: '#f0f4f6',
    fontSize: 'sm',
    lineHeight: '1.55',
    px: '4',
    pt: '3.5',
    pb: '2.5',
    _placeholder: { color: '#74838c' },
    border: '0',
    borderRadius: '0',
    _focus: {
      border: '0',
      boxShadow: 'none',
      outline: 'none',
    },
    overflowY: 'auto',
    userSelect: 'text',
  },

  sendButton: {
    width: '38px',
    height: '38px',
    minW: '38px',
    bg: '#d9eaf1',
    color: '#101b20',
    borderRadius: '6px',
    boxShadow: '0 5px 16px rgba(105, 160, 184, 0.2)',
    _hover: { bg: '#eff8fb', transform: 'translateY(-1px)' },
    _active: { bg: '#c4dce6', transform: 'translateY(0)' },
    _disabled: {
      bg: '#263238',
      color: '#5f7078',
      boxShadow: 'none',
      cursor: 'not-allowed',
    },
  },

  draggableContainer: (isDragging: boolean): SystemStyleObject => ({
    cursor: 'default',
    transition: isDragging ? 'none' : 'box-shadow 0.1s ease',
  }),
} as const;
