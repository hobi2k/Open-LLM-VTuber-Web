/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/require-default-props */
import {
  Badge,
  Box,
  Button,
  createListCollection,
  Flex,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HiArrowPath, HiSpeakerWave } from "react-icons/hi2";
import { useAudioSettings } from "@/hooks/sidebar/setting/use-audio-settings";
import { InputField, SelectField } from "./common";
import { settingStyles } from "./setting-styles";

interface TTSProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

function TTS({ onSave, onCancel }: TTSProps): JSX.Element {
  const { t } = useTranslation();
  const {
    settings,
    state,
    error,
    loadAudioSettings,
    changeTTSEngine,
    changeTTSVoice,
  } = useAudioSettings({ onSave, onCancel });
  const engines = useMemo(
    () => createListCollection({
      items: settings.tts.available_engines.map((engine) => ({
        label: engine.replace(/_/g, " "),
        value: engine,
      })),
    }),
    [settings.tts.available_engines],
  );
  const status = (() => {
    if (error) return { color: "red", label: t("settings.tts.offline") };
    if (state === "loading") return { color: "gray", label: t("settings.tts.loading") };
    return { color: "green", label: t("settings.tts.active") };
  })();

  return (
    <Stack {...settingStyles.common.container} gap="4">
      <Flex
        align="flex-start"
        gap="3"
        border="1px solid"
        borderColor={error ? "#5c3235" : "#2b4139"}
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
          color={error ? "#ef8a90" : "#72d6a2"}
          bg={error ? "#351e21" : "#173226"}
          borderRadius="5px"
          flexShrink="0"
        >
          {state === "loading" ? <Spinner size="xs" /> : <HiSpeakerWave />}
        </Flex>
        <Box minW="0" flex="1">
          <Flex align="center" justify="space-between" gap="2">
            <Text color="#edf1f4" fontSize="sm" fontWeight="semibold">
              {t("settings.tts.outputTitle")}
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
            {settings.tts.engine || t("settings.tts.loading")}
            {settings.tts.voice ? ` · ${settings.tts.voice}` : ""}
          </Text>
        </Box>
      </Flex>

      {error && (
        <Box
          bg="#28191c"
          borderLeft="2px solid #b85a63"
          borderRadius="4px"
          px="3"
          py="2.5"
        >
          <Text color="#f09aa0" fontSize="xs" overflowWrap="anywhere">
            {error}
          </Text>
          <Button
            size="xs"
            mt="2"
            variant="outline"
            borderColor="#694047"
            color="#f0b1b6"
            onClick={() => loadAudioSettings()}
          >
            <HiArrowPath />
            {t("settings.tts.retry")}
          </Button>
        </Box>
      )}

      {settings.tts.available_engines.length > 0 && (
        <SelectField
          label={t("settings.tts.engine")}
          value={[settings.tts.engine]}
          onChange={(value) => changeTTSEngine(value[0])}
          collection={engines}
          placeholder={t("settings.tts.selectEngine")}
        />
      )}

      {settings.tts.voice_field && (
        <InputField
          label={t("settings.tts.voice")}
          value={settings.tts.voice || ""}
          onChange={changeTTSVoice}
          placeholder={t("settings.tts.voicePlaceholder")}
          help={t("settings.tts.voiceHelp")}
        />
      )}

      {settings.tts.model && (
        <Box borderTop="1px solid #273038" pt="3">
          <Text color="#77838d" fontSize="2xs" textTransform="uppercase">
            {t("settings.tts.model")}
          </Text>
          <Text color="#c8d0d6" fontSize="xs" mt="1" overflowWrap="anywhere">
            {settings.tts.model}
          </Text>
        </Box>
      )}

      <Text color="#77838d" fontSize="2xs" lineHeight="1.55">
        {t("settings.tts.restartHelp")}
      </Text>
    </Stack>
  );
}

export default TTS;
