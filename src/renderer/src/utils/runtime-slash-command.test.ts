import { describe, expect, it } from 'vitest';
import {
  filterRuntimeCommands,
  moveSlashCommandIndex,
  slashCommandQuery,
} from './runtime-slash-command';
import type { RuntimeCommand } from '@/hooks/sidebar/setting/use-agent-settings';

const commands = [
  {
    name: 'review',
    description: 'Review changed code',
    source: 'command',
    runtime: 'opencode',
    invocation: '/review',
  },
  {
    name: 'browser:control',
    description: 'Control the browser',
    source: 'skill',
    runtime: 'codex',
    invocation: '/browser:control',
  },
] satisfies RuntimeCommand[];

describe('runtime slash commands', () => {
  it('opens only for a single slash token and filters skills and commands', () => {
    expect(slashCommandQuery('/bro')).toBe('bro');
    expect(slashCommandQuery('/bro extra')).toBeNull();
    expect(filterRuntimeCommands(commands, 'browser')).toEqual([commands[1]]);
    expect(filterRuntimeCommands(commands, 'code')).toEqual([commands[0]]);
  });

  it('wraps keyboard selection in both directions', () => {
    expect(moveSlashCommandIndex(1, 2, 'next')).toBe(0);
    expect(moveSlashCommandIndex(0, 2, 'previous')).toBe(1);
  });
});
