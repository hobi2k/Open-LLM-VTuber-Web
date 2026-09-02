import { describe, expect, it } from 'vitest';
import { Message } from '@/services/websocket-service';
import {
  latestPetDisplayMessage,
  petSpeechBubblePosition,
} from './pet-speech-bubble';

function message(value: Partial<Message> & Pick<Message, 'id' | 'type'>): Message {
  return {
    content: '',
    role: 'ai',
    timestamp: '2026-09-02T00:00:00.000Z',
    ...value,
  };
}

describe('pet speech bubble', () => {
  it('keeps the final response visible after a later reasoning completion update', () => {
    const messages = [
      message({ id: 'human', type: 'text', role: 'human', content: 'Fix it' }),
      message({ id: 'reasoning', type: 'reasoning', content: 'Working', status: 'completed', timestamp: '2026-09-02T00:00:03.000Z' }),
      message({ id: 'answer', type: 'text', content: 'Done', timestamp: '2026-09-02T00:00:02.000Z' }),
    ];

    expect(latestPetDisplayMessage(messages)?.id).toBe('answer');
  });

  it('places a bubble beside the model when the requested side has room', () => {
    const position = petSpeechBubblePosition({
      placement: 'right',
      anchor: {
        x: 500, y: 180, bottom: 700, left: 380, right: 620, ready: true,
      },
      bubbleWidth: 300,
      bubbleHeight: 200,
      viewportWidth: 1200,
      viewportHeight: 800,
      margin: 16,
      gap: 20,
    });

    expect(position.placement).toBe('right');
    expect(position.left).toBe(640);
    expect(position.top).toBe(340);
  });

  it('uses the opposite side when the requested side is outside the viewport', () => {
    const position = petSpeechBubblePosition({
      placement: 'right',
      anchor: {
        x: 900, y: 180, bottom: 700, left: 800, right: 1000, ready: true,
      },
      bubbleWidth: 300,
      bubbleHeight: 200,
      viewportWidth: 1100,
      viewportHeight: 800,
      margin: 16,
      gap: 20,
    });

    expect(position.placement).toBe('left');
    expect(position.left).toBe(480);
  });
});
