import {
  LuHand,
  LuMic,
  LuMicOff,
  LuMonitor,
  LuPaperclip,
  LuSend,
} from 'react-icons/lu';
import {
  Box,
  IconButton,
  Textarea,
} from '@chakra-ui/react';
import {
  ChangeEvent, FormEvent, useState, useEffect, useCallback, useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useInputSubtitle } from '@/hooks/electron/use-input-subtitle';
import { useDraggable } from '@/hooks/electron/use-draggable';
import { useLive2DScreenAnchor } from '@/hooks/canvas/use-live2d-screen-anchor';
import { usePetInteractiveRegion } from '@/hooks/electron/use-pet-interactive-region';
import { inputSubtitleStyles } from './electron-style';
import { useMode } from '@/context/mode-context';
import { useRuntimeSlashCommands } from '@/hooks/utils/use-runtime-slash-commands';
import { SlashCommandMenu } from '@/components/shared/slash-command-menu';
import { IMAGE_ATTACHMENT_ACCEPT } from '@/context/image-attachment-context';
import { ImageAttachmentStrip } from '@/components/shared/image-attachment-strip';

const DOCK_WIDTH = 460;
const VIEWPORT_MARGIN = 16;
const MODEL_GAP = 14;

export function InputSubtitle() {
  const { t } = useTranslation();
  const {
    inputValue,
    setInputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    handleSend,
    aiState,
    micOn,
    attachments,
    addFiles,
    removeAttachment,
  } = useInputSubtitle();

  const { mode, setMode } = useMode();
  const anchor = useLive2DScreenAnchor();
  const isPet = mode === 'pet';
  const { elementRef, handleMouseEnter, handleMouseLeave } = useDraggable({
    componentId: 'input-subtitle',
  });
  const [isVisible, setIsVisible] = useState(true);
  const [dockHeight, setDockHeight] = useState(60);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slash = useRuntimeSlashCommands(inputValue, setInputValue);

  const handleClose = useCallback(() => {
    if (isPet) {
      (window.api as any)?.updateComponentHover('input-subtitle', false);
    }
    setIsVisible(false);
  }, [isPet]);

  const handleOpen = useCallback(() => setIsVisible(true), []);

  useEffect(() => {
    if (!isPet) return undefined;
    const cleanup = (window.api as any)?.onToggleInputSubtitle(() => {
      if (isVisible) handleClose();
      else handleOpen();
    });
    return () => cleanup?.();
  }, [handleClose, handleOpen, isPet, isVisible]);

  useEffect(() => {
    (window as any).inputSubtitle = {
      open: handleOpen,
      close: handleClose,
    };

    return () => {
      delete (window as any).inputSubtitle;
    };
  }, [handleClose, handleOpen]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = '0px';
    input.style.height = `${Math.min(Math.max(input.scrollHeight, 44), 108)}px`;
  }, [inputValue]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;
    const updateHeight = () => setDockHeight(element.getBoundingClientRect().height);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);

  usePetInteractiveRegion('input-subtitle', elementRef, isPet && isVisible, 48);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (inputValue.trim() || attachments.length) handleSend();
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = '';
    if (files.length) await addFiles(files);
  };

  if (!isVisible) return null;

  const width = Math.min(DOCK_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(anchor.x - width / 2, window.innerWidth - width - VIEWPORT_MARGIN),
  );
  const top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(anchor.bottom + MODEL_GAP, window.innerHeight - dockHeight - VIEWPORT_MARGIN),
  );

  return (
    <Box
      ref={elementRef}
      as="form"
      data-testid="pet-input-dock"
      onSubmit={handleSubmit}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...inputSubtitleStyles.container}
      left={`${left}px`}
      top={`${top}px`}
      width={`${width}px`}
    >
      {attachments.length > 0 && (
        <Box mb="1.5" px="1" maxW="100%">
          <ImageAttachmentStrip
            attachments={attachments}
            onRemove={removeAttachment}
          />
        </Box>
      )}
      <Box {...inputSubtitleStyles.dock}>
        {slash.open && (
          <SlashCommandMenu
            commands={slash.commands}
            selectedIndex={slash.selectedIndex}
            onSelect={slash.select}
            onHighlight={slash.setSelectedIndex}
          />
        )}
        <IconButton
          type="button"
          aria-label={t('footer.attachImages')}
          title={t('footer.attachImages')}
          onClick={() => fileInputRef.current?.click()}
          {...inputSubtitleStyles.iconButton}
        >
          <LuPaperclip size={17} />
        </IconButton>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ATTACHMENT_ACCEPT}
          multiple
          hidden
          onChange={handleFiles}
        />
        <IconButton
          type="button"
          aria-label={t('sidebar.windowMode')}
          title={t('sidebar.windowMode')}
          onClick={() => setMode('window')}
          {...inputSubtitleStyles.iconButton}
        >
          <LuMonitor size={17} />
        </IconButton>
        <IconButton
          type="button"
          aria-label="Toggle microphone"
          title="Toggle microphone"
          onClick={handleMicToggle}
          {...inputSubtitleStyles.iconButton}
        >
          {micOn ? <LuMic size={17} /> : <LuMicOff size={17} />}
        </IconButton>
        <Textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(event) => {
            if (!slash.handleKeyDown(event)) handleKeyPress(event);
          }}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={t('footer.typeYourMessage')}
          aria-label={t('footer.typeYourMessage')}
          rows={1}
          {...inputSubtitleStyles.input}
        />
        <IconButton
          type="button"
          aria-label="Interrupt"
          title="Interrupt"
          onClick={handleInterrupt}
          disabled={aiState !== 'thinking-speaking'}
          {...inputSubtitleStyles.iconButton}
        >
          <LuHand size={17} />
        </IconButton>
        <IconButton
          type="submit"
          aria-label={t('footer.send')}
          title={t('footer.send')}
          disabled={!inputValue.trim() && !attachments.length}
          {...inputSubtitleStyles.sendButton}
        >
          <LuSend size={17} />
        </IconButton>
      </Box>
    </Box>
  );
}
