import { useCallback, useEffect, useState } from "react";
import { useProactiveSpeak } from "@/context/proactive-speak-context";
import { useWebSocket } from "@/context/websocket-context";
import { useChatHistory } from "@/context/chat-history-context";
import { useLocalStorage } from "@/hooks/utils/use-local-storage";

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
  base_url: string | null;
  source: "configured" | "detected" | "managed" | null;
  managed: boolean;
  version: string | null;
  path: string | null;
  executable_available: boolean;
  executable_version: string | null;
  executable_error: string | null;
  error: string | null;
}

interface CLIConnection {
  available: boolean;
  path: string | null;
  version: string | null;
  error: string | null;
}

export type LaunchMode = "direct" | "omlx";
export type InteractionMode = "character" | "coding";
export type PermissionMode = "disabled" | "manual" | "auto" | "plan";
export type ReasoningEffort =
  | "default"
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max"
  | "ultra";

export interface RuntimeModel {
  id: string;
  label: string;
  provider: string;
  reasoning_efforts?: ReasoningEffort[];
}

export interface RuntimeProject {
  name: string;
  path: string;
  source: string;
}

export interface RuntimeSession {
  id: string;
  title: string;
  workspace: string;
  updated_at: number | string | null;
  source?: string;
}

export type RuntimeCatalogKey = "opencode" | "claude_code" | "codex" | "hermes";

export interface RuntimeCommand {
  name: string;
  description: string;
  source: "command" | "skill" | "mcp" | string;
  runtime: RuntimeCatalogKey;
  invocation: string;
  input_hint?: string;
}

export interface RuntimeCatalog {
  executables: Record<string, CLIConnection>;
  omlx: {
    available: boolean;
    path: string | null;
    version: string | null;
    base_url: string | null;
    models: RuntimeModel[];
    error: string | null;
  };
  models: Record<
    "opencode" | "claude_code" | "codex" | "hermes",
    RuntimeModel[]
  >;
  projects: RuntimeProject[];
  sessions: Record<
    "opencode" | "claude_code" | "codex" | "hermes",
    RuntimeSession[]
  >;
  commands: Record<RuntimeCatalogKey, RuntimeCommand[]>;
}

interface RuntimeConnections {
  opencode: OpenCodeConnection;
  claude_code: CLIConnection;
  codex: CLIConnection;
  hermes: CLIConnection;
}

export interface OpenCodeRuntimeSettings {
  executable: string;
  base_url: string;
  provider_id: string;
  model: string;
  agent: string;
  launch_mode: LaunchMode;
  interaction_mode: InteractionMode;
  session_id: string;
  new_session_title: string;
  workspace_directory: string;
  timeout: number;
  keep_sessions: boolean;
  allow_tools: boolean;
  permission_mode: PermissionMode;
  show_reasoning: boolean;
  has_server_password: boolean;
  connection: OpenCodeConnection;
}

export interface CLIRuntimeSettings {
  executable: string;
  launch_mode: LaunchMode;
  interaction_mode: InteractionMode;
  session_id: string;
  new_session_title: string;
  model: string;
  provider: string;
  workspace_directory: string;
  timeout: number;
  show_reasoning: boolean;
  reasoning_effort: ReasoningEffort;
  allow_tools: boolean;
  permission_mode: PermissionMode;
  connection: CLIConnection;
}

export interface AgentRuntimeSettings {
  provider: RuntimeProvider;
  opencode: OpenCodeRuntimeSettings;
  claude_code: CLIRuntimeSettings;
  codex: CLIRuntimeSettings;
  hermes: CLIRuntimeSettings;
}

const unavailableCLI: CLIConnection = {
  available: false,
  path: null,
  version: null,
  error: null,
};

const defaultCatalog: RuntimeCatalog = {
  executables: {},
  omlx: {
    available: false,
    path: null,
    version: null,
    base_url: null,
    models: [],
    error: null,
  },
  models: { opencode: [], claude_code: [], codex: [], hermes: [] },
  projects: [],
  sessions: { opencode: [], claude_code: [], codex: [], hermes: [] },
  commands: { opencode: [], claude_code: [], codex: [], hermes: [] },
};

const defaultRuntimeSettings: AgentRuntimeSettings = {
  provider: "opencode_llm",
  opencode: {
    executable: "auto",
    base_url: "http://127.0.0.1:4096",
    provider_id: "",
    model: "",
    agent: "vtuber",
    launch_mode: "direct",
    interaction_mode: "character",
    session_id: "",
    new_session_title: "",
    workspace_directory: ".",
    timeout: 300,
    keep_sessions: false,
    allow_tools: false,
    permission_mode: "disabled",
    show_reasoning: false,
    has_server_password: false,
    connection: {
      connected: false,
      base_url: null,
      source: null,
      managed: false,
      version: null,
      path: null,
      executable_available: false,
      executable_version: null,
      executable_error: null,
      error: null,
    },
  },
  claude_code: {
    executable: "claude",
    launch_mode: "direct",
    interaction_mode: "character",
    session_id: "",
    new_session_title: "",
    model: "",
    provider: "",
    workspace_directory: ".",
    timeout: 300,
    show_reasoning: false,
    reasoning_effort: "default",
    allow_tools: false,
    permission_mode: "disabled",
    connection: unavailableCLI,
  },
  codex: {
    executable: "codex",
    launch_mode: "direct",
    interaction_mode: "character",
    session_id: "",
    new_session_title: "",
    model: "",
    provider: "",
    workspace_directory: ".",
    timeout: 300,
    show_reasoning: false,
    reasoning_effort: "default",
    allow_tools: false,
    permission_mode: "disabled",
    connection: unavailableCLI,
  },
  hermes: {
    executable: "hermes",
    launch_mode: "direct",
    interaction_mode: "character",
    session_id: "",
    new_session_title: "",
    model: "",
    provider: "",
    workspace_directory: ".",
    timeout: 300,
    show_reasoning: false,
    reasoning_effort: "default",
    allow_tools: false,
    permission_mode: "disabled",
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
  const { baseUrl, wsState } = useWebSocket();
  const { clearReasoningMessages } = useChatHistory();
  const [tempSettings, setTempSettings] = useState({
    allowProactiveSpeak: persistedSettings.allowProactiveSpeak,
    idleSecondsToSpeak: persistedSettings.idleSecondsToSpeak,
    allowButtonTrigger: persistedSettings.allowButtonTrigger,
  });
  const [originalSettings, setOriginalSettings] = useState({
    ...persistedSettings,
  });
  const [cachedRuntimeSettings, setCachedRuntimeSettings] = useLocalStorage(
    "agentRuntimeSettings",
    defaultRuntimeSettings,
  );
  const [cachedRuntimeCatalog, setCachedRuntimeCatalog] = useLocalStorage(
    "agentRuntimeCatalog",
    defaultCatalog,
  );
  const [runtimeSettings, setRuntimeSettings] = useState(cachedRuntimeSettings);
  const [originalRuntimeSettings, setOriginalRuntimeSettings] = useState(
    cachedRuntimeSettings,
  );
  const [runtimeCatalog, setRuntimeCatalog] = useState(cachedRuntimeCatalog);
  const [runtimeState, setRuntimeState] = useState<
    "loading" | "ready" | "saving" | "checking" | "error"
  >("ready");
  const [runtimeChecked, setRuntimeChecked] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  useEffect(() => {
    if (persistedSettings) {
      setOriginalSettings(persistedSettings);
      setTempSettings(persistedSettings);
    }
  }, [persistedSettings]);

  const refreshRuntimeCatalog = useCallback(
    async (settings: AgentRuntimeSettings) => {
      const response = await fetch(`${baseUrl}/api/agent-runtime/catalog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsRequest(settings)),
      });
      if (!response.ok) {
        throw new Error(`Runtime catalog request failed (${response.status})`);
      }
      const catalog = (await response.json()) as RuntimeCatalog;
      setRuntimeCatalog(catalog);
      setCachedRuntimeCatalog(catalog);
    },
    [baseUrl, setCachedRuntimeCatalog],
  );

  const loadRuntimeSettings = useCallback(async () => {
    setRuntimeState("loading");
    setRuntimeChecked(false);
    setRuntimeError(null);
    try {
      const settingsResponse = await fetch(
        `${baseUrl}/api/agent-runtime/settings`,
      );
      if (!settingsResponse.ok) {
        throw new Error(
          `Runtime settings request failed (${settingsResponse.status})`,
        );
      }
      const payload = (await settingsResponse.json()) as AgentRuntimeSettings;
      setRuntimeSettings(payload);
      setOriginalRuntimeSettings(payload);
      setCachedRuntimeSettings(payload);
      await refreshRuntimeCatalog(payload);
      setRuntimeState("ready");
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
      setRuntimeState("error");
    }
  }, [baseUrl, refreshRuntimeCatalog, setCachedRuntimeSettings]);

  useEffect(() => {
    if (wsState === "OPEN") loadRuntimeSettings();
  }, [loadRuntimeSettings, wsState]);

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
      if (["executable", "base_url", "launch_mode"].includes(key)) {
        setRuntimeChecked(false);
      }
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
      if (["executable", "launch_mode", "provider"].includes(key)) {
        setRuntimeChecked(false);
      }
      setRuntimeSettings((previous) => ({
        ...previous,
        [runtime]: { ...previous[runtime], [key]: value },
      }));
    },
    [],
  );

  const handleWorkspaceChange = useCallback((path: string) => {
    setRuntimeChecked(false);
    setRuntimeSettings((previous) => {
      if (previous.provider === "opencode_llm") {
        return {
          ...previous,
          opencode: {
            ...previous.opencode,
            workspace_directory: path,
            session_id: "",
            new_session_title: "",
          },
        };
      }
      const runtime = (() => {
        if (previous.provider === "claude_code_llm") return "claude_code";
        if (previous.provider === "codex_cli_llm") return "codex";
        return "hermes";
      })();
      return {
        ...previous,
        [runtime]: {
          ...previous[runtime],
          workspace_directory: path,
          session_id: "",
          new_session_title: "",
        },
      };
    });
  }, []);

  const addRuntimeProject = useCallback(
    (path: string) => {
      const value = path.trim();
      if (!value) return;
      const name = value.split(/[\\/]/).filter(Boolean).pop() || value;
      setRuntimeCatalog((previous) => ({
        ...previous,
        projects: [
          { name, path: value, source: "Added" },
          ...previous.projects.filter((project) => project.path !== value),
        ],
      }));
      handleWorkspaceChange(value);
    },
    [handleWorkspaceChange],
  );

  const selectRuntimeProject = useCallback(async () => {
    const electronWindow = window as typeof window & {
      api?: { selectDirectory?: () => Promise<string | null> };
    };
    if (!electronWindow.api?.selectDirectory) return false;
    const path = await electronWindow.api.selectDirectory();
    if (!path) return true;
    addRuntimeProject(path);
    return true;
  }, [addRuntimeProject]);

  const renameRuntimeSession = useCallback(
    async (
      runtime: RuntimeCatalogKey,
      session: RuntimeSession,
      title: string,
    ) => {
      const response = await fetch(
        `${baseUrl}/api/agent-runtime/session-title`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runtime,
            session_id: session.id,
            title,
            workspace: session.workspace,
          }),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;
        throw new Error(
          payload?.detail || `Session rename failed (${response.status})`,
        );
      }
      await refreshRuntimeCatalog(runtimeSettings);
    },
    [baseUrl, refreshRuntimeCatalog, runtimeSettings],
  );

  const saveRuntimeSettings = useCallback(async () => {
    setRuntimeState("saving");
    setRuntimeError(null);
    setCachedRuntimeSettings(runtimeSettings);
    try {
      const response = await fetch(`${baseUrl}/api/agent-runtime/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsRequest(runtimeSettings)),
      });
      if (!response.ok) throw new Error(`Runtime settings update failed (${response.status})`);
      const payload = (await response.json()) as AgentRuntimeSettings;
      setRuntimeChecked(false);
      setRuntimeSettings(payload);
      setOriginalRuntimeSettings(payload);
      setCachedRuntimeSettings(payload);
      const selectedRuntime = {
        opencode_llm: payload.opencode,
        claude_code_llm: payload.claude_code,
        codex_cli_llm: payload.codex,
        hermes_cli_llm: payload.hermes,
      }[payload.provider];
      if (!selectedRuntime.show_reasoning) clearReasoningMessages();
      setRuntimeState("ready");
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
      setRuntimeState("error");
    }
  }, [
    baseUrl,
    clearReasoningMessages,
    runtimeSettings,
    setCachedRuntimeSettings,
  ]);

  const checkRuntimeConnections = useCallback(async () => {
    setRuntimeState("checking");
    setRuntimeChecked(false);
    setRuntimeError(null);
    try {
      const response = await fetch(`${baseUrl}/api/agent-runtime/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsRequest(runtimeSettings)),
      });
      if (!response.ok) throw new Error(`Runtime connection check failed (${response.status})`);
      const connections = (await response.json()) as RuntimeConnections;
      const nextSettings = {
        ...runtimeSettings,
        opencode: {
          ...runtimeSettings.opencode,
          base_url:
            connections.opencode.base_url || runtimeSettings.opencode.base_url,
          connection: connections.opencode,
        },
        claude_code: {
          ...runtimeSettings.claude_code,
          connection: connections.claude_code,
        },
        codex: { ...runtimeSettings.codex, connection: connections.codex },
        hermes: { ...runtimeSettings.hermes, connection: connections.hermes },
      };
      setRuntimeSettings(nextSettings);
      await refreshRuntimeCatalog(nextSettings);
      setRuntimeChecked(true);
      setRuntimeState("ready");
    } catch (error) {
      setRuntimeChecked(false);
      setRuntimeError(error instanceof Error ? error.message : String(error));
      setRuntimeState("error");
    }
  }, [baseUrl, runtimeSettings, refreshRuntimeCatalog]);

  const handleSave = useCallback(() => {
    updateSettings(tempSettings);
    setOriginalSettings(tempSettings);
    saveRuntimeSettings();
  }, [updateSettings, tempSettings, saveRuntimeSettings]);

  const handleCancel = useCallback(() => {
    setTempSettings(originalSettings);
    updateSettings(originalSettings);
    setRuntimeSettings(originalRuntimeSettings);
    setRuntimeChecked(false);
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
    runtimeCatalog,
    runtimeState,
    runtimeChecked,
    runtimeError,
    handleRuntimeProviderChange,
    handleOpenCodeSettingChange,
    handleCLISettingChange,
    handleWorkspaceChange,
    addRuntimeProject,
    selectRuntimeProject,
    renameRuntimeSession,
    loadRuntimeSettings,
    refreshRuntimeCatalog,
    checkRuntimeConnections,
    saveRuntimeSettings,
  };
}
