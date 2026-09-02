import {
  LuBrain,
  LuCircleAlert,
  LuFilePenLine,
  LuLoaderCircle,
  LuMessageCircle,
  LuShieldCheck,
  LuTerminal,
  LuWrench,
} from 'react-icons/lu';
import {
  Badge, Box, Button, Flex, Icon, Input, Text,
} from '@chakra-ui/react';
import {
  ComponentType, useEffect, useMemo, useRef, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useChatHistory } from '@/context/chat-history-context';
import { useWebSocket } from '@/context/websocket-context';
import { useAiState } from '@/context/ai-state-context';
import { useLive2DScreenAnchor } from '@/hooks/canvas/use-live2d-screen-anchor';
import { usePetInteractiveRegion } from '@/hooks/electron/use-pet-interactive-region';
import { Message } from '@/services/websocket-service';
import {
  activityFileLanguage,
  activityInput,
  activityOutput,
  activityTitle,
} from '@/utils/agent-activity';
import {
  hasPermissionAnswers,
  PermissionAnswers,
  permissionAnswerPayload,
  PermissionQuestionFields,
  permissionQuestions,
} from '@/components/shared/permission-question-fields';
import {
  claimPermissionSubmission,
  isPermissionSubmissionPending,
  releasePermissionSubmission,
} from '@/utils/permission-submission';
import { MarkdownMessage } from '@/components/shared/markdown-message';
import { usePetUi } from '@/context/pet-ui-context';
import {
  currentPetTurn,
  latestPetDisplayMessage,
  petSpeechBubblePosition,
} from '@/utils/pet-speech-bubble';

type BubbleKind = 'reasoning' | 'command' | 'file' | 'tool' | 'response' | 'permission';

interface BubbleContent {
  id: string;
  kind: BubbleKind;
  label: string;
  text: string;
  status: Message['status'];
  message?: Message;
}

const BUBBLE_WIDTH = 360;
const VIEWPORT_MARGIN = 16;
const ANCHOR_GAP = 20;

function recentText(value: string): string {
  return value.trim();
}

function messageText(message: Message): string {
  if (message.type === 'permission') {
    return recentText(message.description || message.title || message.tool_name || 'Permission request');
  }
  if (message.type !== 'agent_activity') return recentText(message.content);

  const title = activityTitle(message.title, message.tool_name, message.input);
  const input = message.command || message.path || activityInput(message.input);
  const output = activityOutput(message.output);
  return recentText([title, input && (message.command ? `$ ${input}` : input), output]
    .filter(Boolean)
    .join('\n'));
}

function bubbleIcon(kind: BubbleKind): ComponentType<{ size?: number }> {
  if (kind === 'reasoning') return LuBrain;
  if (kind === 'command') return LuTerminal;
  if (kind === 'file') return LuFilePenLine;
  if (kind === 'tool') return LuWrench;
  if (kind === 'permission') return LuShieldCheck;
  return LuMessageCircle;
}

export function Live2DSpeechBubble(): JSX.Element | null {
  const { t } = useTranslation();
  const { messages } = useChatHistory();
  const { sendMessage, wsState } = useWebSocket();
  const { aiState, isThinkingSpeaking } = useAiState();
  const { bubblePlacement } = usePetUi();
  const anchor = useLive2DScreenAnchor();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [bubbleHeight, setBubbleHeight] = useState(0);
  const [answer, setAnswer] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState<PermissionAnswers>({});
  const [submitting, setSubmitting] = useState(false);

  const bubble = useMemo<BubbleContent | null>(() => {
    const latest = latestPetDisplayMessage(messages);
    if (!latest) {
      const turn = currentPetTurn(messages);
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
        message: latest,
      };
    }

    if (latest.type === 'permission') {
      return {
        id: latest.id,
        kind: 'permission',
        label: latest.title || t('sidebar.permissionRequest'),
        text: messageText(latest),
        status: latest.status,
        message: latest,
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

  const permissionInteractive = bubble?.kind === 'permission' && bubble.status === 'running';
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    setAnswer('');
    setQuestionAnswers({});
    setSubmitting(isPermissionSubmissionPending(bubble?.message?.request_id));
  }, [bubble?.id]);

  useEffect(() => {
    if (bubble?.status === 'running') return;
    releasePermissionSubmission(bubble?.message?.request_id);
    setSubmitting(false);
  }, [bubble?.message?.request_id, bubble?.status]);

  useEffect(() => {
    if (wsState !== 'CLOSED') return;
    releasePermissionSubmission(bubble?.message?.request_id);
    setSubmitting(false);
  }, [bubble?.message?.request_id, wsState]);

  useEffect(() => () => {
    window.api?.updateComponentHover('live2d-speech-bubble', false);
  }, []);

  useEffect(() => {
    const element = bubbleRef.current;
    if (!element) return undefined;
    const updateHeight = () => setBubbleHeight(element.getBoundingClientRect().height);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [bubble]);

  usePetInteractiveRegion('live2d-speech-bubble', bubbleRef, Boolean(bubble), 48);

  useEffect(() => {
    stickToBottomRef.current = true;
  }, [bubble?.id]);

  useEffect(() => {
    const element = contentRef.current;
    if (element && stickToBottomRef.current) element.scrollTop = element.scrollHeight;
  }, [bubble?.text]);

  if (!bubble) return null;

  const width = Math.min(BUBBLE_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  const position = petSpeechBubblePosition({
    placement: bubblePlacement,
    anchor,
    bubbleWidth: width,
    bubbleHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    margin: VIEWPORT_MARGIN,
    gap: ANCHOR_GAP,
  });
  const tailLeft = {
    above: `${position.tailOffset - 8}px`,
    left: undefined,
    right: '-8px',
  }[position.placement];
  const BubbleIcon = bubbleIcon(bubble.kind);
  const accentByKind: Record<BubbleKind, string> = {
    reasoning: '#8ec5e6',
    command: '#d4b980',
    file: '#d4b980',
    tool: '#d4b980',
    response: '#86cfa9',
    permission: '#e3c27a',
  };
  const accent = bubble.status === 'error' ? '#ef8f96' : accentByKind[bubble.kind];
  const language = bubble.kind === 'file'
    ? activityFileLanguage(bubble.message?.path, bubble.message?.input)
    : '';
  const questions = permissionQuestions(bubble.message?.permission_input);
  const answerReady = questions.length
    ? hasPermissionAnswers(questions, questionAnswers)
    : Boolean(answer.trim());
  const answerPayload = questions.length
    ? permissionAnswerPayload(questionAnswers)
    : answer.trim();
  const respond = (decision: string): void => {
    const requestId = bubble.message?.request_id;
    if (!claimPermissionSubmission(requestId)) return;
    setSubmitting(true);
    const sent = sendMessage({
      type: 'permission-response',
      request_id: requestId,
      decision,
      message: bubble.message?.tool_name === 'user_input'
        ? answerPayload
        : '',
    });
    if (!sent) {
      releasePermissionSubmission(requestId);
      setSubmitting(false);
    }
  };

  return (
    <Box
      ref={bubbleRef}
      data-testid="live2d-speech-bubble"
      role="status"
      aria-live="polite"
      position="fixed"
      left={`${position.left}px`}
      top={`${position.top}px`}
      width={`${width}px`}
      zIndex={900}
      pointerEvents="auto"
      onMouseEnter={() => {
        window.api?.updateComponentHover('live2d-speech-bubble', true);
      }}
      onMouseLeave={() => {
        window.api?.updateComponentHover('live2d-speech-bubble', false);
      }}
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
        {language && (
          <Badge
            flexShrink={0}
            borderRadius="4px"
            bg="rgba(102, 154, 180, 0.2)"
            color="#b7d9e9"
            fontFamily="mono"
            fontSize="2xs"
            px="1.5"
          >
            {language}
          </Badge>
        )}
        {bubble.status === 'running' && (
          <Icon as={LuLoaderCircle} boxSize="3.5" ml="auto" animation="spin 1s linear infinite" />
        )}
        {bubble.status === 'error' && (
          <Icon as={LuCircleAlert} boxSize="3.5" ml="auto" />
        )}
      </Flex>
      <Box
        ref={contentRef}
        maxH="min(360px, 42vh)"
        overflowY="auto"
        overflowX="hidden"
        overscrollBehavior="contain"
        color="#eef3f5"
        fontSize="sm"
        lineHeight="1.55"
        whiteSpace={bubble.kind === 'response' || bubble.kind === 'reasoning'
          ? 'normal'
          : 'pre-wrap'}
        overflowWrap="anywhere"
        wordBreak="break-word"
        userSelect="text"
        pr="1.5"
        onScroll={(event) => {
          const element = event.currentTarget;
          stickToBottomRef.current = (
            element.scrollHeight - element.scrollTop - element.clientHeight < 24
          );
        }}
        css={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${accent} rgba(255, 255, 255, 0.06)`,
        }}
      >
        {bubble.kind === 'response' || bubble.kind === 'reasoning' ? (
          <MarkdownMessage content={bubble.text} compact />
        ) : bubble.text}
      </Box>
      {permissionInteractive && bubble.message && (
        <Box mt="2.5" pt="2.5" borderTop="1px solid rgba(227, 194, 122, 0.24)">
          {bubble.message.tool_name === 'user_input' && questions.length > 0 && (
            <PermissionQuestionFields
              input={bubble.message.permission_input}
              answers={questionAnswers}
              onChange={setQuestionAnswers}
              placeholder={t('sidebar.permissionAnswer')}
              compact
            />
          )}
          {bubble.message.tool_name === 'user_input' && questions.length === 0 && (
            <Input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={t('sidebar.permissionAnswer')}
              size="sm"
              mb="2"
              bg="rgba(0, 0, 0, 0.24)"
              borderColor="rgba(227, 194, 122, 0.4)"
            />
          )}
          <Flex gap="2" wrap="wrap">
            {(bubble.message.options || []).map((option) => (
              <Button
                key={option.id}
                size="xs"
                variant={option.id === 'reject' ? 'outline' : 'solid'}
                bg={option.id === 'reject' ? 'transparent' : '#dce9f5'}
                color={option.id === 'reject' ? '#f1a1a7' : '#11181d'}
                borderColor={option.id === 'reject' ? '#7b484d' : '#dce9f5'}
                disabled={submitting || (
                  bubble.message?.tool_name === 'user_input'
                  && option.id !== 'reject'
                  && !answerReady
                )}
                onClick={() => respond(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </Flex>
        </Box>
      )}
      <Box
        aria-hidden="true"
        position="absolute"
        left={tailLeft}
        right={position.placement === 'left' ? '-8px' : undefined}
        top={position.placement === 'above' ? undefined : `${position.tailOffset - 8}px`}
        bottom={position.placement === 'above' ? '-8px' : undefined}
        width="16px"
        height="16px"
        bg="rgba(14, 20, 24, 0.96)"
        borderTop={position.placement === 'left'
          ? '1px solid rgba(190, 208, 218, 0.42)'
          : undefined}
        borderRight={position.placement !== 'right'
          ? '1px solid rgba(190, 208, 218, 0.42)'
          : undefined}
        borderBottom={position.placement !== 'left'
          ? '1px solid rgba(190, 208, 218, 0.42)'
          : undefined}
        borderLeft={position.placement === 'right'
          ? '1px solid rgba(190, 208, 218, 0.42)'
          : undefined}
        transform="rotate(45deg)"
      />
    </Box>
  );
}
