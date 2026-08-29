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
  createListCollection,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { HiArrowPath, HiChevronDown, HiFolderPlus } from "react-icons/hi2";
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
import { InputField, NumberField, SelectField, SwitchField } from "./common";
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
  const modelCollection = useMemo(
    () => createListCollection({
      items: modelOptions.map((model) => {
        if (launchMode === "omlx") {
          return {
            label: `${model.label} · oMLX`,
            value: `${model.provider}::${model.id}`,
          };
        }
        const showProvider =
          runtimeKey !== "claude_code" &&
          runtimeKey !== "codex" &&
          model.provider;
        return {
          label: showProvider ? `${model.label} · ${model.provider}` : model.label,
          value: `${model.provider}::${model.id}`,
        };
      }),
    }),
    [launchMode, modelOptions, runtimeKey],
  );
  const selectedModel = `${
    isOpenCode
      ? runtimeSettings.opencode.provider_id
      : runtimeSettings[runtimeKey].provider
  }::${selectedRuntime.model}`;

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
  const projectCollection = useMemo(
    () => createListCollection({
      items: projectOptions.map((project) => ({
        label: `${project.name} · ${project.source}`,
        value: project.path,
      })),
    }),
    [projectOptions],
  );

  const sessionOptions = useMemo(() => {
    const sessions = runtimeCatalog.sessions[runtimeKey];
    const current =
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
  const sessionCollection = useMemo(
    () => createListCollection({
      items: [
        {
          label: t("settings.agent.runtime.newConversation"),
          value: "__new__",
        },
        ...sessionOptions.map((session) => ({
          label: `${session.title} · ${session.workspace.split(/[\\/]/).filter(Boolean).pop() || "Local"}`,
          value: session.id,
        })),
      ],
    }),
    [sessionOptions, t],
  );

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
  const modeUnavailable =
    launchMode === "omlx" && !runtimeCatalog.omlx.base_url;

  return (
    <Stack {...settingStyles.common.container} gap="4">
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

      <Flex align="center" justify="space-between" gap="3">
        <Box minW="0">
          <Text fontSize="md" fontWeight="semibold">
            {t("settings.agent.runtime.title")}
          </Text>
          <Text color="whiteAlpha.600" fontSize="xs" truncate>
            {executablePath ||
              selectedRuntime.connection.version ||
              runtimeSettings.opencode.base_url}
          </Text>
        </Box>
        <Badge colorPalette={available && !modeUnavailable ? "green" : "red"}>
          {available && !modeUnavailable
            ? t("settings.agent.runtime.available")
            : t("settings.agent.runtime.unavailable")}
        </Badge>
      </Flex>

      <SegmentGroup.Root
        value={runtimeSettings.provider}
        onValueChange={(details) => handleRuntimeProviderChange(details.value as RuntimeProvider)}
        size="sm"
        width="full"
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items
          items={runtimes}
          fontSize="xs"
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
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items
            items={[
              {
                label: t("settings.agent.runtime.directMode"),
                value: "direct",
              },
              { label: "oMLX", value: "omlx" },
            ]}
            flex="1"
            justifyContent="center"
          />
        </SegmentGroup.Root>
      )}

      {(runtimeError ||
        connection.error ||
        (modeUnavailable && runtimeCatalog.omlx.error)) && (
        <Text color="red.300" fontSize="xs" overflowWrap="anywhere">
          {runtimeError || connection.error || runtimeCatalog.omlx.error}
        </Text>
      )}

      <SelectField
        label={t("settings.agent.runtime.model")}
        value={[selectedModel]}
        onChange={(value) => changeModel(value[0])}
        collection={modelCollection}
        placeholder={t("settings.agent.runtime.selectModel")}
      />

      <Flex align="end" gap="2">
        <Box flex="1" minW="0">
          <SelectField
            label={t("settings.agent.runtime.project")}
            value={[selectedRuntime.workspace_directory]}
            onChange={(value) => handleWorkspaceChange(value[0])}
            collection={projectCollection}
            placeholder={t("settings.agent.runtime.selectProject")}
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

      <SelectField
        label={t("settings.agent.runtime.conversation")}
        value={[selectedRuntime.session_id || "__new__"]}
        onChange={(value) => changeSession(value[0])}
        collection={sessionCollection}
        placeholder={t("settings.agent.runtime.newConversation")}
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
