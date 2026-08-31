import { SystemStyleObject } from '@chakra-ui/react';

export const inputSubtitleStyles = {
  container: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxW: 'fit-content',
    position: 'absolute' as const,
    bottom: '28px',
    right: '28px',
    zIndex: 1000,
    userSelect: 'none',
    willChange: 'transform',
    width: 'min(480px, calc(100vw - 32px))',
    padding: 0,
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
    minH: '110px',
    maxH: 'min(360px, 46vh)',
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
    maxW: '88%',
    minW: '0',
    px: '3',
    py: '2.5',
    borderRadius: role === 'human' ? '7px 7px 2px 7px' : '7px 7px 7px 2px',
    bg: role === 'human' ? '#263f4a' : '#172126',
    border: role === 'human' ? '1px solid #385a68' : '1px solid #28353c',
  }),

  reasoningMessage: {
    borderLeft: '2px solid #527d98',
    pl: '3',
    py: '1',
    minW: '0',
  },

  activityMessage: {
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
    size: 'xs',
    variant: 'ghost',
    color: 'whiteAlpha.800',
    _hover: { bg: 'whiteAlpha.200' },
  },

  inputBox: {
    bg: '#10171b',
    borderTop: '1px solid #2a353c',
  },

  input: {
    minH: '42px',
    maxH: '112px',
    resize: 'none',
    bg: '#0b1114',
    color: '#edf2f4',
    fontSize: 'sm',
    lineHeight: '1.5',
    _placeholder: { color: '#64747e' },
    borderColor: '#303e46',
    borderRadius: '6px',
    _focus: {
      borderColor: '#668ba0',
      boxShadow: '0 0 0 1px #668ba0',
      outline: 'none',
    },
    flex: '1',
    userSelect: 'text',
  },

  sendButton: {
    width: '42px',
    height: '42px',
    minW: '42px',
    bg: '#d7e5ec',
    color: '#142027',
    borderRadius: '6px',
    _hover: { bg: '#edf5f8' },
  },

  draggableContainer: (isDragging: boolean): SystemStyleObject => ({
    cursor: 'default',
    transition: isDragging ? 'none' : 'box-shadow 0.1s ease',
  }),
} as const;
