import { Box, Button, Flex, Tabs } from '@chakra-ui/react';
import {
  FiCamera,
  FiChevronDown,
  FiChevronUp,
  FiGlobe,
  FiMonitor,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
import { sidebarStyles } from './sidebar-styles';
import CameraPanel from './camera-panel';
import ScreenPanel from './screen-panel';
import BrowserPanel from './browser-panel';

type MediaTab = 'camera' | 'screen' | 'browser';

function BottomTab(): JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useLocalStorage<MediaTab>(
    'sidebarMediaTab',
    'camera',
  );
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    'sidebarMediaCollapsed',
    false,
  );

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(details) => {
        if (!details.value) return;
        setActiveTab(details.value as MediaTab);
        setIsCollapsed(false);
      }}
      variant="plain"
      {...sidebarStyles.bottomTab.container}
    >
      <Flex align="center" gap="2">
        <Tabs.List {...sidebarStyles.bottomTab.list}>
          <Tabs.Trigger value="camera" {...sidebarStyles.bottomTab.trigger}>
            <FiCamera />
            {t('sidebar.camera')}
          </Tabs.Trigger>
          <Tabs.Trigger value="screen" {...sidebarStyles.bottomTab.trigger}>
            <FiMonitor />
            {t('sidebar.screen')}
          </Tabs.Trigger>
          <Tabs.Trigger value="browser" {...sidebarStyles.bottomTab.trigger}>
            <FiGlobe />
            {t('sidebar.browser')}
          </Tabs.Trigger>
        </Tabs.List>
        <Button
          aria-label={t(
            isCollapsed
              ? 'sidebar.expandMediaPanel'
              : 'sidebar.collapseMediaPanel',
          )}
          title={t(
            isCollapsed
              ? 'sidebar.expandMediaPanel'
              : 'sidebar.collapseMediaPanel',
          )}
          variant="outline"
          minW="10"
          width="10"
          height="42px"
          p="0"
          borderColor="#273039"
          color="#a9b3bc"
          bg="#11171b"
          _hover={{ bg: '#20282f', color: '#f1f4f6' }}
          onClick={() => setIsCollapsed((value) => !value)}
        >
          {isCollapsed ? <FiChevronUp /> : <FiChevronDown />}
        </Button>
      </Flex>

      <Box
        maxHeight={isCollapsed ? '0' : '330px'}
        opacity={isCollapsed ? 0 : 1}
        transform={isCollapsed ? 'translateY(8px)' : 'translateY(0)'}
        pointerEvents={isCollapsed ? 'none' : 'auto'}
        overflow="hidden"
        transition="max-height 220ms ease, opacity 160ms ease, transform 220ms ease"
      >
        <Tabs.Content value="camera">
          <CameraPanel />
        </Tabs.Content>

        <Tabs.Content value="screen">
          <ScreenPanel />
        </Tabs.Content>

        <Tabs.Content value="browser">
          <BrowserPanel />
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  );
}

export default BottomTab;
