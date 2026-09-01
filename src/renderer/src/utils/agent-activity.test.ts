import { describe, expect, it } from 'vitest';
import {
  activityFileLanguage,
  activityInput,
  activityOutput,
  activityTitle,
} from './agent-activity';

describe('agent activity formatting', () => {
  it('detects file languages from native paths', () => {
    expect(activityFileLanguage('/workspace/src/panel.tsx')).toBe('TSX');
    expect(activityFileLanguage('service.py')).toBe('Python');
    expect(activityFileLanguage('Cargo.toml')).toBe('TOML');
  });

  it('detects a file path embedded in tool input', () => {
    expect(activityFileLanguage(undefined, '{"file_path":"src/main.rs"}')).toBe('Rust');
  });

  it('keeps readable tool titles and inputs', () => {
    expect(activityTitle('write', 'write', '{"title":"Update settings"}'))
      .toBe('Update settings');
    expect(activityInput('{"query":"session"}')).toBe('session');
  });

  it('does not truncate long command output', () => {
    const output = 'line\n'.repeat(2400);
    expect(activityOutput(output)).toBe(output.trim());
  });
});
