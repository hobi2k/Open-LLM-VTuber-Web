import { Box, Flex, Text } from '@chakra-ui/react';
import {
  Children, ComponentPropsWithoutRef, isValidElement, ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ClipboardIconButton,
  ClipboardRoot,
} from '@/components/ui/clipboard';
import { Tooltip } from '@/components/ui/tooltip';
import { closeStreamingCodeFence } from '@/utils/markdown';

interface MarkdownMessageProps {
  content: string;
  compact?: boolean;
}

function codeBlockDetails(children: ReactNode): { code: string; language: string } {
  const child = Children.toArray(children)[0];
  if (!isValidElement<{ children?: ReactNode; className?: string }>(child)) {
    return { code: String(child || ''), language: '' };
  }
  const className = child.props.className || '';
  return {
    code: String(child.props.children || '').replace(/\n$/, ''),
    language: className.startsWith('language-') ? className.slice(9) : '',
  };
}

function MarkdownCodeBlock({ children }: ComponentPropsWithoutRef<'pre'>): JSX.Element {
  const { t } = useTranslation();
  const details = codeBlockDetails(children);
  return (
    <Box
      className="markdown-code-block"
      border="1px solid rgba(152, 177, 192, 0.24)"
      borderRadius="6px"
      bg="#0a1013"
      my="2.5"
      minW="0"
      overflow="hidden"
    >
      <Flex
        align="center"
        justify="space-between"
        minH="8"
        gap="2"
        px="2.5"
        borderBottom="1px solid rgba(152, 177, 192, 0.16)"
        bg="#10181c"
      >
        <Text
          color="#8297a3"
          fontFamily="mono"
          fontSize="2xs"
          lineHeight="1"
          truncate
        >
          {details.language || 'text'}
        </Text>
        <ClipboardRoot value={details.code}>
          <Tooltip
            content={t('sidebar.copyCode')}
            portalled={false}
            contentProps={{
              bg: '#26343c',
              color: '#eef3f5',
              fontSize: '2xs',
              px: '2',
              py: '1',
            }}
          >
            <ClipboardIconButton
              aria-label={t('sidebar.copyCode')}
              title={t('sidebar.copyCode')}
              variant="ghost"
              size="2xs"
              color="#9db0ba"
              minW="7"
              height="7"
              _hover={{ bg: '#223039', color: '#f3f7f8' }}
              onClick={(event) => event.stopPropagation()}
            />
          </Tooltip>
        </ClipboardRoot>
      </Flex>
      <Box
        as="pre"
        className="markdown-code-scroll"
        m="0"
        px="3"
        py="2.5"
        overflowX="auto"
        overscrollBehavior="contain"
      >
        {children}
      </Box>
    </Box>
  );
}

const markdownComponents: Components = {
  pre: MarkdownCodeBlock,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
};

export function MarkdownMessage({ content, compact = false }: MarkdownMessageProps): JSX.Element {
  return (
    <Box
      data-markdown-message="true"
      data-compact={compact ? 'true' : 'false'}
      minW="0"
      maxW="100%"
      color="inherit"
      overflowWrap="anywhere"
      wordBreak="break-word"
      userSelect="text"
      css={{
        '& p': { margin: '0 0 0.72em' },
        '& > p:last-of-type': { marginBottom: 0 },
        '& strong': { color: '#f4f7f8', fontWeight: 700 },
        '& em': { color: '#d8e1e6' },
        '& h1, & h2, & h3, & h4': {
          color: '#f2f6f7',
          fontWeight: 700,
          letterSpacing: 0,
          lineHeight: 1.35,
          margin: '0.9em 0 0.42em',
        },
        '& h1': { fontSize: '1.2em' },
        '& h2': { fontSize: '1.12em' },
        '& h3, & h4': { fontSize: '1em' },
        '& ul, & ol': {
          margin: '0.45em 0 0.76em',
          paddingInlineStart: '1.45em',
        },
        '& ul': { listStyleType: 'disc' },
        '& ol': { listStyleType: 'decimal' },
        '& ul.contains-task-list': {
          listStyleType: 'none',
          paddingInlineStart: '0.2em',
        },
        '& li': { paddingInlineStart: '0.15em' },
        '& li + li': { marginTop: '0.28em' },
        '& li > p': { margin: 0 },
        '& blockquote': {
          borderInlineStart: '3px solid #52758a',
          color: '#b8c7cf',
          margin: '0.7em 0',
          padding: '0.1em 0 0.1em 0.85em',
        },
        '& a': {
          color: '#83c7ee',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(131, 199, 238, 0.5)',
          textUnderlineOffset: '2px',
        },
        '& a:hover': { color: '#b6e2fa' },
        '& :not(pre) > code': {
          border: '1px solid rgba(146, 174, 188, 0.2)',
          borderRadius: '4px',
          background: '#0b1216',
          color: '#c8e5f4',
          fontFamily: 'monospace',
          fontSize: '0.9em',
          padding: '0.08em 0.34em',
          whiteSpace: 'break-spaces',
        },
        '& pre code': {
          color: '#d8e2e7',
          fontFamily: 'monospace',
          fontSize: '0.88em',
          lineHeight: 1.62,
          whiteSpace: 'pre',
        },
        '&[data-compact="true"] .markdown-code-scroll': {
          maxHeight: '180px',
          overflowY: 'auto',
        },
        '& table': {
          borderCollapse: 'collapse',
          display: 'block',
          margin: '0.75em 0',
          maxWidth: '100%',
          overflowX: 'auto',
        },
        '& th, & td': {
          border: '1px solid #34434b',
          padding: '0.42em 0.58em',
          textAlign: 'start',
        },
        '& th': { background: '#172127', color: '#eef3f5' },
        '& hr': {
          border: 0,
          borderTop: '1px solid #34434b',
          margin: '0.9em 0',
        },
        '& img': {
          borderRadius: '6px',
          display: 'block',
          height: 'auto',
          margin: '0.7em 0',
          maxWidth: '100%',
        },
        '& input[type="checkbox"]': { marginInlineEnd: '0.45em' },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
        skipHtml
      >
        {closeStreamingCodeFence(content)}
      </ReactMarkdown>
    </Box>
  );
}
