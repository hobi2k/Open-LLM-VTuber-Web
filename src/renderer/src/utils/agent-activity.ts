const MAX_ACTIVITY_TEXT = 6000;

function clip(value: string): string {
  const text = value.trim();
  if (text.length <= MAX_ACTIVITY_TEXT) return text;
  return `${text.slice(0, MAX_ACTIVITY_TEXT)}\n...`;
}

function parseJson(value: string): unknown {
  const text = value.trim();
  if (!text.startsWith('{') && !text.startsWith('[')) return value;
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readableOutput(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    const parsed = parseJson(value);
    return parsed === value ? clip(value) : readableOutput(parsed);
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return clip(value.map(readableOutput).filter(Boolean).join('\n'));
  }
  if (!isRecord(value)) return '';

  const preferred = ['content', 'text', 'output', 'result', 'message', 'summary'];
  const preferredText = preferred
    .map((key) => (key in value ? readableOutput(value[key]) : ''))
    .find(Boolean);
  if (preferredText) return preferredText;

  return clip(Object.entries(value)
    .filter(([key, item]) => key !== 'type'
      && key !== 'id'
      && ['string', 'number', 'boolean'].includes(typeof item))
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join('\n'));
}

function readableInput(value: unknown): string {
  if (typeof value !== 'string') return '';
  const parsed = parseJson(value);
  if (!isRecord(parsed)) return clip(value);

  const fields = [
    'query', 'q', 'url', 'pattern', 'selector', 'target',
    'workspace', 'workdir', 'cwd', 'prompt',
  ].flatMap((key) => {
    const item = parsed[key];
    if (!['string', 'number', 'boolean'].includes(typeof item)) return [];
    const text = String(item).trim();
    return text ? [[key, text] as const] : [];
  });

  if (fields.length === 1) return clip(fields[0][1]);
  return clip(fields.map(([key, item]) => `${key}: ${item}`).join('\n'));
}

export function activityInput(value?: string): string {
  return value ? readableInput(value) : '';
}

export function activityOutput(value?: string): string {
  return value ? readableOutput(value) : '';
}

export function activityTitle(
  title?: string,
  toolName?: string,
  input?: string,
): string {
  const fallback = title || toolName || 'Tool';
  if (!input || !toolName || fallback.toLowerCase() !== toolName.toLowerCase()) {
    return fallback;
  }
  const parsed = parseJson(input);
  if (!isRecord(parsed)) return fallback;
  return ['title', 'description', 'label']
    .map((key) => (typeof parsed[key] === 'string' ? parsed[key].trim() : ''))
    .find(Boolean) || fallback;
}
