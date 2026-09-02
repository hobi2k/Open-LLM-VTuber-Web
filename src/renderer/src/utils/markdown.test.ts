import { describe, expect, it } from 'vitest';
import { closeStreamingCodeFence } from './markdown';

describe('streaming markdown', () => {
  it('temporarily closes an unfinished backtick fence', () => {
    expect(closeStreamingCodeFence('Answer\n```ts\nconst ready = true;'))
      .toBe('Answer\n```ts\nconst ready = true;\n```');
  });

  it('preserves completed fences and inline code', () => {
    const completed = 'Use `npm test`.\n```text@sugaya-takuo\nhello\n```';
    expect(closeStreamingCodeFence(completed)).toBe(completed);
  });

  it('matches the opening marker and fence length', () => {
    expect(closeStreamingCodeFence('~~~~md\n**streaming**\n~~~'))
      .toBe('~~~~md\n**streaming**\n~~~\n~~~~');
  });

  it('does not treat an inline triple backtick as a block fence', () => {
    const inline = 'Keep ``` inside this sentence.';
    expect(closeStreamingCodeFence(inline)).toBe(inline);
  });
});
