/* eslint-disable react/require-default-props */
import { Box, Button, Menu } from '@chakra-ui/react';
import {
  FiSettings, FiClock, FiPlus, FiChevronLeft, FiUsers, FiLayers,
} from 'react-icons/fi';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { sidebarStyles } from './sidebar-styles';
import SettingUI from './setting/setting-ui';
import ChatHistoryPanel from './chat-history-panel';
import BottomTab from './bottom-tab';
import HistoryDrawer from './history-drawer';
import { useSidebar } from '@/hooks/sidebar/use-sidebar';
import GroupDrawer from './group-drawer';
import { ModeType } from '@/context/mode-context';

// Type definitions
interface SidebarProps {
  isCollapsed?: boolean
  onToggle: () => void
}

interface HeaderButtonsProps {
  onSettingsOpen: () => void
  onNewHistory: () => void
  setMode: (mode: ModeType) => void
  currentMode: 'window' | 'pet'
  isElectron: boolean
}

// Reusable components
const ToggleButton = memo(({ isCollapsed, onToggle }: {
  isCollapsed: boolean
  onToggle: () => void
}) => (
  <Box
    {...sidebarStyles.sidebar.toggleButton}
    style={{
      transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
    }}
    onClick={onToggle}
  >
    <FiChevronLeft />
  </Box>
));

ToggleButton.displayName = 'ToggleButton';

const ModeMenu = memo(({ setMode, currentMode, isElectron }: {
  setMode: (mode: ModeType) => void
  currentMode: ModeType
  isElectron: boolean
}) => {
  const { t } = useTranslation();
  return (
    <Menu.Root>
      <Menu.Trigger
        as={Button}
        {...sidebarStyles.sidebar.headerButton}
        aria-label={t('sidebar.changeMode')}
        title={t('sidebar.changeMode')}
      >
        <FiLayers />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content
          bg="#11171b"
          borderColor="#2c363f"
          borderRadius="7px"
          color="#d7dde2"
          maxW="calc(100vw - 24px)"
        >
          <Menu.RadioItemGroup value={currentMode}>
            <Menu.RadioItem value="window" onClick={() => setMode('window')}>
              <Menu.ItemIndicator />
              {t('sidebar.windowMode')}
            </Menu.RadioItem>
            <Menu.RadioItem
              value="pet"
              onClick={() => {
                if (isElectron) {
                  setMode('pet');
                }
              }}
              disabled={!isElectron}
            >
              <Menu.ItemIndicator />
              {t('sidebar.petMode')}
            </Menu.RadioItem>
          </Menu.RadioItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
});

ModeMenu.displayName = 'ModeMenu';

const HeaderButtons = memo(({ onSettingsOpen, onNewHistory, setMode, currentMode, isElectron }: HeaderButtonsProps) => {
  const { t } = useTranslation();
  return (
    <Box display="flex" alignItems="center" width="full" gap={1.5}>
      <Button
        {...sidebarStyles.sidebar.headerButton}
        aria-label={t('common.settings')}
        title={t('common.settings')}
        onClick={onSettingsOpen}
      >
        <FiSettings />
      </Button>

      <GroupDrawer>
        <Button
          {...sidebarStyles.sidebar.headerButton}
          aria-label={t('group.management')}
          title={t('group.management')}
        >
          <FiUsers />
        </Button>
      </GroupDrawer>

      <HistoryDrawer>
        <Button
          {...sidebarStyles.sidebar.headerButton}
          aria-label={t('history.chatHistoryList')}
          title={t('history.chatHistoryList')}
        >
          <FiClock />
        </Button>
      </HistoryDrawer>

      <Button
        {...sidebarStyles.sidebar.headerButton}
        aria-label={t('settings.agent.runtime.newConversation')}
        title={t('settings.agent.runtime.newConversation')}
        onClick={onNewHistory}
      >
        <FiPlus />
      </Button>

      <Box width="1px" height="22px" bg="#2b343c" mx="0.5" />
      <ModeMenu setMode={setMode} currentMode={currentMode} isElectron={isElectron} />
    </Box>
  );
});

HeaderButtons.displayName = 'HeaderButtons';

const SidebarContent = memo(({
  onSettingsOpen,
  onNewHistory,
  setMode,
  currentMode,
  isElectron,
}: HeaderButtonsProps) => (
  <Box {...sidebarStyles.sidebar.content}>
    <Box {...sidebarStyles.sidebar.header}>
      <HeaderButtons
        onSettingsOpen={onSettingsOpen}
        onNewHistory={onNewHistory}
        setMode={setMode}
        currentMode={currentMode}
        isElectron={isElectron}
      />
    </Box>
    <ChatHistoryPanel />
    <BottomTab />
  </Box>
));

SidebarContent.displayName = 'SidebarContent';

// Main component
function Sidebar({ isCollapsed = false, onToggle }: SidebarProps): JSX.Element {
  const {
    settingsOpen,
    onSettingsOpen,
    onSettingsClose,
    createNewHistory,
    setMode,
    currentMode,
    isElectron,
  } = useSidebar();

  return (
    <Box {...sidebarStyles.sidebar.container(isCollapsed)}>
      <ToggleButton isCollapsed={isCollapsed} onToggle={onToggle} />

      {!isCollapsed && !settingsOpen && (
        <SidebarContent
          onSettingsOpen={onSettingsOpen}
          onNewHistory={createNewHistory}
          setMode={setMode}
          currentMode={currentMode}
          isElectron={isElectron}
        />
      )}

      {!isCollapsed && settingsOpen && (
        <SettingUI
          open={settingsOpen}
          onClose={onSettingsClose}
          onToggle={onToggle}
        />
      )}
    </Box>
  );
}

export default Sidebar;
