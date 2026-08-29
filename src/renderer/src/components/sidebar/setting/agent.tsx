/* eslint-disable import/no-extraneous-dependencies */
import {
  Badge,
  Button,
  Flex,
  SegmentGroup,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { HiArrowPath } from "react-icons/hi2";
import { settingStyles } from "./setting-styles";
import {
  RuntimeProvider,
  useAgentSettings,
} from "@/hooks/sidebar/setting/use-agent-settings";
import { SwitchField, NumberField, InputField } from "./common";

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

function Agent({ onSave, onCancel }: AgentProps): JSX.Element {
  const { t } = useTranslation();
  const {
    settings,
    handleAllowProactiveSpeakChange,
    handleIdleSecondsChange,
    handleAllowButtonTriggerChange,
    runtimeSettings,
    runtimeState,
    runtimeError,
    handleRuntimeProviderChange,
    handleOpenCodeSettingChange,
    handleCLISettingChange,
    checkRuntimeConnections,
    saveRuntimeSettings,
  } = useAgentSettings({ onSave, onCancel });

  const isOpenCode = runtimeSettings.provider === "opencode_llm";
  const runtimeKey = (() => {
    if (runtimeSettings.provider === "claude_code_llm") return "claude_code";
    if (runtimeSettings.provider === "codex_cli_llm") return "codex";
    return "hermes";
  })();
  const selectedRuntime = isOpenCode
    ? runtimeSettings.opencode
    : runtimeSettings[runtimeKey];
  const { connection } = selectedRuntime;
  const available =
    "connected" in connection ? connection.connected : connection.available;

  return (
    <Stack {...settingStyles.common.container}>
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
        <Text fontSize="md" fontWeight="semibold">
          {t("settings.agent.runtime.title")}
        </Text>
        <Badge colorPalette={available ? "green" : "red"}>
          {available
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

      {connection.version && (
        <Text color="whiteAlpha.600" fontSize="xs" overflowWrap="anywhere">
          {connection.version}
        </Text>
      )}
      {(runtimeError || connection.error) && (
        <Text color="red.300" fontSize="xs" overflowWrap="anywhere">
          {runtimeError || connection.error}
        </Text>
      )}

      {isOpenCode ? (
        <>
          <InputField
            label={t("settings.agent.runtime.baseUrl")}
            value={runtimeSettings.opencode.base_url}
            onChange={(value) => handleOpenCodeSettingChange("base_url", value)}
          />
          <InputField
            label={t("settings.agent.runtime.providerId")}
            value={runtimeSettings.opencode.provider_id}
            onChange={(value) => handleOpenCodeSettingChange("provider_id", value)}
          />
          <InputField
            label={t("settings.agent.runtime.model")}
            value={runtimeSettings.opencode.model}
            onChange={(value) => handleOpenCodeSettingChange("model", value)}
          />
          <InputField
            label={t("settings.agent.runtime.agent")}
            value={runtimeSettings.opencode.agent}
            onChange={(value) => handleOpenCodeSettingChange("agent", value)}
          />
          <InputField
            label={t("settings.agent.runtime.workspace")}
            value={runtimeSettings.opencode.workspace_directory}
            onChange={(value) => handleOpenCodeSettingChange("workspace_directory", value)}
          />
          <NumberField
            label={t("settings.agent.runtime.timeout")}
            value={runtimeSettings.opencode.timeout}
            onChange={(value) => handleOpenCodeSettingChange("timeout", Number(value))}
            min={1}
            step={1}
          />
          <SwitchField
            label={t("settings.agent.runtime.keepSessions")}
            checked={runtimeSettings.opencode.keep_sessions}
            onChange={(value) => handleOpenCodeSettingChange("keep_sessions", value)}
          />
          <SwitchField
            label={t("settings.agent.runtime.allowTools")}
            checked={runtimeSettings.opencode.allow_tools}
            onChange={(value) => handleOpenCodeSettingChange("allow_tools", value)}
          />
        </>
      ) : (
        <>
          <InputField
            label={t("settings.agent.runtime.executable")}
            value={runtimeSettings[runtimeKey].executable}
            onChange={(value) => handleCLISettingChange(runtimeKey, "executable", value)}
          />
          <InputField
            label={t("settings.agent.runtime.modelOptional")}
            value={runtimeSettings[runtimeKey].model}
            onChange={(value) => handleCLISettingChange(runtimeKey, "model", value)}
            placeholder={t("settings.agent.runtime.useDefault")}
          />
          {runtimeKey === "hermes" && (
            <InputField
              label={t("settings.agent.runtime.providerOptional")}
              value={runtimeSettings.hermes.provider}
              onChange={(value) => handleCLISettingChange("hermes", "provider", value)}
              placeholder={t("settings.agent.runtime.useDefault")}
            />
          )}
          <InputField
            label={t("settings.agent.runtime.workspace")}
            value={runtimeSettings[runtimeKey].workspace_directory}
            onChange={(value) => handleCLISettingChange(runtimeKey, "workspace_directory", value)}
          />
          <NumberField
            label={t("settings.agent.runtime.timeout")}
            value={runtimeSettings[runtimeKey].timeout}
            onChange={(value) => handleCLISettingChange(runtimeKey, "timeout", Number(value))}
            min={1}
            step={1}
          />
        </>
      )}

      <Flex gap="2">
        <Button
          flex="1"
          variant="outline"
          onClick={() => checkRuntimeConnections()}
          disabled={runtimeState === "loading" || runtimeState === "saving"}
        >
          <HiArrowPath />
          {t("settings.agent.runtime.check")}
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
    </Stack>
  );
}

export default Agent;
