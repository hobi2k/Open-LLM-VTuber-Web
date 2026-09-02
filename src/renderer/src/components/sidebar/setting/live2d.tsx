/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react-hooks/rules-of-hooks */
import { createListCollection, Stack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { settingStyles } from './setting-styles';
import { useLive2dSettings } from '@/hooks/sidebar/setting/use-live2d-settings';
import { SelectField, SwitchField } from './common';
import { PetBubblePlacement } from '@/context/pet-ui-context';

interface live2DProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

function live2D({ onSave, onCancel }: live2DProps): JSX.Element {
  const { t } = useTranslation();
  const {
    modelInfo,
    speechBubblePlacement,
    handleInputChange,
    handleSpeechBubblePlacementChange,
    handleSave,
    handleCancel,
  } = useLive2dSettings();
  const bubblePlacements = createListCollection({
    items: [
      { label: t('settings.live2d.speechBubblePlacements.above'), value: 'above' },
      { label: t('settings.live2d.speechBubblePlacements.left'), value: 'left' },
      { label: t('settings.live2d.speechBubblePlacements.right'), value: 'right' },
    ],
  });

  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(handleSave);
    const cleanupCancel = onCancel(handleCancel);

    return (): void => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel]);

  return (
    <Stack {...settingStyles.common.container}>
      <SwitchField
        label={t('settings.live2d.pointerInteractive')}
        checked={modelInfo.pointerInteractive ?? false}
        onChange={(checked) => handleInputChange('pointerInteractive', checked)}
      />

      <SwitchField
        label={t('settings.live2d.scrollToResize')}
        checked={modelInfo.scrollToResize ?? true}
        onChange={(checked) => handleInputChange('scrollToResize', checked)}
      />

      <SelectField
        label={t('settings.live2d.speechBubblePlacement')}
        value={[speechBubblePlacement]}
        onChange={(value) => {
          if (value[0]) handleSpeechBubblePlacementChange(value[0] as PetBubblePlacement);
        }}
        collection={bubblePlacements}
        placeholder={t('settings.live2d.speechBubblePlacement')}
        help={t('settings.live2d.speechBubblePlacementHelp')}
      />
    </Stack>
  );
}

export default live2D;
