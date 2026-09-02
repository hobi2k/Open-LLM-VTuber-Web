import { PetBubblePlacement } from '@/context/pet-ui-context';
import { Live2DScreenAnchor } from '@/hooks/canvas/use-live2d-screen-anchor';
import { Message } from '@/services/websocket-service';

export interface PetSpeechBubblePosition {
  left: number;
  top: number;
  placement: PetBubblePlacement;
  tailOffset: number;
}

interface PositionInput {
  placement: PetBubblePlacement;
  anchor: Live2DScreenAnchor;
  bubbleWidth: number;
  bubbleHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  margin: number;
  gap: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function availablePlacement(
  input: PositionInput,
  spaceOnLeft: number,
  spaceOnRight: number,
): PetBubblePlacement {
  if (input.placement === 'left' && spaceOnLeft < input.bubbleWidth) {
    if (spaceOnRight >= input.bubbleWidth) return 'right';
    return 'above';
  }
  if (input.placement === 'right' && spaceOnRight < input.bubbleWidth) {
    if (spaceOnLeft >= input.bubbleWidth) return 'left';
    return 'above';
  }
  return input.placement;
}

export function currentPetTurn(messages: Message[]): Message[] {
  const latestHumanIndex = messages
    .map((message) => message.role === 'human')
    .lastIndexOf(true);
  if (latestHumanIndex < 0) return [];
  return messages.slice(latestHumanIndex);
}

export function latestPetDisplayMessage(messages: Message[]): Message | undefined {
  const displayMessages = currentPetTurn(messages).filter((message) => (
    message.role === 'ai' && (
      message.type === 'reasoning'
      || message.type === 'agent_activity'
      || message.type === 'permission'
      || (message.type === 'text' && Boolean(message.content.trim()))
    )
  ));
  const finalResponse = [...displayMessages]
    .reverse()
    .find((message) => message.type === 'text' && Boolean(message.content.trim()));
  if (finalResponse) return finalResponse;

  return displayMessages
    .map((message, index) => ({ message, index }))
    .sort((left, right) => (
      new Date(right.message.timestamp).getTime()
      - new Date(left.message.timestamp).getTime()
      || right.index - left.index
    ))[0]?.message;
}

export function petSpeechBubblePosition(input: PositionInput): PetSpeechBubblePosition {
  const spaceOnLeft = input.anchor.left - input.gap - input.margin;
  const spaceOnRight = input.viewportWidth - input.anchor.right - input.gap - input.margin;
  const placement = availablePlacement(input, spaceOnLeft, spaceOnRight);
  const maximumLeft = input.viewportWidth - input.bubbleWidth - input.margin;
  const maximumTop = input.viewportHeight - input.bubbleHeight - input.margin;

  if (placement === 'above') {
    const left = clamp(
      input.anchor.x - input.bubbleWidth / 2,
      input.margin,
      maximumLeft,
    );
    return {
      left,
      top: clamp(
        input.anchor.y - input.bubbleHeight - input.gap,
        input.margin,
        maximumTop,
      ),
      placement,
      tailOffset: clamp(input.anchor.x - left, 24, input.bubbleWidth - 24),
    };
  }

  const centerY = (input.anchor.y + input.anchor.bottom) / 2;
  const top = clamp(
    centerY - input.bubbleHeight / 2,
    input.margin,
    maximumTop,
  );
  return {
    left: placement === 'left'
      ? clamp(
        input.anchor.left - input.bubbleWidth - input.gap,
        input.margin,
        maximumLeft,
      )
      : clamp(input.anchor.right + input.gap, input.margin, maximumLeft),
    top,
    placement,
    tailOffset: clamp(centerY - top, 24, input.bubbleHeight - 24),
  };
}
