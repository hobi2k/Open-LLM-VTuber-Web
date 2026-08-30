/* eslint-disable import/no-extraneous-dependencies */
import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
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
  RuntimeModel,
  RuntimeProvider,
  RuntimeSession,
  useAgentSettings,
} from "@/hooks/sidebar/setting/use-agent-settings";
import { InputField, NumberField, SwitchField } from "./common";
import {
  EditableChoice,
  EditableChoiceField,
} from "./editable-choice-field";
import { settingStyles } from "./setting-styles";

interface AgentProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

const runtimes = [
  { label: "OpenCode", value: "opencode_llm" },
  { label: "Claude", value: "claude_code_llm" },
  { label: "Codex", value: "codex_cli_llm" },
  { label: "Hermes", value: "hermes_cli_llm" },
];

function AgentRuntime({ onSave, onCancel }: AgentProps): JSX.Element {
  const { t } = useTranslation();
  const {
    settings,
    handleAllowProactiveSpeakChange,
    handleIdleSecondsChange,
    handleAllowButtonTriggerChange,
    runtimeSettings,
    runtimeCatalog,
    runtimeState,
    runtimeError,
    handleRuntimeProviderChange,
    handleOpenCodeSettingChange,
    handleCLISettingChange,
    handleWorkspaceChange,
    addRuntimeProject,
    selectRuntimeProject,
    checkRuntimeConnections,
    saveRuntimeSettings,
  } = useAgentSettings({ onSave, onCancel });
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectPath, setProjectPath] = useState("");

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
    const currentModel: RuntimeModel = {
      id: selectedRuntime.model,
      label: selectedRuntime.model || t("settings.agent.runtime.useDefault"),
      provider: isOpenCode
        ? runtimeSettings.opencode.provider_id
        : runtimeSettings[runtimeKey].provider,
    };
    const values = new Map(
      [currentModel, ...filtered].map((model) => [
        `${model.provider}::${model.id}`,
        model,
      ]),
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
  const sessionChoices = useMemo<EditableChoice[]>(
    () => [
      {
        key: "__new__",
        label: t("settings.agent.runtime.newConversation"),
        value: "",
      },
      ...sessionOptions.map((session) => ({
        key: session.id,
        label: session.title,
        value: session.id,
        meta: session.workspace.split(/[\\/]/).filter(Boolean).pop() || "Local",
      })),
    ],
    [sessionOptions, t],
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
        meta: detectedExecutable.version || t("settings.agent.runtime.detected"),
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

  const changeSession = (value: string): void => {
    const sessionId = value === "__new__" ? "" : value;
    const session: RuntimeSession | undefined = sessionOptions.find(
      (item) => item.id === sessionId,
    );
    if (session?.workspace) handleWorkspaceChange(session.workspace);
    if (isOpenCode) {
      handleOpenCodeSettingChange("session_id", sessionId);
      return;
    }
    handleCLISettingChange(runtimeKey, "session_id", sessionId);
  };

  const openProjectPicker = async (): Promise<void> => {
    if (await selectRuntimeProject()) return;
    setProjectPath(selectedRuntime.workspace_directory);
    setProjectDialogOpen(true);
  };

  const addProject = (): void => {
    if (!projectPath.trim()) return;
    addRuntimeProject(projectPath);
    setProjectDialogOpen(false);
  };

  const executablePath = "path" in connection ? connection.path : null;
  const executableError =
    "executable_error" in connection ? connection.executable_error : null;
  const modeUnavailable =
    launchMode === "omlx" && !runtimeCatalog.omlx.base_url;

  return (
    <Stack {...settingStyles.common.container} gap="5">
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
      <Separator borderColor="whiteAlpha.200" />

      <Flex
        align="center"
        justify="space-between"
        gap="3"
        borderLeftWidth="2px"
        borderLeftColor={available && !modeUnavailable ? "green.400" : "red.400"}
        pl="3"
        py="1"
      >
        <Flex align="center" gap="3" minW="0">
          <Flex
            align="center"
            justify="center"
            width="8"
            height="8"
            color="blue.200"
            bg="whiteAlpha.100"
            borderRadius="4px"
            flexShrink="0"
          >
            <HiCommandLine />
          </Flex>
          <Box minW="0">
            <Text fontSize="sm" fontWeight="semibold">
              {t("settings.agent.runtime.title")}
            </Text>
            <Text color="whiteAlpha.600" fontSize="2xs" truncate>
              {executablePath ||
                selectedRuntime.connection.version ||
                runtimeSettings.opencode.base_url}
            </Text>
          </Box>
        </Flex>
        <Badge
          colorPalette={available && !modeUnavailable ? "green" : "red"}
          variant="subtle"
          borderRadius="4px"
          px="2"
        >
          {available && !modeUnavailable
            ? t("settings.agent.runtime.available")
            : t("settings.agent.runtime.unavailable")}
        </Badge>
      </Flex>

      <Stack gap="3">
        <SegmentGroup.Root
          value={runtimeSettings.provider}
          onValueChange={(details) => handleRuntimeProviderChange(details.value as RuntimeProvider)}
          size="sm"
          width="full"
          bg="whiteAlpha.100"
          borderRadius="6px"
          p="1"
        >
          <SegmentGroup.Indicator borderRadius="4px" bg="whiteAlpha.200" />
          <SegmentGroup.Items
            items={runtimes}
            fontSize="xs"
            color="whiteAlpha.800"
            flex="1"
            justifyContent="center"
          />
        </SegmentGroup.Root>

        {(isOpenCode || isHermes) && (
          <SegmentGroup.Root
            value={launchMode}
            onValueChange={(details) => {
              if (details.value) changeLaunchMode(details.value);
            }}
            size="sm"
            width="full"
            bg="whiteAlpha.50"
            borderRadius="6px"
            p="1"
          >
            <SegmentGroup.Indicator borderRadius="4px" bg="whiteAlpha.200" />
            <SegmentGroup.Items
              items={[
                {
                  label: t("settings.agent.runtime.directMode"),
                  value: "direct",
                },
                { label: "oMLX", value: "omlx" },
              ]}
              color="whiteAlpha.800"
              flex="1"
              justifyContent="center"
            />
          </SegmentGroup.Root>
        )}
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

      {(runtimeError ||
        connection.error ||
        executableError ||
        (modeUnavailable && runtimeCatalog.omlx.error)) && (
        <Text color="red.300" fontSize="xs" overflowWrap="anywhere">
          {runtimeError ||
            connection.error ||
            executableError ||
            runtimeCatalog.omlx.error}
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

      <Flex align="end" gap="2">
        <Box flex="1" minW="0">
          <EditableChoiceField
            label={t("settings.agent.runtime.project")}
            value={selectedRuntime.workspace_directory}
            onInput={handleWorkspaceChange}
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
          px="2"
          onClick={() => openProjectPicker()}
        >
          <HiFolderPlus />
        </Button>
      </Flex>

      <EditableChoiceField
        label={t("settings.agent.runtime.conversation")}
        value={selectedRuntime.session_id}
        onInput={changeSession}
        choices={sessionChoices}
        placeholder={t("settings.agent.runtime.selectConversation")}
        emptyText={t("settings.agent.runtime.noMatches")}
        help={selectedSession?.title}
      />

      <Box
        as="details"
        borderTopWidth="1px"
        borderColor="whiteAlpha.200"
        pt="3"
      >
        <Flex
          as="summary"
          align="center"
          justify="space-between"
          cursor="pointer"
          listStyleType="none"
          color="whiteAlpha.700"
          fontSize="sm"
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
            help={selectedRuntime.executable === "auto" && detectedExecutable?.available
              ? t("settings.agent.runtime.detected")
              : t("settings.agent.runtime.manual")}
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
              <SwitchField
                label={t("settings.agent.runtime.allowTools")}
                checked={runtimeSettings.opencode.allow_tools}
                onChange={(value) => handleOpenCodeSettingChange("allow_tools", value)}
              />
            </>
          )}
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

      <Flex gap="2">
        <Button
          flex="1"
          variant="outline"
          onClick={() => checkRuntimeConnections()}
          disabled={runtimeState === "loading" || runtimeState === "saving"}
        >
          <HiArrowPath />
          {t("settings.agent.runtime.refresh")}
        </Button>
        <Button
          flex="1"
          colorPalette="blue"
          onClick={() => saveRuntimeSettings()}
          disabled={runtimeState === "loading" || runtimeState === "saving"}
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
