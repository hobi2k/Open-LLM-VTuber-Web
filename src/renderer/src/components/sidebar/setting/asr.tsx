/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/require-default-props */
import {
  Badge, Box, Flex, Spinner, Stack, Text,
} from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiMicrophone } from 'react-icons/hi2';
import { settingStyles } from './setting-styles';
import { useASRSettings } from '@/hooks/sidebar/setting/use-asr-settings';
import { useAudioSettings } from '@/hooks/sidebar/setting/use-audio-settings';
import { SwitchField, NumberField } from './common';

interface ASRProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

function ASR({ onSave, onCancel }: ASRProps): JSX.Element {
  const { t } = useTranslation();
  const {
    localSettings,
    autoStopMic,
    autoStartMicOn,
    autoStartMicOnConvEnd,
    setAutoStopMic,
    setAutoStartMicOn,
    setAutoStartMicOnConvEnd,
    handleInputChange,
    handleSave,
    handleCancel,
  } = useASRSettings();
  const { settings: audioSettings, state: audioState, error: audioError } = useAudioSettings();
  const status = (() => {
    if (audioError) return { color: 'red', label: t('settings.asr.offline') };
    if (audioState === 'loading') return { color: 'gray', label: t('settings.asr.loading') };
    return { color: 'blue', label: t('settings.asr.active') };
  })();

  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(handleSave);
    const cleanupCancel = onCancel(handleCancel);

    return (): void => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, handleSave, handleCancel]);

  return (
    <Stack {...settingStyles.common.container}>
      <Flex
        align="flex-start"
        gap="3"
        border="1px solid"
        borderColor={audioError ? '#5c3235' : '#2f3e49'}
        borderLeftWidth="3px"
        bg="#12181c"
        borderRadius="7px"
        px="3.5"
        py="3"
      >
        <Flex
          align="center"
          justify="center"
          width="8"
          height="8"
          color={audioError ? '#ef8a90' : '#8db8da'}
          bg={audioError ? '#351e21' : '#192b38'}
          borderRadius="5px"
          flexShrink="0"
        >
          {audioState === 'loading' ? <Spinner size="xs" /> : <HiMicrophone />}
        </Flex>
        <Box minW="0" flex="1">
          <Flex align="center" justify="space-between" gap="2">
            <Text color="#edf1f4" fontSize="sm" fontWeight="semibold">
              {t('settings.asr.inputTitle')}
            </Text>
            <Badge
              colorPalette={status.color}
              variant="subtle"
              whiteSpace="normal"
              textAlign="center"
            >
              {status.label}
            </Badge>
          </Flex>
          <Text color="#84909a" fontSize="2xs" mt="1" overflowWrap="anywhere">
            {audioSettings.asr.engine || t('settings.asr.loading')}
            {audioSettings.asr.model_type ? ` · ${audioSettings.asr.model_type}` : ''}
          </Text>
          {audioSettings.asr.model && (
            <Text color="#697680" fontSize="2xs" mt="1" overflowWrap="anywhere">
              {audioSettings.asr.model}
            </Text>
          )}
        </Box>
      </Flex>

      <SwitchField
        label={t('settings.asr.autoStopMic')}
        checked={autoStopMic}
        onChange={setAutoStopMic}
      />

      <SwitchField
        label={t('settings.asr.autoStartMicOnConvEnd')}
        checked={autoStartMicOnConvEnd}
        onChange={setAutoStartMicOnConvEnd}
      />

      <SwitchField
        label={t('settings.asr.autoStartMicOn')}
        checked={autoStartMicOn}
        onChange={setAutoStartMicOn}
      />

      <NumberField
        label={t('settings.asr.positiveSpeechThreshold')}
        help={t('settings.asr.positiveSpeechThresholdDesc')}
        value={localSettings.positiveSpeechThreshold}
        onChange={(value) => handleInputChange('positiveSpeechThreshold', value)}
        min={1}
        max={100}
      />

      <NumberField
        label={t('settings.asr.negativeSpeechThreshold')}
        help={t('settings.asr.negativeSpeechThresholdDesc')}
        value={localSettings.negativeSpeechThreshold}
        onChange={(value) => handleInputChange('negativeSpeechThreshold', value)}
        min={0}
        max={100}
      />

      <NumberField
        label={t('settings.asr.redemptionFrames')}
        help={t('settings.asr.redemptionFramesDesc')}
        value={localSettings.redemptionFrames}
        onChange={(value) => handleInputChange('redemptionFrames', value)}
        min={1}
        max={100}
      />
    </Stack>
  );
}

export default ASR;
