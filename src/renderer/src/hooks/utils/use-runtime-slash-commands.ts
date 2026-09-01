import {
  KeyboardEvent, useCallback, useEffect, useMemo, useState,
} from 'react';
import { useWebSocket } from '@/context/websocket-context';
import {
  AgentRuntimeSettings,
  RuntimeCatalog,
  RuntimeCatalogKey,
  RuntimeCommand,
} from '@/hooks/sidebar/setting/use-agent-settings';
import {
  filterRuntimeCommands,
  moveSlashCommandIndex,
  slashCommandQuery,
} from '@/utils/runtime-slash-command';

function runtimeKey(provider: AgentRuntimeSettings['provider']): RuntimeCatalogKey {
  if (provider === 'opencode_llm') return 'opencode';
  if (provider === 'claude_code_llm') return 'claude_code';
  if (provider === 'codex_cli_llm') return 'codex';
  return 'hermes';
}

function readCachedValue<T>(key: string): T | null {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

export function useRuntimeSlashCommands(
  inputValue: string,
  setValue: (value: string) => void,
) {
  const { baseUrl } = useWebSocket();
  const [commands, setCommands] = useState<RuntimeCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dismissedValue, setDismissedValue] = useState('');
  const query = slashCommandQuery(inputValue);
  const matchesSlash = query !== null;
  const active = matchesSlash && dismissedValue !== inputValue;

  useEffect(() => {
    if (!matchesSlash) setDismissedValue('');
  }, [matchesSlash]);

  useEffect(() => {
    if (!active) return undefined;
    const controller = new AbortController();
    Promise.all([
      fetch(`${baseUrl}/api/agent-runtime/settings`, { signal: controller.signal }),
      fetch(`${baseUrl}/api/agent-runtime/catalog`, { signal: controller.signal }),
    ])
      .then(async ([settingsResponse, catalogResponse]) => {
        if (!settingsResponse.ok || !catalogResponse.ok) return;
        const settings = await settingsResponse.json() as AgentRuntimeSettings;
        const catalog = await catalogResponse.json() as RuntimeCatalog;
        setCommands(catalog.commands?.[runtimeKey(settings.provider)] || []);
        localStorage.setItem('agentRuntimeSettings', JSON.stringify(settings));
        localStorage.setItem('agentRuntimeCatalog', JSON.stringify(catalog));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        const settings = readCachedValue<AgentRuntimeSettings>('agentRuntimeSettings');
        const catalog = readCachedValue<RuntimeCatalog>('agentRuntimeCatalog');
        if (settings && catalog) {
          setCommands(catalog.commands?.[runtimeKey(settings.provider)] || []);
        }
      });
    return () => controller.abort();
  }, [active, baseUrl]);

  const filtered = useMemo(
    () => filterRuntimeCommands(commands, query || ''),
    [commands, query],
  );

  useEffect(() => setSelectedIndex(0), [query]);

  const select = useCallback((command: RuntimeCommand) => {
    setValue(`${command.invocation || `/${command.name}`} `);
    setDismissedValue('');
  }, [setValue]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!active || !filtered.length) return false;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => moveSlashCommandIndex(index, filtered.length, 'next'));
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((index) => moveSlashCommandIndex(index, filtered.length, 'previous'));
      return true;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      select(filtered[selectedIndex] || filtered[0]);
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDismissedValue(inputValue);
      return true;
    }
    return false;
  }, [active, filtered, inputValue, select, selectedIndex]);

  return {
    commands: filtered,
    open: active && filtered.length > 0,
    selectedIndex,
    setSelectedIndex,
    select,
    handleKeyDown,
  };
}
