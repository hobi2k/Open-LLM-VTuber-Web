import {
  LuBell,
  LuBrain,
  LuCircleAlert,
  LuCircleCheck,
  LuFilePenLine,
  LuHand,
  LuLoaderCircle,
  LuMic,
  LuMicOff,
  LuMonitor,
  LuSend,
  LuTerminal,
  LuWrench,
  LuX,
} from 'react-icons/lu';
import {
  Box,
  Flex,
  Icon,
  IconButton,
  Spinner,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  FormEvent, useState, useEffect, useCallback, useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useInputSubtitle } from '@/hooks/electron/use-input-subtitle';
import { useDraggable } from '@/hooks/electron/use-draggable';
import { inputSubtitleStyles } from './electron-style';
import { useMode } from '@/context/mode-context';
import { Message } from '@/services/websocket-service';
import {
  activityInput,
  activityOutput,
  activityTitle,
} from '@/utils/agent-activity';

function PetTimelineMessage({ message }: { message: Message }): JSX.Element {
  const { t } = useTranslation();

  if (message.type === 'reasoning') {
    return (
      <Box {...inputSubtitleStyles.reasoningMessage}>
        <Flex align="center" gap="2" color="#a9d2ed" mb={message.content ? '1.5' : '0'}>
          {message.status === 'running' ? <Spinner size="xs" /> : <LuBrain size={15} />}
          <Text fontSize="xs" fontWeight="semibold">{t('sidebar.reasoning')}</Text>
        </Flex>
        {message.content && <Text {...inputSubtitleStyles.timelineText}>{message.content}</Text>}
      </Box>
    );
  }

  if (message.type === 'agent_activity') {
    const kind = message.activity_kind || 'tool';
    const labels = {
      command: t('sidebar.activityCommand'),
      file: t('sidebar.activityFile'),
      tool: t('sidebar.activityTool'),
    };
    const ActivityIcon = {
      command: LuTerminal,
      file: LuFilePenLine,
      tool: LuWrench,
    }[kind];
    const StatusIcon = {
      error: LuCircleAlert,
      completed: LuCircleCheck,
      running: LuLoaderCircle,
    }[message.status || 'running'];
    const input = activityInput(message.input);
    const output = activityOutput(message.output);
    const title = activityTitle(message.title, message.tool_name, message.input);
    const displayTitle = title !== message.command && title !== message.path ? title : '';

    return (
      <Box {...inputSubtitleStyles.activityMessage}>
        <Flex gap="2.5" align="flex-start" minW="0">
          <Flex {...inputSubtitleStyles.activityIcon}>
            <ActivityIcon size={15} />
          </Flex>
          <Box minW="0" flex="1">
            <Flex align="center" gap="2" minW="0">
              <Text color="#7f929e" fontSize="2xs" fontWeight="semibold">
                {labels[kind]}
              </Text>
              <Icon
                as={StatusIcon}
                boxSize="3.5"
                color={message.status === 'error' ? '#ee9097' : '#73c99d'}
              />
            </Flex>
            {displayTitle && (
              <Text {...inputSubtitleStyles.activityTitle}>{displayTitle}</Text>
            )}
            {(message.command || message.path || input) && (
              <Text {...inputSubtitleStyles.activityCode}>
                {message.command ? `$ ${message.command}` : message.path || input}
              </Text>
            )}
            {output && <Text {...inputSubtitleStyles.activityOutput}>{output}</Text>}
          </Box>
        </Flex>
      </Box>
    );
  }

  return (
    <Flex justify={message.role === 'human' ? 'flex-end' : 'flex-start'}>
      <Box {...inputSubtitleStyles.textMessage(message.role)}>
        <Text {...inputSubtitleStyles.timelineText}>{message.content}</Text>
      </Box>
    </Flex>
  );
}

export function InputSubtitle() {
  const { t } = useTranslation();
  const {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    handleSend,
    timelineMessages,
    aiState,
    micOn,
  } = useInputSubtitle();

  const { mode, setMode } = useMode();
  const isPet = mode === 'pet';

  const {
    elementRef,
    isDragging,
    handleMouseDown,
    handleMouseEnter,
    handleMouseLeave,
  } = useDraggable({
    componentId: 'input-subtitle',
  });

  const [isVisible, setIsVisible] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = useCallback(() => {
    if (isPet) {
      (window.api as any)?.updateComponentHover('input-subtitle', false);
    }
    setIsVisible(false);
  }, [isPet]);

  const handleOpen = () => {
    setIsVisible(true);
  };

  useEffect(() => {
    if (isPet) {
      const cleanup = (window.api as any)?.onToggleInputSubtitle(() => {
        if (isVisible) {
          handleClose();
        } else {
          handleOpen();
        }
      });
      return () => cleanup?.();
    }
    return () => {};
  }, [handleClose, isPet, isVisible]);

  useEffect(() => {
    (window as any).inputSubtitle = {
      open: handleOpen,
      close: handleClose,
    };

    return () => {
      delete (window as any).inputSubtitle;
    };
  }, [isPet, handleClose]);

  useEffect(() => {
    const element = timelineRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [timelineMessages, aiState]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = '0px';
    input.style.height = `${Math.min(Math.max(input.scrollHeight, 58), 132)}px`;
  }, [inputValue]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (inputValue.trim()) handleSend();
  };

  if (!isVisible) return null;

  return (
    <Box
      ref={elementRef}
      {...inputSubtitleStyles.container}
      {...inputSubtitleStyles.draggableContainer(isDragging)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box {...inputSubtitleStyles.box}>
        <Box
          {...inputSubtitleStyles.statusBox}
          onMouseDown={handleMouseDown}
        >
          <Flex align="center" justify="space-between" color="whiteAlpha.700">
            <Flex align="center" gap="2">
              <LuBell size={16} />
              <Text {...inputSubtitleStyles.statusText}>
                {aiState}
              </Text>
            </Flex>

            <Flex gap="2">
              <IconButton
                aria-label={t('sidebar.windowMode')}
                title={t('sidebar.windowMode')}
                onClick={() => setMode('window')}
                {...inputSubtitleStyles.iconButton}
              >
                <LuMonitor size={16} />
              </IconButton>
              <IconButton
                aria-label="Toggle microphone"
                onClick={handleMicToggle}
                {...inputSubtitleStyles.iconButton}
              >
                {micOn ? <LuMic size={16} /> : <LuMicOff size={16} />}
              </IconButton>
              <IconButton
                aria-label="Interrupt"
                onClick={handleInterrupt}
                {...inputSubtitleStyles.iconButton}
              >
                <LuHand size={16} />
              </IconButton>
              <IconButton
                aria-label="Close chat"
                title="Close chat"
                onClick={handleClose}
                {...inputSubtitleStyles.iconButton}
              >
                <LuX size={16} />
              </IconButton>
            </Flex>
          </Flex>
        </Box>

        <Box ref={timelineRef} {...inputSubtitleStyles.timeline}>
          {timelineMessages.length ? timelineMessages.map((message) => (
            <PetTimelineMessage key={message.id} message={message} />
          )) : (
            <Text {...inputSubtitleStyles.emptyText}>{t('sidebar.noMessages')}</Text>
          )}
        </Box>

        <Box as="form" onSubmit={handleSubmit} {...inputSubtitleStyles.inputBox}>
          <Flex gap="2" p="2.5" align="flex-end">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={t('footer.typeYourMessage')}
              aria-label={t('footer.typeYourMessage')}
              rows={2}
              {...inputSubtitleStyles.input}
            />
            <IconButton
              type="submit"
              aria-label={t('footer.send')}
              title={t('footer.send')}
              disabled={!inputValue.trim()}
              {...inputSubtitleStyles.sendButton}
            >
              <LuSend size={16} />
            </IconButton>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
