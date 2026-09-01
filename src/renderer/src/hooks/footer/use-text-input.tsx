import { ChangeEvent, KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '@/context/websocket-context';
import { useAiState } from '@/context/ai-state-context';
import { useInterrupt } from '@/components/canvas/live2d';
import { useChatHistory } from '@/context/chat-history-context';
import { useVAD } from '@/context/vad-context';
import { useMediaCapture } from '@/hooks/utils/use-media-capture';
import { useImageAttachments } from '@/context/image-attachment-context';

export function useTextInput() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const wsContext = useWebSocket();
  const { aiState } = useAiState();
  const { interrupt } = useInterrupt();
  const { appendHumanMessage } = useChatHistory();
  const { stopMic, autoStopMic } = useVAD();
  const { captureAllMedia } = useMediaCapture();
  const {
    attachments,
    addFiles,
    removeAttachment,
    clearAttachments,
  } = useImageAttachments();

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setInputText(e.target.value);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if ((!text && !attachments.length) || !wsContext) return;
    if (aiState === 'thinking-speaking') {
      interrupt();
    }

    const images = [
      ...(await captureAllMedia()),
      ...attachments.map((attachment) => ({
        source: attachment.source,
        data: attachment.data,
        // WebSocket contract uses the backend's snake_case field name.
        // eslint-disable-next-line camelcase
        mime_type: attachment.mimeType,
      })),
    ];

    const sent = wsContext.sendMessage({
      type: 'text-input',
      text,
      images,
    });
    if (!sent) return;

    appendHumanMessage(text || t('footer.imageOnlyMessage', { count: attachments.length }));

    if (autoStopMic) stopMic();
    setInputText('');
    clearAttachments();
  };

  const handleKeyPress = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  return {
    inputText,
    setInputText: handleInputChange,
    setInputValue: setInputText,
    handleSend,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    attachments,
    addFiles,
    removeAttachment,
  };
}
