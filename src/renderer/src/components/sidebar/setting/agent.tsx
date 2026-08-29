/* eslint-disable import/no-extraneous-dependencies */
import {
  Stack, Text, Flex, Button, Badge, Separator,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { HiArrowPath } from 'react-icons/hi2';
import { settingStyles } from './setting-styles';
import { useAgentSettings } from '@/hooks/sidebar/setting/use-agent-settings';
import { SwitchField, NumberField, InputField } from './common';

interface AgentProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

function Agent({ onSave, onCancel }: AgentProps): JSX.Element {
  const { t } = useTranslation();
  const {
    settings,
    handleAllowProactiveSpeakChange,
    handleIdleSecondsChange,
    handleAllowButtonTriggerChange,
    openCodeSettings,
    openCodeConnection,
    openCodeState,
    handleOpenCodeSettingChange,
    loadOpenCodeSettings,
    saveOpenCodeSettings,
  } = useAgentSettings({ onSave, onCancel });

  return (
    <Stack {...settingStyles.common.container}>
      <SwitchField
        label={t('settings.agent.allowProactiveSpeak')}
        checked={settings.allowProactiveSpeak}
        onChange={handleAllowProactiveSpeakChange}
      />

      {settings.allowProactiveSpeak && (
        <NumberField
          label={t('settings.agent.idleSecondsToSpeak')}
          value={settings.idleSecondsToSpeak}
          onChange={(value) => handleIdleSecondsChange(Number(value))}
          min={0}
          step={0.1}
          allowMouseWheel
        />
      )}

      <SwitchField
        label={t('settings.agent.allowButtonTrigger')}
        checked={settings.allowButtonTrigger}
        onChange={handleAllowButtonTriggerChange}
      />

      <Separator borderColor="whiteAlpha.200" />

      <Flex align="center" justify="space-between" gap="3">
        <Text fontSize="md" fontWeight="semibold">
          {t('settings.agent.openCode.title')}
        </Text>
        <Badge colorPalette={openCodeConnection.connected ? 'green' : 'red'}>
          {openCodeConnection.connected
            ? t('settings.agent.openCode.connected')
            : t('settings.agent.openCode.disconnected')}
        </Badge>
      </Flex>

      {openCodeConnection.version && (
        <Text color="whiteAlpha.600" fontSize="xs">
          OpenCode {openCodeConnection.version}
        </Text>
      )}

      {openCodeConnection.error && (
        <Text color="red.300" fontSize="xs" overflowWrap="anywhere">
          {openCodeConnection.error}
        </Text>
      )}

      <InputField
        label={t('settings.agent.openCode.baseUrl')}
        value={openCodeSettings.base_url}
        onChange={(value) => handleOpenCodeSettingChange('base_url', value)}
      />
      <InputField
        label={t('settings.agent.openCode.providerId')}
        value={openCodeSettings.provider_id}
        onChange={(value) => handleOpenCodeSettingChange('provider_id', value)}
      />
      <InputField
        label={t('settings.agent.openCode.model')}
        value={openCodeSettings.model}
        onChange={(value) => handleOpenCodeSettingChange('model', value)}
      />
      <InputField
        label={t('settings.agent.openCode.agent')}
        value={openCodeSettings.agent}
        onChange={(value) => handleOpenCodeSettingChange('agent', value)}
      />
      <InputField
        label={t('settings.agent.openCode.workspace')}
        value={openCodeSettings.workspace_directory}
        onChange={(value) => handleOpenCodeSettingChange('workspace_directory', value)}
      />
      <NumberField
        label={t('settings.agent.openCode.timeout')}
        value={openCodeSettings.timeout}
        onChange={(value) => handleOpenCodeSettingChange('timeout', Number(value))}
        min={1}
        step={1}
      />
      <SwitchField
        label={t('settings.agent.openCode.keepSessions')}
        checked={openCodeSettings.keep_sessions}
        onChange={(value) => handleOpenCodeSettingChange('keep_sessions', value)}
      />
      <SwitchField
        label={t('settings.agent.openCode.allowTools')}
        checked={openCodeSettings.allow_tools}
        onChange={(value) => handleOpenCodeSettingChange('allow_tools', value)}
      />

      <Flex gap="2">
        <Button
          flex="1"
          variant="outline"
          onClick={() => void loadOpenCodeSettings()}
          disabled={openCodeState === 'loading' || openCodeState === 'saving'}
        >
          <HiArrowPath />
          {t('settings.agent.openCode.checkConnection')}
        </Button>
        <Button
          flex="1"
          colorPalette="blue"
          onClick={() => void saveOpenCodeSettings()}
          disabled={openCodeState === 'loading' || openCodeState === 'saving'}
        >
          {openCodeState === 'saving'
            ? t('settings.agent.openCode.saving')
            : t('settings.agent.openCode.apply')}
        </Button>
      </Flex>
    </Stack>
  );
}

export default Agent;
