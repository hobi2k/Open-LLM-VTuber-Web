interface MarkdownFence {
  character: '`' | '~';
  length: number;
}

function fenceAtStart(line: string): MarkdownFence | undefined {
  const match = line.match(/^[\t ]{0,3}(`{3,}|~{3,})/);
  if (!match) return undefined;
  return {
    character: match[1][0] as MarkdownFence['character'],
    length: match[1].length,
  };
}

function closesFence(line: string, fence: MarkdownFence): boolean {
  const value = line.trim();
  if (value.length < fence.length) return false;
  return [...value].every((character) => character === fence.character);
}

export function closeStreamingCodeFence(markdown: string): string {
  const openFence = markdown.split('\n').reduce<MarkdownFence | undefined>((open, line) => {
    if (open) return closesFence(line, open) ? undefined : open;
    return fenceAtStart(line);
  }, undefined);

  if (!openFence) return markdown;
  const separator = markdown.endsWith('\n') ? '' : '\n';
  return `${markdown}${separator}${openFence.character.repeat(openFence.length)}`;
}
