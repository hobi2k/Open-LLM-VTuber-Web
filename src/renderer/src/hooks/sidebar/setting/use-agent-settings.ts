import { useCallback, useEffect, useState } from "react";
import { useProactiveSpeak } from "@/context/proactive-speak-context";
import { useWebSocket } from "@/context/websocket-context";

interface UseAgentSettingsProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

export type RuntimeProvider =
  | "opencode_llm"
  | "claude_code_llm"
  | "codex_cli_llm"
  | "hermes_cli_llm";

interface OpenCodeConnection {
  connected: boolean;
  version: string | null;
  error: string | null;
}

interface CLIConnection {
  available: boolean;
  version: string | null;
  error: string | null;
}

interface RuntimeConnections {
  opencode: OpenCodeConnection;
  claude_code: CLIConnection;
  codex: CLIConnection;
  hermes: CLIConnection;
}

export interface OpenCodeRuntimeSettings {
  base_url: string;
  provider_id: string;
  model: string;
  agent: string;
  workspace_directory: string;
  timeout: number;
  keep_sessions: boolean;
  allow_tools: boolean;
  has_server_password: boolean;
  connection: OpenCodeConnection;
}

export interface CLIRuntimeSettings {
  executable: string;
  model: string;
  provider: string;
  workspace_directory: string;
  timeout: number;
  connection: CLIConnection;
}

export interface AgentRuntimeSettings {
  provider: RuntimeProvider;
  opencode: OpenCodeRuntimeSettings;
  claude_code: CLIRuntimeSettings;
  codex: CLIRuntimeSettings;
  hermes: CLIRuntimeSettings;
}

const unavailableCLI = { available: false, version: null, error: null };

const defaultRuntimeSettings: AgentRuntimeSettings = {
  provider: "opencode_llm",
  opencode: {
    base_url: "http://127.0.0.1:4096",
    provider_id: "",
    model: "",
    agent: "vtuber",
    workspace_directory: ".",
    timeout: 300,
    keep_sessions: false,
    allow_tools: false,
    has_server_password: false,
    connection: { connected: false, version: null, error: null },
  },
  claude_code: {
    executable: "claude",
    model: "",
    provider: "",
    workspace_directory: ".",
    timeout: 300,
    connection: unavailableCLI,
  },
  codex: {
    executable: "codex",
    model: "",
    provider: "",
    workspace_directory: ".",
    timeout: 300,
    connection: unavailableCLI,
  },
  hermes: {
    executable: "hermes",
    model: "",
    provider: "",
    workspace_directory: ".",
    timeout: 300,
    connection: unavailableCLI,
  },
};

function settingsRequest(settings: AgentRuntimeSettings) {
  const {
    connection: _openCodeConnection,
    has_server_password: _hasPassword,
    ...opencode
  } = settings.opencode;
  const { connection: _claudeConnection, ...claudeCode } = settings.claude_code;
  const { connection: _codexConnection, ...codex } = settings.codex;
  const { connection: _hermesConnection, ...hermes } = settings.hermes;
  return {
    provider: settings.provider,
    opencode,
    claude_code: claudeCode,
    codex,
    hermes,
  };
}

export function useAgentSettings({
  onSave,
  onCancel,
}: UseAgentSettingsProps = {}) {
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
  const [runtimeSettings, setRuntimeSettings] = useState(
    defaultRuntimeSettings,
  );
  const [originalRuntimeSettings, setOriginalRuntimeSettings] = useState(
    defaultRuntimeSettings,
  );
  const [runtimeState, setRuntimeState] = useState<
    "loading" | "ready" | "saving" | "error"
  >("loading");
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  useEffect(() => {
    if (persistedSettings) {
      setOriginalSettings(persistedSettings);
      setTempSettings(persistedSettings);
    }
  }, [persistedSettings]);

  const loadRuntimeSettings = useCallback(async () => {
    setRuntimeState("loading");
    setRuntimeError(null);
    try {
      const response = await fetch(`${baseUrl}/api/agent-runtime/settings`);
      if (!response.ok) throw new Error(`Runtime settings request failed (${response.status})`);
      const payload = (await response.json()) as AgentRuntimeSettings;
      setRuntimeSettings(payload);
      setOriginalRuntimeSettings(payload);
      setRuntimeState("ready");
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
      setRuntimeState("error");
    }
  }, [baseUrl]);

  useEffect(() => {
    loadRuntimeSettings();
  }, [loadRuntimeSettings]);

  const handleAllowProactiveSpeakChange = useCallback((checked: boolean) => {
    setTempSettings((previous) => ({
      ...previous,
      allowProactiveSpeak: checked,
    }));
  }, []);

  const handleIdleSecondsChange = useCallback((value: number) => {
    setTempSettings((previous) => ({ ...previous, idleSecondsToSpeak: value }));
  }, []);

  const handleAllowButtonTriggerChange = useCallback((checked: boolean) => {
    setTempSettings((previous) => ({
      ...previous,
      allowButtonTrigger: checked,
    }));
  }, []);

  const handleRuntimeProviderChange = useCallback(
    (provider: RuntimeProvider) => {
      setRuntimeSettings((previous) => ({ ...previous, provider }));
    },
    [],
  );

  const handleOpenCodeSettingChange = useCallback(
    <Key extends keyof OpenCodeRuntimeSettings>(
      key: Key,
      value: OpenCodeRuntimeSettings[Key],
    ) => {
      setRuntimeSettings((previous) => ({
        ...previous,
        opencode: { ...previous.opencode, [key]: value },
      }));
    },
    [],
  );

  const handleCLISettingChange = useCallback(
    <
      Runtime extends "claude_code" | "codex" | "hermes",
      Key extends keyof CLIRuntimeSettings,
    >(
      runtime: Runtime,
      key: Key,
      value: CLIRuntimeSettings[Key],
    ) => {
      setRuntimeSettings((previous) => ({
        ...previous,
        [runtime]: { ...previous[runtime], [key]: value },
      }));
    },
    [],
  );

  const saveRuntimeSettings = useCallback(async () => {
    setRuntimeState("saving");
    setRuntimeError(null);
    try {
      const response = await fetch(`${baseUrl}/api/agent-runtime/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsRequest(runtimeSettings)),
      });
      if (!response.ok) throw new Error(`Runtime settings update failed (${response.status})`);
      const payload = (await response.json()) as AgentRuntimeSettings;
      setRuntimeSettings(payload);
      setOriginalRuntimeSettings(payload);
      setRuntimeState("ready");
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
      setRuntimeState("error");
    }
  }, [baseUrl, runtimeSettings]);

  const checkRuntimeConnections = useCallback(async () => {
    setRuntimeState("loading");
    setRuntimeError(null);
    try {
      const response = await fetch(`${baseUrl}/api/agent-runtime/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsRequest(runtimeSettings)),
      });
      if (!response.ok) throw new Error(`Runtime connection check failed (${response.status})`);
      const connections = (await response.json()) as RuntimeConnections;
      setRuntimeSettings((previous) => ({
        ...previous,
        opencode: { ...previous.opencode, connection: connections.opencode },
        claude_code: {
          ...previous.claude_code,
          connection: connections.claude_code,
        },
        codex: { ...previous.codex, connection: connections.codex },
        hermes: { ...previous.hermes, connection: connections.hermes },
      }));
      setRuntimeState("ready");
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
      setRuntimeState("error");
    }
  }, [baseUrl, runtimeSettings]);

  const handleSave = useCallback(() => {
    updateSettings(tempSettings);
    setOriginalSettings(tempSettings);
    saveRuntimeSettings();
  }, [updateSettings, tempSettings, saveRuntimeSettings]);

  const handleCancel = useCallback(() => {
    setTempSettings(originalSettings);
    updateSettings(originalSettings);
    setRuntimeSettings(originalRuntimeSettings);
  }, [originalSettings, originalRuntimeSettings, updateSettings]);

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
    runtimeSettings,
    runtimeState,
    runtimeError,
    handleRuntimeProviderChange,
    handleOpenCodeSettingChange,
    handleCLISettingChange,
    loadRuntimeSettings,
    checkRuntimeConnections,
    saveRuntimeSettings,
  };
}
