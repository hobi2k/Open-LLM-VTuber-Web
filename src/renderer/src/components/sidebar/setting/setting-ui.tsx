/* eslint-disable import/no-extraneous-dependencies */
import {
  Tabs,
  Button,
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerPositioner,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
  DrawerBackdrop,
  DrawerCloseTrigger,
  Portal,
} from "@chakra-ui/react";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  HiAdjustmentsHorizontal,
  HiCommandLine,
  HiInformationCircle,
  HiMicrophone,
  HiSpeakerWave,
  HiUser,
} from "react-icons/hi2";
import { CloseButton } from "@/components/ui/close-button";
import { useAudioSettings } from "@/hooks/sidebar/setting/use-audio-settings";

import { settingStyles } from "./setting-styles";
import General from "./general";
import Live2D from "./live2d";
import ASR from "./asr";
import TTS from "./tts";
import Agent from "./agent-runtime";
import About from "./about";

interface SettingUIProps {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
}

function SettingUI({ open, onClose }: SettingUIProps): JSX.Element {
  const { t } = useTranslation();
  type SettingsHandler = () => void | Promise<void>;
  const [saveHandlers, setSaveHandlers] = useState<SettingsHandler[]>([]);
  const [cancelHandlers, setCancelHandlers] = useState<SettingsHandler[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCallback = useCallback((handler: SettingsHandler) => {
    setSaveHandlers((prev) => [...prev, handler]);
    return (): void => {
      setSaveHandlers((prev) => prev.filter((h) => h !== handler));
    };
  }, []);

  const handleCancelCallback = useCallback((handler: SettingsHandler) => {
    setCancelHandlers((prev) => [...prev, handler]);
    return (): void => {
      setCancelHandlers((prev) => prev.filter((h) => h !== handler));
    };
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    try {
      await Promise.all(saveHandlers.map((handler) => handler()));
      onClose();
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  }, [saveHandlers, onClose]);

  const handleCancel = useCallback((): void => {
    cancelHandlers.forEach((handler) => handler());
    onClose();
  }, [cancelHandlers, onClose]);

  const audioSettings = useAudioSettings({
    onSave: handleSaveCallback,
    onCancel: handleCancelCallback,
  });

  const tabsContent = useMemo(
    () => (
      <Tabs.ContentGroup>
        <Tabs.Content value="general" {...settingStyles.settingUI.tabs.content}>
          <General
            onSave={handleSaveCallback}
            onCancel={handleCancelCallback}
          />
        </Tabs.Content>
        <Tabs.Content value="live2d" {...settingStyles.settingUI.tabs.content}>
          <Live2D onSave={handleSaveCallback} onCancel={handleCancelCallback} />
        </Tabs.Content>
        <Tabs.Content value="asr" {...settingStyles.settingUI.tabs.content}>
          <ASR
            onSave={handleSaveCallback}
            onCancel={handleCancelCallback}
            audioSettings={audioSettings}
          />
        </Tabs.Content>
        <Tabs.Content value="tts" {...settingStyles.settingUI.tabs.content}>
          <TTS audioSettings={audioSettings} />
        </Tabs.Content>
        <Tabs.Content value="agent" {...settingStyles.settingUI.tabs.content}>
          <Agent onSave={handleSaveCallback} onCancel={handleCancelCallback} />
        </Tabs.Content>
        <Tabs.Content value="about" {...settingStyles.settingUI.tabs.content}>
          <About />
        </Tabs.Content>
      </Tabs.ContentGroup>
    ),
    [handleSaveCallback, handleCancelCallback, audioSettings],
  );

  return (
    <DrawerRoot
      open={open}
      onOpenChange={(e) => (e.open ? null : onClose())}
      placement="start"
      size={{ base: "full", md: "md" }}
    >
      <Portal>
        <DrawerBackdrop bg="rgba(3, 6, 8, 0.58)" backdropFilter="blur(3px)" />
        <DrawerPositioner>
          <DrawerContent {...settingStyles.settingUI.drawerContent}>
            <DrawerHeader {...settingStyles.settingUI.drawerHeader}>
              <DrawerTitle {...settingStyles.settingUI.drawerTitle}>
                {t("common.settings")}
              </DrawerTitle>
              <div {...settingStyles.settingUI.closeButton}>
                <DrawerCloseTrigger asChild onClick={handleCancel}>
                  <CloseButton size="sm" color="white" />
                </DrawerCloseTrigger>
              </div>
            </DrawerHeader>

            <DrawerBody {...settingStyles.settingUI.drawerBody}>
              <Tabs.Root
                defaultValue="general"
                value={activeTab}
                onValueChange={(details) => setActiveTab(details.value)}
                {...settingStyles.settingUI.tabs.root}
              >
                <Tabs.List {...settingStyles.settingUI.tabs.list}>
                  <Tabs.Trigger
                    value="general"
                    {...settingStyles.settingUI.tabs.trigger}
                  >
                    <HiAdjustmentsHorizontal />
                    {t("settings.tabs.general")}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="live2d"
                    {...settingStyles.settingUI.tabs.trigger}
                  >
                    <HiUser />
                    {t("settings.tabs.live2d")}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="asr"
                    {...settingStyles.settingUI.tabs.trigger}
                  >
                    <HiMicrophone />
                    {t("settings.tabs.asr")}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="tts"
                    {...settingStyles.settingUI.tabs.trigger}
                  >
                    <HiSpeakerWave />
                    {t("settings.tabs.tts")}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="agent"
                    {...settingStyles.settingUI.tabs.trigger}
                  >
                    <HiCommandLine />
                    {t("settings.tabs.agent")}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="about"
                    {...settingStyles.settingUI.tabs.trigger}
                  >
                    <HiInformationCircle />
                    {t("settings.tabs.about")}
                  </Tabs.Trigger>
                </Tabs.List>

                {tabsContent}
              </Tabs.Root>
            </DrawerBody>

            <DrawerFooter {...settingStyles.settingUI.drawerFooter}>
              <Button
                variant="ghost"
                borderRadius="5px"
                minHeight="40px"
                color="#aeb7bf"
                _hover={{ bg: "#1d242a", color: "#f4f7fa" }}
                onClick={handleCancel}
              >
                {t("common.cancel")}
              </Button>
              <Button
                borderRadius="5px"
                minHeight="40px"
                bg="#dbeaff"
                color="#101820"
                _hover={{ bg: "#edf5ff" }}
                loading={isSaving}
                onClick={handleSave}
              >
                {t("common.save")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </DrawerPositioner>
      </Portal>
    </DrawerRoot>
  );
}

export default SettingUI;
