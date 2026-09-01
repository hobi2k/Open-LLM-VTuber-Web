/* eslint-disable react/require-default-props */
import {
  Box, Textarea, IconButton, HStack,
} from '@chakra-ui/react';
import { BsMicFill, BsMicMuteFill, BsPaperclip } from 'react-icons/bs';
import { IoHandRightSharp } from 'react-icons/io5';
import { FiChevronDown } from 'react-icons/fi';
import { ChangeEvent, memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { InputGroup } from '@/components/ui/input-group';
import { footerStyles } from './footer-styles';
import AIStateIndicator from './ai-state-indicator';
import { useFooter } from '@/hooks/footer/use-footer';
import { useRuntimeSlashCommands } from '@/hooks/utils/use-runtime-slash-commands';
import { SlashCommandMenu } from '@/components/shared/slash-command-menu';
import {
  IMAGE_ATTACHMENT_ACCEPT,
  ImageAttachment,
} from '@/context/image-attachment-context';
import { ImageAttachmentStrip } from '@/components/shared/image-attachment-strip';

// Type definitions
interface FooterProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface ToggleButtonProps {
  isCollapsed: boolean
  onToggle?: () => void
}

interface ActionButtonsProps {
  micOn: boolean
  onMicToggle: () => void
  onInterrupt: () => void
}

interface MessageInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onCompositionStart: () => void
  onCompositionEnd: () => void
  setValue: (value: string) => void
  attachments: ImageAttachment[]
  addFiles: (files: FileList | File[]) => Promise<void>
  removeAttachment: (id: string) => void
}

// Reusable components
const ToggleButton = memo(({ isCollapsed, onToggle }: ToggleButtonProps) => (
  <Box
    {...footerStyles.footer.toggleButton}
    onClick={onToggle}
    color="whiteAlpha.500"
    style={{
      transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
    }}
  >
    <FiChevronDown />
  </Box>
));

ToggleButton.displayName = 'ToggleButton';

function ActionButtonContent({ micOn, onMicToggle, onInterrupt }: ActionButtonsProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <HStack gap={2}>
      <IconButton
        aria-label={micOn ? t('footer.muteMic') : t('footer.unmuteMic')}
        title={micOn ? t('footer.muteMic') : t('footer.unmuteMic')}
        bg={micOn ? '#1f4939' : '#47262a'}
        color={micOn ? '#8de0b7' : '#f09aa0'}
        borderColor={micOn ? '#32664f' : '#6b383e'}
        {...footerStyles.footer.actionButton}
        onClick={onMicToggle}
      >
        {micOn ? <BsMicFill /> : <BsMicMuteFill />}
      </IconButton>
      <IconButton
        aria-label={t('footer.interrupt')}
        title={t('footer.interrupt')}
        bg="#3b3423"
        color="#e5c775"
        borderColor="#5b5032"
        {...footerStyles.footer.actionButton}
        onClick={onInterrupt}
      >
        <IoHandRightSharp size="19" />
      </IconButton>
    </HStack>
  );
}

const ActionButtons = memo(({ micOn, onMicToggle, onInterrupt }: ActionButtonsProps) => (
  <ActionButtonContent
    micOn={micOn}
    onMicToggle={onMicToggle}
    onInterrupt={onInterrupt}
  />
));

ActionButtons.displayName = 'ActionButtons';

const MessageInput = memo(({
  value,
  onChange,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  setValue,
  attachments,
  addFiles,
  removeAttachment,
}: MessageInputProps) => {
  const { t } = useTranslation();
  const slash = useRuntimeSlashCommands(value, setValue);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = '';
    if (files.length) await addFiles(files);
  };

  return (
    <InputGroup flex={1}>
      <Box position="relative" width="100%">
        {slash.open && (
          <SlashCommandMenu
            commands={slash.commands}
            selectedIndex={slash.selectedIndex}
            onSelect={slash.select}
            onHighlight={slash.setSelectedIndex}
          />
        )}
        <IconButton
          aria-label={t('footer.attachImages')}
          title={t('footer.attachImages')}
          variant="ghost"
          {...footerStyles.footer.attachButton}
          onClick={() => fileInputRef.current?.click()}
        >
          <BsPaperclip size="24" />
        </IconButton>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ATTACHMENT_ACCEPT}
          multiple
          hidden
          onChange={handleFiles}
        />
        {attachments.length > 0 && (
          <Box position="absolute" top="4px" left="44px" right="8px" zIndex={3}>
            <ImageAttachmentStrip
              attachments={attachments}
              onRemove={removeAttachment}
              compact
            />
          </Box>
        )}
        <Textarea
          value={value}
          onChange={onChange}
          onKeyDown={(event) => {
            if (!slash.handleKeyDown(event)) onKeyDown(event);
          }}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder={t('footer.typeYourMessage')}
          {...footerStyles.footer.input}
          paddingTop={attachments.length ? '34px' : '20px'}
        />
      </Box>
    </InputGroup>
  );
});

MessageInput.displayName = 'MessageInput';

// Main component
function Footer({ isCollapsed = false, onToggle }: FooterProps): JSX.Element {
  const {
    inputValue,
    setInputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    micOn,
    attachments,
    addFiles,
    removeAttachment,
  } = useFooter();

  return (
    <Box {...footerStyles.footer.container(isCollapsed)}>
      <ToggleButton isCollapsed={isCollapsed} onToggle={onToggle} />

      <Box pt="0" px="3.5">
        <HStack width="100%" gap={3} align="flex-end">
          <Box>
            <Box mb="1.5">
              <AIStateIndicator />
            </Box>
            <ActionButtons
              micOn={micOn}
              onMicToggle={handleMicToggle}
              onInterrupt={handleInterrupt}
            />
          </Box>

          <MessageInput
            value={inputValue}
            setValue={setInputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            attachments={attachments}
            addFiles={addFiles}
            removeAttachment={removeAttachment}
          />
        </HStack>
      </Box>
    </Box>
  );
}

export default Footer;
