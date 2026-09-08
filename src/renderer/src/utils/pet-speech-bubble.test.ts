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

  it('surfaces a pending permission request over reasoning and earlier text', () => {
    const messages = [
      message({ id: 'human', type: 'text', role: 'human', content: 'Run it' }),
      message({ id: 'answer', type: 'text', content: 'Let me check.', timestamp: '2026-09-02T00:00:01.000Z' }),
      message({ id: 'reasoning', type: 'reasoning', content: 'Thinking', status: 'running', timestamp: '2026-09-02T00:00:03.000Z' }),
      message({ id: 'perm', type: 'permission', status: 'running', title: 'Run bash', timestamp: '2026-09-02T00:00:02.000Z' }),
    ];

    // Even though reasoning has the newest timestamp, the pending permission wins.
    expect(latestPetDisplayMessage(messages, true)?.id).toBe('perm');
  });

  it('shows live reasoning while the turn is still thinking', () => {
    const messages = [
      message({ id: 'human', type: 'text', role: 'human', content: 'Explain' }),
      message({ id: 'early', type: 'text', content: 'Starting', timestamp: '2026-09-02T00:00:01.000Z' }),
      message({ id: 'reasoning', type: 'reasoning', content: 'Reasoning now', status: 'running', timestamp: '2026-09-02T00:00:04.000Z' }),
    ];

    // While thinking, the streaming reasoning is shown, not the earlier text.
    expect(latestPetDisplayMessage(messages, true)?.id).toBe('reasoning');
    // Once settled, the final text answer is preferred again.
    expect(latestPetDisplayMessage(messages, false)?.id).toBe('early');
  });

  it('does not force a resolved permission over the final answer', () => {
    const messages = [
      message({ id: 'human', type: 'text', role: 'human', content: 'Go' }),
      message({ id: 'perm', type: 'permission', status: 'completed', title: 'Run bash', timestamp: '2026-09-02T00:00:01.000Z' }),
      message({ id: 'answer', type: 'text', content: 'Finished', timestamp: '2026-09-02T00:00:02.000Z' }),
    ];

    expect(latestPetDisplayMessage(messages, false)?.id).toBe('answer');
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
