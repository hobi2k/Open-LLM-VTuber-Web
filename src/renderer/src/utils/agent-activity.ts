const FILE_LANGUAGES: Record<string, string> = {
  c: 'C',
  cc: 'C++',
  cpp: 'C++',
  cs: 'C#',
  css: 'CSS',
  dart: 'Dart',
  go: 'Go',
  gql: 'GraphQL',
  graphql: 'GraphQL',
  h: 'C/C++',
  hpp: 'C++',
  html: 'HTML',
  java: 'Java',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  kt: 'Kotlin',
  kts: 'Kotlin',
  lua: 'Lua',
  md: 'Markdown',
  mjs: 'JavaScript',
  php: 'PHP',
  prisma: 'Prisma',
  py: 'Python',
  rb: 'Ruby',
  rs: 'Rust',
  sass: 'Sass',
  scss: 'SCSS',
  sh: 'Shell',
  sql: 'SQL',
  svelte: 'Svelte',
  swift: 'Swift',
  toml: 'TOML',
  ts: 'TypeScript',
  tsx: 'TSX',
  vue: 'Vue',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  zsh: 'Shell',
};

function normalizeText(value: string): string {
  return value.trim();
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
    return parsed === value ? normalizeText(value) : readableOutput(parsed);
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return normalizeText(value.map(readableOutput).filter(Boolean).join('\n'));
  }
  if (!isRecord(value)) return '';

  const preferred = ['content', 'text', 'output', 'result', 'message', 'summary'];
  const preferredText = preferred
    .map((key) => (key in value ? readableOutput(value[key]) : ''))
    .find(Boolean);
  if (preferredText) return preferredText;

  return normalizeText(Object.entries(value)
    .filter(([key, item]) => key !== 'type'
      && key !== 'id'
      && ['string', 'number', 'boolean'].includes(typeof item))
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join('\n'));
}

function readableInput(value: unknown): string {
  if (value === null || value === undefined) return '';
  const parsed = typeof value === 'string' ? parseJson(value) : value;
  if (!isRecord(parsed)) return readableOutput(value);

  const fields = [
    'query', 'q', 'url', 'pattern', 'selector', 'target',
    'workspace', 'workdir', 'cwd', 'prompt',
  ].flatMap((key) => {
    const item = parsed[key];
    if (!['string', 'number', 'boolean'].includes(typeof item)) return [];
    const text = String(item).trim();
    return text ? [[key, text] as const] : [];
  });

  if (fields.length === 1) return normalizeText(fields[0][1]);
  return normalizeText(fields.map(([key, item]) => `${key}: ${item}`).join('\n'));
}

export function activityInput(value?: unknown): string {
  return value === undefined ? '' : readableInput(value);
}

export function activityOutput(value?: string): string {
  return value ? readableOutput(value) : '';
}

export function activityTitle(
  title?: string,
  toolName?: string,
  input?: unknown,
): string {
  const fallback = title || toolName || 'Tool';
  if (!input || !toolName || fallback.toLowerCase() !== toolName.toLowerCase()) {
    return fallback;
  }
  const parsed = typeof input === 'string' ? parseJson(input) : input;
  if (!isRecord(parsed)) return fallback;
  return ['title', 'description', 'label']
    .map((key) => (typeof parsed[key] === 'string' ? parsed[key].trim() : ''))
    .find(Boolean) || fallback;
}

export function activityFileLanguage(path?: string, input?: unknown): string {
  const parsed = typeof input === 'string' ? parseJson(input) : input;
  const inputPath = isRecord(parsed)
    ? ['file_path', 'filePath', 'filepath', 'path', 'filename']
      .map((key) => (typeof parsed[key] === 'string' ? parsed[key].trim() : ''))
      .find(Boolean)
    : '';
  const filename = (path || inputPath || '').split(/[\\/]/).pop() || '';
  const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : '';
  return extension ? FILE_LANGUAGES[extension] || extension.toUpperCase() : '';
}
