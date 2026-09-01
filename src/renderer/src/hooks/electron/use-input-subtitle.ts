import { ChangeEvent, KeyboardEvent } from 'react';
import { useVAD } from '@/context/vad-context';
import { useMicToggle } from '@/hooks/utils/use-mic-toggle';
import { useTextInput } from '@/hooks/footer/use-text-input';
import { useAiState } from '@/context/ai-state-context';
import { useInterrupt } from '@/hooks/utils/use-interrupt';

export function useInputSubtitle() {
  const {
    inputText: inputValue,
    setInputText: handleChange,
    setInputValue,
    handleKeyPress: handleKey,
    handleCompositionStart,
    handleCompositionEnd,
    handleSend,

  } = useTextInput();

  const { startMic, autoStartMicOn } = useVAD();
  const { handleMicToggle, micOn } = useMicToggle();
  const { aiState } = useAiState();
  const { interrupt } = useInterrupt();

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
    setInputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    aiState,
    micOn,
    handleSend,
  };
}
