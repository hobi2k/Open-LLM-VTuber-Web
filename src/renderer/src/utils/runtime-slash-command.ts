import type { RuntimeCommand } from '@/hooks/sidebar/setting/use-agent-settings';

export function slashCommandQuery(inputValue: string): string | null {
  const match = inputValue.match(/^\/([^\s]*)$/);
  return match ? match[1].toLocaleLowerCase() : null;
}

export function filterRuntimeCommands(
  commands: RuntimeCommand[],
  query: string,
): RuntimeCommand[] {
  return commands
    .filter((command) => !query
      || command.name.toLocaleLowerCase().includes(query)
      || command.description.toLocaleLowerCase().includes(query))
    .slice(0, 80);
}

export function moveSlashCommandIndex(
  currentIndex: number,
  commandCount: number,
  direction: 'next' | 'previous',
): number {
  if (!commandCount) return 0;
  const delta = direction === 'next' ? 1 : -1;
  return (currentIndex + delta + commandCount) % commandCount;
}
