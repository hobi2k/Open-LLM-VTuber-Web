import { SystemStyleObject } from '@chakra-ui/react';

interface FooterStyles {
  container: (isCollapsed: boolean) => SystemStyleObject
  toggleButton: SystemStyleObject
  actionButton: SystemStyleObject
  input: SystemStyleObject
  attachButton: SystemStyleObject
}

interface AIIndicatorStyles {
  container: SystemStyleObject
  text: SystemStyleObject
}

export const footerStyles: {
  footer: FooterStyles
  aiIndicator: AIIndicatorStyles
} = {
  footer: {
    container: (isCollapsed) => ({
      bg: isCollapsed ? 'transparent' : '#10161a',
      borderTop: isCollapsed ? 'none' : '1px solid #28323a',
      transform: isCollapsed ? 'translateY(calc(100% - 24px))' : 'translateY(0)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '100%',
      position: 'relative',
      overflow: isCollapsed ? 'visible' : 'hidden',
      pb: '3',
    }),
    toggleButton: {
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#66737d',
      _hover: { color: 'white' },
      bg: 'transparent',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    actionButton: {
      borderRadius: '6px',
      borderWidth: '1px',
      width: '40px',
      height: '40px',
      minW: '40px',
      _hover: {
        filter: 'brightness(1.12)',
      },
    },
    input: {
      bg: '#151c21',
      border: '1px solid #303b43',
      height: '64px',
      borderRadius: '7px',
      fontSize: '15px',
      pl: '11',
      pr: '3',
      color: '#e5eaed',
      _placeholder: {
        color: '#68757e',
      },
      _focus: {
        borderColor: '#5b7588',
        bg: '#172027',
        boxShadow: '0 0 0 1px rgba(107, 143, 169, 0.2)',
      },
      resize: 'none',
      minHeight: '64px',
      maxHeight: '64px',
      py: '0',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '20px',
      lineHeight: '1.4',
    },
    attachButton: {
      position: 'absolute',
      left: '1',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#7e8b94',
      zIndex: 2,
      _hover: {
        bg: 'transparent',
        color: '#dce4e9',
      },
    },
  },
  aiIndicator: {
    container: {
      bg: '#202a31',
      color: '#b8c7d1',
      border: '1px solid #34434d',
      width: '88px',
      height: '24px',
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    text: {
      fontSize: '12px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
};
