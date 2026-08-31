import { ChangeEvent, KeyboardEvent } from 'react';
import { useChatHistory } from '@/context/chat-history-context';
import { useVAD } from '@/context/vad-context';
import { useMicToggle } from '@/hooks/utils/use-mic-toggle';
import { useTextInput } from '@/hooks/footer/use-text-input';
import { useAiState } from '@/context/ai-state-context';
import { useInterrupt } from '@/hooks/utils/use-interrupt';

export function useInputSubtitle() {
  const {
    inputText: inputValue,
    setInputText: handleChange,
    handleKeyPress: handleKey,
    handleCompositionStart,
    handleCompositionEnd,
    handleSend,

  } = useTextInput();

  const { messages } = useChatHistory();
  const { startMic, autoStartMicOn } = useVAD();
  const { handleMicToggle, micOn } = useMicToggle();
  const { aiState } = useAiState();
  const { interrupt } = useInterrupt();

  const visibleMessages = messages
    .filter((message) => message.type !== 'tool_call_status'
      && (message.type !== 'text' || Boolean(message.content.trim())));
  const latestHumanIndex = visibleMessages
    .map((message) => message.role === 'human')
    .lastIndexOf(true);
  const activeTurn = latestHumanIndex >= 0
    ? visibleMessages.slice(latestHumanIndex)
    : [];
  const timelineMessages = activeTurn.length >= 80
    ? activeTurn
    : visibleMessages.slice(-80);

  const handleInterrupt = () => {
    interrupt();
    if (autoStartMicOn) {
      startMic();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    handleChange(e);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    handleKey(e);
  };

  return {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    timelineMessages,
    aiState,
    micOn,
    handleSend,
  };
}
