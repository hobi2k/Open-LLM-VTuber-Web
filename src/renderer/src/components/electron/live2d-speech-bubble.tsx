import {
  LuBrain,
  LuCircleAlert,
  LuFilePenLine,
  LuLoaderCircle,
  LuMessageCircle,
  LuTerminal,
  LuWrench,
} from 'react-icons/lu';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  ComponentType, useEffect, useMemo, useRef, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useChatHistory } from '@/context/chat-history-context';
import { useAiState } from '@/context/ai-state-context';
import { useLive2DScreenAnchor } from '@/hooks/canvas/use-live2d-screen-anchor';
import { Message } from '@/services/websocket-service';
import {
  activityInput,
  activityOutput,
  activityTitle,
} from '@/utils/agent-activity';

type BubbleKind = 'reasoning' | 'command' | 'file' | 'tool' | 'response';

interface BubbleContent {
  id: string;
  kind: BubbleKind;
  label: string;
  text: string;
  status: Message['status'];
}

const MAX_BUBBLE_TEXT = 2400;
const BUBBLE_WIDTH = 360;
const VIEWPORT_MARGIN = 16;
const ANCHOR_GAP = 20;

function recentText(value: string): string {
  const text = value.trim();
  if (text.length <= MAX_BUBBLE_TEXT) return text;
  return `...${text.slice(-MAX_BUBBLE_TEXT)}`;
}

function messageText(message: Message): string {
  if (message.type !== 'agent_activity') return recentText(message.content);

  const title = activityTitle(message.title, message.tool_name, message.input);
  const input = message.command || message.path || activityInput(message.input);
  const output = activityOutput(message.output);
  return recentText([title, input && (message.command ? `$ ${input}` : input), output]
    .filter(Boolean)
    .join('\n'));
}

function currentTurn(messages: Message[]): Message[] {
  const latestHumanIndex = messages
    .map((message) => message.role === 'human')
    .lastIndexOf(true);
  if (latestHumanIndex < 0) return [];
  return messages.slice(latestHumanIndex);
}

function latestDisplayMessage(messages: Message[]): Message | undefined {
  return currentTurn(messages)
    .filter((message) => message.role === 'ai' && (
      message.type === 'reasoning'
      || message.type === 'agent_activity'
      || (message.type === 'text' && Boolean(message.content.trim()))
    ))
    .map((message, index) => ({ message, index }))
    .sort((left, right) => (
      new Date(right.message.timestamp).getTime()
      - new Date(left.message.timestamp).getTime()
      || right.index - left.index
    ))[0]?.message;
}

function bubbleIcon(kind: BubbleKind): ComponentType<{ size?: number }> {
  if (kind === 'reasoning') return LuBrain;
  if (kind === 'command') return LuTerminal;
  if (kind === 'file') return LuFilePenLine;
  if (kind === 'tool') return LuWrench;
  return LuMessageCircle;
}

export function Live2DSpeechBubble(): JSX.Element | null {
  const { t } = useTranslation();
  const { messages } = useChatHistory();
  const { aiState, isThinkingSpeaking } = useAiState();
  const anchor = useLive2DScreenAnchor();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [bubbleHeight, setBubbleHeight] = useState(0);

  const bubble = useMemo<BubbleContent | null>(() => {
    const latest = latestDisplayMessage(messages);
    if (!latest) {
      const turn = currentTurn(messages);
      if (!turn.length || !isThinkingSpeaking) return null;
      return {
        id: turn[0].id,
        kind: 'reasoning',
        label: t('sidebar.thinking'),
        text: t('sidebar.thinking'),
        status: 'running',
      };
    }

    if (latest.type === 'reasoning') {
      return {
        id: latest.id,
        kind: 'reasoning',
        label: latest.status === 'running'
          ? t('sidebar.thinking')
          : t('sidebar.reasoning'),
        text: messageText(latest) || t('sidebar.thinking'),
        status: latest.status,
      };
    }

    if (latest.type === 'agent_activity') {
      const kind = latest.activity_kind || 'tool';
      return {
        id: latest.id,
        kind,
        label: t(`sidebar.activity${kind[0].toUpperCase()}${kind.slice(1)}`),
        text: messageText(latest),
        status: latest.status,
      };
    }

    return {
      id: latest.id,
      kind: 'response',
      label: t('sidebar.conversation'),
      text: messageText(latest),
      status: aiState === 'thinking-speaking' ? 'running' : 'completed',
    };
  }, [aiState, isThinkingSpeaking, messages, t]);

  useEffect(() => {
    const element = bubbleRef.current;
    if (!element) return undefined;
    const updateHeight = () => setBubbleHeight(element.getBoundingClientRect().height);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [bubble]);

  useEffect(() => {
    const element = contentRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [bubble?.text]);

  if (!bubble) return null;

  const width = Math.min(BUBBLE_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(anchor.x - width / 2, window.innerWidth - width - VIEWPORT_MARGIN),
  );
  const top = Math.max(VIEWPORT_MARGIN, anchor.y - bubbleHeight - ANCHOR_GAP);
  const tailLeft = Math.max(24, Math.min(anchor.x - left, width - 24));
  const BubbleIcon = bubbleIcon(bubble.kind);
  const accentByKind: Record<BubbleKind, string> = {
    reasoning: '#8ec5e6',
    command: '#d4b980',
    file: '#d4b980',
    tool: '#d4b980',
    response: '#86cfa9',
  };
  const accent = bubble.status === 'error' ? '#ef8f96' : accentByKind[bubble.kind];

  return (
    <Box
      ref={bubbleRef}
      data-testid="live2d-speech-bubble"
      role="status"
      aria-live="polite"
      position="fixed"
      left={`${left}px`}
      top={`${top}px`}
      width={`${width}px`}
      zIndex={900}
      pointerEvents="none"
      opacity={anchor.ready ? 1 : 0.96}
      bg="rgba(14, 20, 24, 0.96)"
      border="1px solid rgba(190, 208, 218, 0.42)"
      borderRadius="8px"
      boxShadow="0 14px 42px rgba(0, 0, 0, 0.42)"
      backdropFilter="blur(16px)"
      px="3.5"
      py="3"
      transition="left 90ms linear, top 90ms linear, opacity 160ms ease"
    >
      <Flex align="center" gap="2" color={accent} minW="0" mb="1.5">
        <Icon as={BubbleIcon} boxSize="4" flexShrink={0} />
        <Text fontSize="xs" lineHeight="1.2" fontWeight="semibold" truncate>
          {bubble.label}
        </Text>
        {bubble.status === 'running' && (
          <Icon as={LuLoaderCircle} boxSize="3.5" ml="auto" animation="spin 1s linear infinite" />
        )}
        {bubble.status === 'error' && (
          <Icon as={LuCircleAlert} boxSize="3.5" ml="auto" />
        )}
      </Flex>
      <Box
        ref={contentRef}
        maxH="116px"
        overflow="hidden"
        color="#eef3f5"
        fontSize="sm"
        lineHeight="1.55"
        whiteSpace="pre-wrap"
        overflowWrap="anywhere"
      >
        {bubble.text}
      </Box>
      <Box
        aria-hidden="true"
        position="absolute"
        left={`${tailLeft - 8}px`}
        bottom="-8px"
        width="16px"
        height="16px"
        bg="rgba(14, 20, 24, 0.96)"
        borderRight="1px solid rgba(190, 208, 218, 0.42)"
        borderBottom="1px solid rgba(190, 208, 218, 0.42)"
        transform="rotate(45deg)"
      />
    </Box>
  );
}
