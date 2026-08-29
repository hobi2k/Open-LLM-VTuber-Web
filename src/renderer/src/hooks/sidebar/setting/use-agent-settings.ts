import { useCallback, useEffect, useState } from 'react';
import { useProactiveSpeak } from '@/context/proactive-speak-context';
import { useWebSocket } from '@/context/websocket-context';

interface UseAgentSettingsProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

interface OpenCodeSettings {
  enabled: boolean
  base_url: string
  provider_id: string
  model: string
  agent: string
  workspace_directory: string
  timeout: number
  keep_sessions: boolean
  allow_tools: boolean
  has_server_password: boolean
}

interface OpenCodeConnection {
  connected: boolean
  version: string | null
  error: string | null
}

interface OpenCodeSettingsResponse extends OpenCodeSettings {
  connection: OpenCodeConnection
}

const defaultOpenCodeSettings: OpenCodeSettings = {
  enabled: false,
  base_url: 'http://127.0.0.1:4096',
  provider_id: '',
  model: '',
  agent: 'vtuber',
  workspace_directory: '.',
  timeout: 300,
  keep_sessions: false,
  allow_tools: false,
  has_server_password: false,
};

export function useAgentSettings({ onSave, onCancel }: UseAgentSettingsProps = {}) {
  const { settings: persistedSettings, updateSettings } = useProactiveSpeak();
  const { baseUrl } = useWebSocket();

  const [tempSettings, setTempSettings] = useState({
    allowProactiveSpeak: persistedSettings.allowProactiveSpeak,
    idleSecondsToSpeak: persistedSettings.idleSecondsToSpeak,
    allowButtonTrigger: persistedSettings.allowButtonTrigger,
  });

  const [originalSettings, setOriginalSettings] = useState({
    ...persistedSettings,
  });
  const [openCodeSettings, setOpenCodeSettings] = useState(defaultOpenCodeSettings);
  const [originalOpenCodeSettings, setOriginalOpenCodeSettings] = useState(
    defaultOpenCodeSettings,
  );
  const [openCodeConnection, setOpenCodeConnection] = useState<OpenCodeConnection>({
    connected: false,
    version: null,
    error: null,
  });
  const [openCodeState, setOpenCodeState] = useState<'loading' | 'ready' | 'saving' | 'error'>(
    'loading',
  );

  useEffect(() => {
    if (persistedSettings) {
      setOriginalSettings(persistedSettings);
      setTempSettings(persistedSettings);
    }
  }, [persistedSettings]);

  const loadOpenCodeSettings = useCallback(async () => {
    setOpenCodeState('loading');
    try {
      const response = await fetch(`${baseUrl}/api/opencode/settings`);
      if (!response.ok) throw new Error(`OpenCode settings request failed (${response.status})`);
      const payload = (await response.json()) as OpenCodeSettingsResponse;
      const { connection, ...settings } = payload;
      setOpenCodeSettings(settings);
      setOriginalOpenCodeSettings(settings);
      setOpenCodeConnection(connection);
      setOpenCodeState('ready');
    } catch (error) {
      setOpenCodeConnection({
        connected: false,
        version: null,
        error: error instanceof Error ? error.message : String(error),
      });
      setOpenCodeState('error');
    }
  }, [baseUrl]);

  useEffect(() => {
    loadOpenCodeSettings();
  }, [loadOpenCodeSettings]);

  const handleAllowProactiveSpeakChange = useCallback((checked: boolean) => {
    setTempSettings((prev) => ({
      ...prev,
      allowProactiveSpeak: checked,
    }));
  }, []);

  const handleIdleSecondsChange = useCallback((value: number) => {
    setTempSettings((prev) => ({
      ...prev,
      idleSecondsToSpeak: value,
    }));
  }, []);

  const handleAllowButtonTriggerChange = useCallback((checked: boolean) => {
    setTempSettings((prev) => ({
      ...prev,
      allowButtonTrigger: checked,
    }));
  }, []);

  const saveOpenCodeSettings = useCallback(async () => {
    setOpenCodeState('saving');
    try {
      const response = await fetch(`${baseUrl}/api/opencode/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_url: openCodeSettings.base_url,
          provider_id: openCodeSettings.provider_id,
          model: openCodeSettings.model,
          agent: openCodeSettings.agent,
          workspace_directory: openCodeSettings.workspace_directory,
          timeout: openCodeSettings.timeout,
          keep_sessions: openCodeSettings.keep_sessions,
          allow_tools: openCodeSettings.allow_tools,
        }),
      });
      if (!response.ok) throw new Error(`OpenCode settings update failed (${response.status})`);
      const payload = (await response.json()) as OpenCodeSettingsResponse;
      const { connection, ...settings } = payload;
      setOpenCodeSettings(settings);
      setOriginalOpenCodeSettings(settings);
      setOpenCodeConnection(connection);
      setOpenCodeState('ready');
    } catch (error) {
      setOpenCodeConnection({
        connected: false,
        version: null,
        error: error instanceof Error ? error.message : String(error),
      });
      setOpenCodeState('error');
    }
  }, [baseUrl, openCodeSettings]);

  const handleOpenCodeSettingChange = useCallback(
    <Key extends keyof OpenCodeSettings>(key: Key, value: OpenCodeSettings[Key]) => {
      setOpenCodeSettings((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    updateSettings(tempSettings);
    setOriginalSettings(tempSettings);
    void saveOpenCodeSettings();
  }, [updateSettings, tempSettings, saveOpenCodeSettings]);

  const handleCancel = useCallback(() => {
    setTempSettings(originalSettings);
    updateSettings(originalSettings);
    setOpenCodeSettings(originalOpenCodeSettings);
  }, [originalSettings, originalOpenCodeSettings, updateSettings]);

  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(handleSave);
    const cleanupCancel = onCancel(handleCancel);

    return () => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, handleSave, handleCancel]);

  return {
    settings: tempSettings,
    handleAllowProactiveSpeakChange,
    handleIdleSecondsChange,
    handleAllowButtonTriggerChange,
    openCodeSettings,
    openCodeConnection,
    openCodeState,
    handleOpenCodeSettingChange,
    loadOpenCodeSettings,
    saveOpenCodeSettings,
  };
}
