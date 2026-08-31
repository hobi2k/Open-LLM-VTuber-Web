import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  createListCollection,
  Flex,
  Input,
  SegmentGroup,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  HiArrowPath,
  HiChevronDown,
  HiCommandLine,
  HiFolderPlus,
  HiSignalSlash,
} from "react-icons/hi2";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InteractionMode,
  ReasoningEffort,
  RuntimeModel,
  RuntimeProvider,
  RuntimeSession,
  useAgentSettings,
} from "@/hooks/sidebar/setting/use-agent-settings";
import { InputField, NumberField, SelectField, SwitchField } from "./common";
import { EditableChoice, EditableChoiceField } from "./editable-choice-field";
import { settingStyles } from "./setting-styles";
import { useWebSocket } from "@/context/websocket-context";

interface AgentProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

const runtimes = [
  { label: "OpenCode", value: "opencode_llm" },
  { label: "Claude Code", value: "claude_code_llm" },
  { label: "Codex", value: "codex_cli_llm" },
  { label: "Hermes", value: "hermes_cli_llm" },
];

function formatSessionDate(value: number | string | null): string {
  if (value === null || value === "") return "";
  const numeric = Number(value);
  const date = Number.isNaN(numeric)
    ? new Date(value)
    : new Date(numeric > 1_000_000_000_000 ? numeric : numeric * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizeWorkspacePath(path: string): string {
  const normalized = path.trim().replace(/\\/g, "/");
  if (normalized === "/" || /^[A-Za-z]:\/$/.test(normalized)) {
    return normalized.toLocaleLowerCase();
  }
  const value = normalized.replace(/\/+$/, "");
  return /^[A-Za-z]:/.test(value) ? value.toLocaleLowerCase() : value;
}

function workspaceBelongsToProject(
  workspace: string,
  project: string,
): boolean {
  const normalizedWorkspace = normalizeWorkspacePath(workspace);
  const normalizedProject = normalizeWorkspacePath(project);
  if (!normalizedWorkspace || !normalizedProject) return false;
  if (normalizedWorkspace === normalizedProject) return true;
  if (normalizedProject === "/" || normalizedProject.endsWith("/")) {
    return normalizedWorkspace.startsWith(normalizedProject);
  }
  return normalizedWorkspace.startsWith(`${normalizedProject}/`);
}

function AgentRuntime({ onSave, onCancel }: AgentProps): JSX.Element {
  const { t } = useTranslation();
  const { baseUrl, setBaseUrl, wsUrl, setWsUrl } = useWebSocket();
  const {
    settings,
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
    loadRuntimeSettings,
    checkRuntimeConnections,
    saveRuntimeSettings,
  } = useAgentSettings({ onSave, onCancel });
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectPath, setProjectPath] = useState("");
  const [sessionScope, setSessionScope] = useState<"all" | "project">("all");
  const [recoveryBaseUrl, setRecoveryBaseUrl] = useState(baseUrl);
  const [recoveryWsUrl, setRecoveryWsUrl] = useState(wsUrl);

  useEffect(() => setRecoveryBaseUrl(baseUrl), [baseUrl]);
  useEffect(() => setRecoveryWsUrl(wsUrl), [wsUrl]);

  const runtimeKey = (() => {
    if (runtimeSettings.provider === "opencode_llm") return "opencode";
    if (runtimeSettings.provider === "claude_code_llm") return "claude_code";
    if (runtimeSettings.provider === "codex_cli_llm") return "codex";
    return "hermes";
  })();
  const isOpenCode = runtimeKey === "opencode";
  const isHermes = runtimeKey === "hermes";
  const selectedRuntime = isOpenCode
    ? runtimeSettings.opencode
    : runtimeSettings[runtimeKey];
  const { connection } = selectedRuntime;
  const available =
    "connected" in connection ? connection.connected : connection.available;
  const launchMode = selectedRuntime.launch_mode;
  const interactionMode = selectedRuntime.interaction_mode || "character";
  const selectedProvider = isOpenCode
    ? runtimeSettings.opencode.provider_id
    : runtimeSettings[runtimeKey].provider;
  const modelOptions = useMemo(() => {
    const catalogModels = runtimeCatalog.models[runtimeKey];
    const filtered =
      launchMode === "omlx"
        ? runtimeCatalog.omlx.models.map((model) => ({
          ...model,
          provider: "omlx",
        }))
        : catalogModels;
    const currentModel: RuntimeModel | null = selectedRuntime.model
      ? {
        id: selectedRuntime.model,
        label: selectedRuntime.model,
        provider: isOpenCode
          ? runtimeSettings.opencode.provider_id
          : runtimeSettings[runtimeKey].provider,
      }
      : null;
    const values = new Map(
      [
        {
          id: "",
          label: t("settings.agent.runtime.useDefault"),
          provider: "",
        },
        ...(currentModel ? [currentModel] : []),
        ...filtered,
      ].map((model) => [`${model.provider}::${model.id}`, model]),
    );
    return [...values.values()];
  }, [
    isOpenCode,
    launchMode,
    runtimeCatalog.models,
    runtimeCatalog.omlx.models,
    runtimeKey,
    runtimeSettings,
    selectedRuntime.model,
    t,
  ]);
  const modelChoices = useMemo<EditableChoice[]>(
    () => modelOptions.map((model) => ({
      key: `${model.provider}::${model.id}`,
      value: model.id,
      label: model.label,
      meta: model.provider || t("settings.agent.runtime.useDefault"),
    })),
    [modelOptions, t],
  );
  const providerChoices = useMemo<EditableChoice[]>(() => {
    const providers = new Map(
      modelOptions
        .filter((model) => model.provider)
        .map((model) => [model.provider, model.provider]),
    );
    if (selectedProvider) providers.set(selectedProvider, selectedProvider);
    return [...providers.values()].map((provider) => ({
      key: provider,
      value: provider,
      label: provider,
    }));
  }, [modelOptions, selectedProvider]);
  const reasoningEffortValues = useMemo<ReasoningEffort[]>(() => {
    if (runtimeKey === "codex") {
      const model = modelOptions.find(
        (item) => item.id === selectedRuntime.model,
      );
      if (model?.reasoning_efforts?.length) {
        return [...new Set(model.reasoning_efforts)];
      }
      const detected = runtimeCatalog.models.codex.flatMap(
        (item) => item.reasoning_efforts || [],
      );
      if (detected.length) return [...new Set(detected)];
    }
    return ["low", "medium", "high", "xhigh", "max"];
  }, [
    modelOptions,
    runtimeCatalog.models.codex,
    runtimeKey,
    selectedRuntime.model,
  ]);
  const selectedReasoningEffort =
    runtimeKey === "claude_code" || runtimeKey === "codex"
      ? runtimeSettings[runtimeKey].reasoning_effort || "default"
      : "default";
  const reasoningEffortCollection = useMemo(
    () => createListCollection<{ label: string; value: string }>({
      items: ["default" as ReasoningEffort, ...reasoningEffortValues].map(
        (value) => ({
          value,
          label:
              value === "default"
                ? t("settings.agent.runtime.useDefault")
                : t(`settings.agent.runtime.reasoningEffortLevels.${value}`),
        }),
      ),
    }),
    [reasoningEffortValues, t],
  );

  const projectOptions = useMemo(() => {
    const values = new Map(
      [
        {
          name:
            selectedRuntime.workspace_directory
              .split(/[\\/]/)
              .filter(Boolean)
              .pop() || selectedRuntime.workspace_directory,
          path: selectedRuntime.workspace_directory,
          source: "VTuber",
        },
        ...runtimeCatalog.projects,
      ].map((project) => [project.path, project]),
    );
    return [...values.values()];
  }, [runtimeCatalog.projects, selectedRuntime.workspace_directory]);
  const projectChoices = useMemo<EditableChoice[]>(
    () => projectOptions.map((project) => ({
      key: project.path,
      value: project.path,
      label: project.name,
      meta: project.source,
    })),
    [projectOptions],
  );

  const sessionOptions = useMemo(() => {
    const sessions = runtimeCatalog.sessions[runtimeKey];
    const current: RuntimeSession[] =
      selectedRuntime.session_id &&
      !sessions.some((session) => session.id === selectedRuntime.session_id)
        ? [
          {
            id: selectedRuntime.session_id,
            title: t("settings.agent.runtime.currentConversation"),
            workspace: selectedRuntime.workspace_directory,
            updated_at: null,
          },
        ]
        : [];
    return [...current, ...sessions];
  }, [
    runtimeCatalog.sessions,
    runtimeKey,
    selectedRuntime.session_id,
    selectedRuntime.workspace_directory,
    t,
  ]);
  const scopedSessionOptions = useMemo(
    () => (sessionScope === "all"
      ? sessionOptions
      : sessionOptions.filter((session) => workspaceBelongsToProject(
        session.workspace,
        selectedRuntime.workspace_directory,
      ))),
    [sessionOptions, sessionScope, selectedRuntime.workspace_directory],
  );
  const sessionChoices = useMemo<EditableChoice[]>(
    () => [
      {
        key: "__new__",
        label: t("settings.agent.runtime.newConversation"),
        value: "",
      },
      ...scopedSessionOptions.map((session) => ({
        key: session.id,
        label: session.title,
        value: session.id,
        meta: [
          session.source,
          session.workspace,
          formatSessionDate(session.updated_at),
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    ],
    [scopedSessionOptions, t],
  );
  const selectedSession = sessionOptions.find(
    (session) => session.id === selectedRuntime.session_id,
  );
  const detectedExecutable = runtimeCatalog.executables[runtimeKey];
  const executableChoices = useMemo<EditableChoice[]>(() => {
    const choices: EditableChoice[] = [
      {
        key: "auto",
        value: "auto",
        label: t("settings.agent.runtime.autoDetect"),
        meta: detectedExecutable?.path || undefined,
      },
    ];
    if (detectedExecutable?.path) {
      choices.push({
        key: detectedExecutable.path,
        value: detectedExecutable.path,
        label: detectedExecutable.path,
        meta:
          detectedExecutable.version || t("settings.agent.runtime.detected"),
      });
    }
    return choices;
  }, [detectedExecutable, t]);

  const changeModel = (value: string): void => {
    const model = modelOptions.find(
      (item) => `${item.provider}::${item.id}` === value,
    );
    if (!model) return;
    if (isOpenCode) {
      handleOpenCodeSettingChange("provider_id", model.provider);
      handleOpenCodeSettingChange("model", model.id);
      return;
    }
    handleCLISettingChange(runtimeKey, "provider", model.provider);
    handleCLISettingChange(runtimeKey, "model", model.id);
    if (
      runtimeKey === "codex" &&
      model.reasoning_efforts?.length &&
      selectedReasoningEffort !== "default" &&
      !model.reasoning_efforts.includes(selectedReasoningEffort)
    ) {
      handleCLISettingChange(runtimeKey, "reasoning_effort", "default");
    }
  };

  const inputModel = (value: string): void => {
    if (isOpenCode) {
      handleOpenCodeSettingChange("model", value);
      return;
    }
    handleCLISettingChange(runtimeKey, "model", value);
  };

  const inputProvider = (value: string): void => {
    if (isOpenCode) {
      handleOpenCodeSettingChange("provider_id", value);
      return;
    }
    handleCLISettingChange(runtimeKey, "provider", value);
  };

  const inputExecutable = (value: string): void => {
    if (isOpenCode) {
      handleOpenCodeSettingChange("executable", value);
      return;
    }
    handleCLISettingChange(runtimeKey, "executable", value);
  };

  const changeWorkspace = (value: string): void => {
    setSessionScope("project");
    handleWorkspaceChange(value);
  };

  const changeLaunchMode = (value: string): void => {
    if (value !== "direct" && value !== "omlx") return;
    if (isOpenCode) handleOpenCodeSettingChange("launch_mode", value);
    if (!isOpenCode) handleCLISettingChange(runtimeKey, "launch_mode", value);
    if (value !== "omlx") return;
    const model = runtimeCatalog.omlx.models[0];
    if (!model) return;
    if (isOpenCode) {
      handleOpenCodeSettingChange("provider_id", "omlx");
      handleOpenCodeSettingChange("model", model.id);
      return;
    }
    handleCLISettingChange(runtimeKey, "provider", "omlx");
    handleCLISettingChange(runtimeKey, "model", model.id);
  };

  const changeInteractionMode = (value: string): void => {
    if (value !== "character" && value !== "coding") return;
    const mode = value as InteractionMode;
    if (isOpenCode) {
      handleOpenCodeSettingChange("interaction_mode", mode);
      if (mode === "coding") {
        handleOpenCodeSettingChange("allow_tools", true);
        if (runtimeSettings.opencode.agent === "vtuber") {
          handleOpenCodeSettingChange("agent", "build");
        }
      } else if (runtimeSettings.opencode.agent === "build") {
        handleOpenCodeSettingChange("agent", "vtuber");
      }
      return;
    }
    handleCLISettingChange(runtimeKey, "interaction_mode", mode);
    if (mode === "coding") {
      handleCLISettingChange(runtimeKey, "allow_tools", true);
    }
  };

  const changeSession = (value: string): void => {
    const sessionId = value === "__new__" ? "" : value;
    const session: RuntimeSession | undefined = sessionOptions.find(
      (item) => item.id === sessionId,
    );
    if (session?.workspace) changeWorkspace(session.workspace);
    if (isOpenCode) {
      handleOpenCodeSettingChange("session_id", sessionId);
      return;
    }
    handleCLISettingChange(runtimeKey, "session_id", sessionId);
  };

  const openProjectPicker = async (): Promise<void> => {
    if (await selectRuntimeProject()) {
      setSessionScope("project");
      return;
    }
    setProjectPath(selectedRuntime.workspace_directory);
    setProjectDialogOpen(true);
  };

  const addProject = (): void => {
    if (!projectPath.trim()) return;
    addRuntimeProject(projectPath);
    setSessionScope("project");
    setProjectDialogOpen(false);
  };

  const executablePath = "path" in connection ? connection.path : null;
  const executableError =
    "executable_error" in connection ? connection.executable_error : null;
  const modeUnavailable =
    runtimeChecked && launchMode === "omlx" && !runtimeCatalog.omlx.base_url;
  const runtimeChecking = runtimeState === "checking";
  const runtimeAvailable =
    runtimeChecked && available && !modeUnavailable && !runtimeError;
  const runtimeUnavailable = runtimeChecked && !runtimeAvailable;
  const runtimeVisuals = (() => {
    if (runtimeAvailable) {
      return {
        border: "#28543f",
        icon: "#72d6a2",
        iconBackground: "#173226",
        palette: "green" as const,
      };
    }
    if (runtimeUnavailable) {
      return {
        border: "#5c3235",
        icon: "#ef8a90",
        iconBackground: "#351e21",
        palette: "red" as const,
      };
    }
    return {
      border: "#34404a",
      icon: "#a7b3bd",
      iconBackground: "#222b32",
      palette: "gray" as const,
    };
  })();
  const runtimeStatusLabel = (() => {
    if (runtimeChecking) return t("settings.agent.runtime.searchingRuntimes");
    if (!runtimeChecked) return t("settings.agent.runtime.notChecked");
    if (runtimeAvailable) return t("settings.agent.runtime.available");
    return t("settings.agent.runtime.unavailable");
  })();

  const applyRecoveryAddress = (): void => {
    const nextBaseUrl = recoveryBaseUrl.trim().replace(/\/$/, "");
    const nextWsUrl = recoveryWsUrl.trim();
    if (nextBaseUrl) setBaseUrl(nextBaseUrl);
    if (nextWsUrl) setWsUrl(nextWsUrl);
    if (nextBaseUrl === baseUrl && nextWsUrl === wsUrl) loadRuntimeSettings();
  };

  return (
    <Stack {...settingStyles.common.container} gap="4.5">
      <SwitchField
        label={t("settings.agent.allowProactiveSpeak")}
        checked={settings.allowProactiveSpeak}
        onChange={handleAllowProactiveSpeakChange}
      />
      {settings.allowProactiveSpeak && (
        <NumberField
          label={t("settings.agent.idleSecondsToSpeak")}
          value={settings.idleSecondsToSpeak}
          onChange={(value) => handleIdleSecondsChange(Number(value))}
          min={0}
          step={0.1}
          allowMouseWheel
        />
      )}
      <SwitchField
        label={t("settings.agent.allowButtonTrigger")}
        checked={settings.allowButtonTrigger}
        onChange={handleAllowButtonTriggerChange}
      />
      <Separator borderColor="#273038" />

      <Flex
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        gap="3"
        direction={{ base: "column", sm: "row" }}
        border="1px solid"
        borderColor={runtimeVisuals.border}
        borderLeftWidth="3px"
        bg="#12181c"
        borderRadius="7px"
        px="3.5"
        py="3"
        minWidth="0"
      >
        <Flex align="flex-start" gap="3" minW="0" width="full">
          <Flex
            align="center"
            justify="center"
            width="8"
            height="8"
            color={runtimeVisuals.icon}
            bg={runtimeVisuals.iconBackground}
            borderRadius="5px"
            flexShrink="0"
          >
            <HiCommandLine />
          </Flex>
          <Box minW="0" flex="1">
            <Text
              color="#edf1f4"
              fontSize="sm"
              fontWeight="semibold"
              lineHeight="1.35"
            >
              {t("settings.agent.runtime.title")}
            </Text>
            <Text
              color="#84909a"
              fontSize="2xs"
              lineHeight="1.45"
              overflowWrap="anywhere"
              mt="0.5"
            >
              {(isOpenCode && "base_url" in connection && connection.base_url) ||
                executablePath ||
                selectedRuntime.connection.version ||
                (isOpenCode
                  ? runtimeSettings.opencode.base_url
                  : selectedRuntime.executable)}
            </Text>
          </Box>
        </Flex>
        <Badge
          colorPalette={runtimeVisuals.palette}
          variant="subtle"
          borderRadius="4px"
          px="2"
          flexShrink="0"
          whiteSpace="normal"
          textAlign="center"
        >
          {runtimeStatusLabel}
        </Badge>
      </Flex>

      <Stack gap="3">
        <SegmentGroup.Root
          value={runtimeSettings.provider}
          onValueChange={(details) => {
            setSessionScope("all");
            handleRuntimeProviderChange(details.value as RuntimeProvider);
          }}
          size="sm"
          width="full"
          bg="#12181d"
          border="1px solid"
          borderColor="#28323a"
          borderRadius="7px"
          p="1"
        >
          <SegmentGroup.Indicator
            borderRadius="5px"
            bg="#2a3540"
            boxShadow="inset 0 0 0 1px rgba(148, 179, 211, 0.2)"
          />
          <SegmentGroup.Items
            items={runtimes}
            fontSize="xs"
            lineHeight="1.25"
            minHeight="38px"
            minWidth="0"
            color="#c7cfd6"
            flex="1"
            justifyContent="center"
            whiteSpace="normal"
            textAlign="center"
          />
        </SegmentGroup.Root>

        <Button
          width="full"
          variant="outline"
          minHeight="42px"
          borderColor="#3d4b57"
          color="#dbe5ed"
          bg="#151c21"
          whiteSpace="normal"
          lineHeight="1.3"
          _hover={{ bg: "#202a31", borderColor: "#5b6c79" }}
          onClick={() => checkRuntimeConnections()}
          disabled={
            runtimeState === "loading" ||
            runtimeState === "saving" ||
            runtimeChecking
          }
        >
          <HiArrowPath
            className={runtimeChecking ? "runtime-scan-spin" : undefined}
          />
          {runtimeChecking
            ? t("settings.agent.runtime.searchingRuntimes")
            : t("settings.agent.runtime.findRuntimes")}
        </Button>

        {(isOpenCode || isHermes) && (
          <SegmentGroup.Root
            value={launchMode}
            onValueChange={(details) => {
              if (details.value) changeLaunchMode(details.value);
            }}
            size="sm"
            width="full"
            bg="#11171b"
            border="1px solid"
            borderColor="#252e35"
            borderRadius="7px"
            p="1"
          >
            <SegmentGroup.Indicator borderRadius="5px" bg="#273139" />
            <SegmentGroup.Items
              items={[
                {
                  label: t("settings.agent.runtime.directMode"),
                  value: "direct",
                },
                { label: "oMLX", value: "omlx" },
              ]}
              color="#c7cfd6"
              minHeight="36px"
              minWidth="0"
              flex="1"
              justifyContent="center"
              whiteSpace="normal"
              textAlign="center"
            />
          </SegmentGroup.Root>
        )}

        <Stack gap="1.5">
          <Text
            color="#aeb7bf"
            fontSize="xs"
            fontWeight="medium"
            lineHeight="1.4"
          >
            {t("settings.agent.runtime.interactionMode")}
          </Text>
          <SegmentGroup.Root
            value={interactionMode}
            onValueChange={(details) => {
              if (details.value) changeInteractionMode(details.value);
            }}
            size="sm"
            width="full"
            bg="#11171b"
            border="1px solid"
            borderColor="#252e35"
            borderRadius="7px"
            p="1"
          >
            <SegmentGroup.Indicator borderRadius="5px" bg="#273139" />
            <SegmentGroup.Items
              items={[
                {
                  label: t("settings.agent.runtime.characterMode"),
                  value: "character",
                },
                {
                  label: t("settings.agent.runtime.codingMode"),
                  value: "coding",
                },
              ]}
              color="#c7cfd6"
              minHeight="36px"
              minWidth="0"
              flex="1"
              justifyContent="center"
              whiteSpace="normal"
              textAlign="center"
            />
          </SegmentGroup.Root>
        </Stack>
      </Stack>

      <SwitchField
        label={t("settings.agent.runtime.showReasoning")}
        checked={selectedRuntime.show_reasoning}
        onChange={(value) => {
          if (isOpenCode) {
            handleOpenCodeSettingChange("show_reasoning", value);
            return;
          }
          handleCLISettingChange(runtimeKey, "show_reasoning", value);
        }}
        help={t("settings.agent.runtime.showReasoningHelp")}
      />

      {runtimeError && (
        <Stack
          gap="3"
          bg="#17191b"
          border="1px solid #5a3a3e"
          borderLeftWidth="3px"
          borderRadius="7px"
          px="3.5"
          py="3"
        >
          <Flex align="flex-start" gap="2.5">
            <Box color="#ef8a90" mt="0.5" flexShrink="0">
              <HiSignalSlash />
            </Box>
            <Box minW="0">
              <Text color="#f1dadd" fontSize="sm" fontWeight="semibold">
                {t("settings.agent.runtime.serverOffline")}
              </Text>
              <Text color="#b58f94" fontSize="xs" lineHeight="1.55" mt="1">
                {t("settings.agent.runtime.serverOfflineHelp")}
              </Text>
              <Text
                color="#d48d94"
                fontSize="2xs"
                mt="1.5"
                overflowWrap="anywhere"
              >
                {runtimeError}
              </Text>
            </Box>
          </Flex>
          <InputField
            label={t("settings.agent.runtime.vtuberServerUrl")}
            value={recoveryBaseUrl}
            onChange={setRecoveryBaseUrl}
            placeholder="http://127.0.0.1:12393"
          />
          <InputField
            label={t("settings.agent.runtime.vtuberWebSocketUrl")}
            value={recoveryWsUrl}
            onChange={setRecoveryWsUrl}
            placeholder="ws://127.0.0.1:12393/client-ws"
          />
          <Button
            variant="outline"
            minHeight="40px"
            borderColor="#6a454a"
            color="#f0c4c8"
            whiteSpace="normal"
            onClick={applyRecoveryAddress}
          >
            <HiArrowPath />
            {t("settings.agent.runtime.applyAndRetry")}
          </Button>
          <Text color="#806b70" fontSize="2xs" lineHeight="1.5">
            {t("settings.agent.runtime.omlxServerHelp")}
          </Text>
        </Stack>
      )}

      {runtimeChecked &&
        (connection.error ||
          executableError ||
          (modeUnavailable && runtimeCatalog.omlx.error)) && (
          <Text
            color="#f09aa0"
            bg="#28191c"
            borderLeft="2px solid #b85a63"
            borderRadius="4px"
            fontSize="xs"
            lineHeight="1.55"
            overflowWrap="anywhere"
            px="3"
            py="2.5"
          >
            {connection.error || executableError || runtimeCatalog.omlx.error}
          </Text>
      )}

      {(isOpenCode || isHermes) && (
        <EditableChoiceField
          label={t("settings.agent.runtime.provider")}
          value={selectedProvider}
          onInput={inputProvider}
          choices={providerChoices}
          placeholder={t("settings.agent.runtime.selectProvider")}
          emptyText={t("settings.agent.runtime.noMatches")}
          disabled={launchMode === "omlx"}
          help={launchMode === "omlx" ? "oMLX" : undefined}
        />
      )}

      <EditableChoiceField
        label={t("settings.agent.runtime.model")}
        value={selectedRuntime.model}
        onInput={inputModel}
        onSelect={(choice) => changeModel(choice.key)}
        choices={modelChoices}
        placeholder={t("settings.agent.runtime.selectModel")}
        emptyText={t("settings.agent.runtime.noMatches")}
        help={selectedProvider || undefined}
      />

      {(runtimeKey === "claude_code" || runtimeKey === "codex") && (
        <SelectField
          label={t("settings.agent.runtime.reasoningEffort")}
          value={[selectedReasoningEffort]}
          onChange={(value) => {
            const effort = value[0] as ReasoningEffort | undefined;
            if (effort) {
              handleCLISettingChange(runtimeKey, "reasoning_effort", effort);
            }
          }}
          collection={reasoningEffortCollection}
          placeholder={t("settings.agent.runtime.useDefault")}
          help={t("settings.agent.runtime.reasoningEffortHelp")}
        />
      )}

      <Flex align="end" gap="2">
        <Box flex="1" minW="0">
          <EditableChoiceField
            label={t("settings.agent.runtime.project")}
            value={selectedRuntime.workspace_directory}
            onInput={changeWorkspace}
            choices={projectChoices}
            placeholder={t("settings.agent.runtime.selectProject")}
            emptyText={t("settings.agent.runtime.noMatches")}
          />
        </Box>
        <Button
          aria-label={t("settings.agent.runtime.addProject")}
          title={t("settings.agent.runtime.addProject")}
          variant="outline"
          size="sm"
          minW="9"
          minH="40px"
          px="2"
          borderColor="#34404a"
          color="#cbd3da"
          _hover={{ bg: "#20282f", borderColor: "#4a5966" }}
          onClick={() => openProjectPicker()}
        >
          <HiFolderPlus />
        </Button>
      </Flex>

      <Stack gap="1.5">
        <Text
          color="#aeb7bf"
          fontSize="xs"
          fontWeight="medium"
          lineHeight="1.4"
        >
          {t("settings.agent.runtime.sessionScope")}
        </Text>
        <SegmentGroup.Root
          value={sessionScope}
          onValueChange={(details) => {
            if (details.value === "all" || details.value === "project") {
              setSessionScope(details.value);
            }
          }}
          size="sm"
          width="full"
          bg="#11171b"
          border="1px solid"
          borderColor="#252e35"
          borderRadius="7px"
          p="1"
        >
          <SegmentGroup.Indicator borderRadius="5px" bg="#273139" />
          <SegmentGroup.Items
            items={[
              {
                label: t("settings.agent.runtime.allProjects"),
                value: "all",
              },
              {
                label: t("settings.agent.runtime.currentProject"),
                value: "project",
              },
            ]}
            color="#c7cfd6"
            minHeight="36px"
            minWidth="0"
            flex="1"
            justifyContent="center"
            whiteSpace="normal"
            textAlign="center"
          />
        </SegmentGroup.Root>
      </Stack>

      <EditableChoiceField
        label={t("settings.agent.runtime.conversation")}
        value={selectedRuntime.session_id}
        onInput={changeSession}
        choices={sessionChoices}
        placeholder={t("settings.agent.runtime.selectConversation")}
        emptyText={t("settings.agent.runtime.noMatches")}
        help={[
          selectedSession?.title,
          sessionScope === "all"
            ? t("settings.agent.runtime.sessionCount", {
              count: sessionOptions.length,
            })
            : t("settings.agent.runtime.projectSessionCount", {
              count: scopedSessionOptions.length,
              total: sessionOptions.length,
            }),
        ]
          .filter(Boolean)
          .join(" · ")}
        maxVisible={160}
        overflowText={t("settings.agent.runtime.searchAllSessions")}
      />

      <Box as="details" borderTopWidth="1px" borderColor="#273038" pt="3.5">
        <Flex
          as="summary"
          align="center"
          justify="space-between"
          cursor="pointer"
          listStyleType="none"
          color="#aeb7bf"
          fontSize="sm"
          fontWeight="medium"
          lineHeight="1.4"
          gap="3"
          overflowWrap="anywhere"
        >
          {t("settings.agent.runtime.advanced")}
          <HiChevronDown />
        </Flex>
        <Stack gap="3" pt="3">
          <EditableChoiceField
            label={t("settings.agent.runtime.executable")}
            value={selectedRuntime.executable}
            onInput={inputExecutable}
            choices={executableChoices}
            placeholder={t("settings.agent.runtime.selectExecutable")}
            emptyText={t("settings.agent.runtime.noMatches")}
            help={
              selectedRuntime.executable === "auto" &&
              detectedExecutable?.available
                ? t("settings.agent.runtime.detected")
                : t("settings.agent.runtime.manual")
            }
          />
          {isOpenCode && (
            <>
              <InputField
                label={t("settings.agent.runtime.baseUrl")}
                value={runtimeSettings.opencode.base_url}
                onChange={(value) => handleOpenCodeSettingChange("base_url", value)}
              />
              <InputField
                label={t("settings.agent.runtime.profile")}
                value={runtimeSettings.opencode.agent}
                onChange={(value) => handleOpenCodeSettingChange("agent", value)}
                help={t("settings.agent.runtime.profileHelp")}
              />
            </>
          )}
          <SwitchField
            label={t("settings.agent.runtime.allowTools")}
            checked={selectedRuntime.allow_tools}
            onChange={(value) => {
              if (isOpenCode) {
                handleOpenCodeSettingChange("allow_tools", value);
                return;
              }
              handleCLISettingChange(runtimeKey, "allow_tools", value);
            }}
          />
          <NumberField
            label={t("settings.agent.runtime.timeout")}
            value={selectedRuntime.timeout}
            onChange={(value) => {
              if (isOpenCode) {
                handleOpenCodeSettingChange("timeout", Number(value));
                return;
              }
              handleCLISettingChange(runtimeKey, "timeout", Number(value));
            }}
            min={1}
            step={1}
          />
        </Stack>
      </Box>

      <Flex gap="2" direction={{ base: "column", sm: "row" }}>
        <Button
          flex="1"
          minHeight="42px"
          bg="#dbeaff"
          color="#101820"
          whiteSpace="normal"
          lineHeight="1.3"
          _hover={{ bg: "#edf5ff" }}
          onClick={() => saveRuntimeSettings()}
          disabled={
            runtimeState === "loading" ||
            runtimeState === "saving" ||
            runtimeChecking
          }
        >
          {runtimeState === "saving"
            ? t("settings.agent.runtime.saving")
            : t("settings.agent.runtime.apply")}
        </Button>
      </Flex>

      <DialogRoot
        open={projectDialogOpen}
        onOpenChange={(details) => setProjectDialogOpen(details.open)}
        size="sm"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.agent.runtime.addProject")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Input
              value={projectPath}
              onChange={(event) => setProjectPath(event.target.value)}
              placeholder={t("settings.agent.runtime.projectPath")}
              onKeyDown={(event) => {
                if (event.key === "Enter") addProject();
              }}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProjectDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button colorPalette="blue" onClick={addProject}>
              {t("settings.agent.runtime.add")}
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Stack>
  );
}

export default AgentRuntime;
