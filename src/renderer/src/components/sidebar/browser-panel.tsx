/* eslint-disable react/no-unknown-property */
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiArrowRight,
  FiGlobe,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { sidebarStyles } from './sidebar-styles';
import { useBrowser } from '@/context/browser-context';

interface BrowserNavigationEvent extends Event {
  url: string;
}

interface BrowserLoadErrorEvent extends Event {
  errorCode: number;
  errorDescription: string;
  isMainFrame: boolean;
}

function normalizeBrowserUrl(value: string): string | null {
  const candidate = /^(https?):\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;
  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function BrowserPlaceholder(): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box
      position="absolute"
      inset="0"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="2"
      pointerEvents="none"
    >
      <FiGlobe size={24} />
      <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
        {t('sidebar.noBrowserSession')}
      </Text>
    </Box>
  );
}

function BrowserPanel(): JSX.Element {
  const { t } = useTranslation();
  const { browserViewData } = useBrowser();
  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  const [address, setAddress] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isElectron = window.api !== undefined;

  const updateNavigation = useCallback((url?: string) => {
    const webview = webviewRef.current;
    if (url && url !== 'about:blank') {
      setAddress(url);
      setCurrentUrl(url);
    }
    if (!webview) return;
    setCanGoBack(webview.canGoBack());
    setCanGoForward(webview.canGoForward());
  }, []);

  useEffect(() => {
    const url = browserViewData?.debuggerFullscreenUrl;
    if (!url) return;
    setAddress(url);
    setCurrentUrl(url);
    setError(null);
  }, [browserViewData]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview || !isElectron) return undefined;
    const handleNavigate = (event: BrowserNavigationEvent) => {
      updateNavigation(event.url);
      setError(null);
    };
    const handleReady = () => updateNavigation(webview.getURL());
    const handleStart = () => setIsLoading(true);
    const handleStop = () => {
      setIsLoading(false);
      updateNavigation(webview.getURL());
    };
    const handleError = (event: BrowserLoadErrorEvent) => {
      if (!event.isMainFrame || event.errorCode === -3) return;
      setIsLoading(false);
      setError(event.errorDescription);
    };

    webview.addEventListener('dom-ready', handleReady);
    webview.addEventListener('did-navigate', handleNavigate);
    webview.addEventListener('did-navigate-in-page', handleNavigate);
    webview.addEventListener('did-start-loading', handleStart);
    webview.addEventListener('did-stop-loading', handleStop);
    webview.addEventListener('did-fail-load', handleError);
    return () => {
      webview.removeEventListener('dom-ready', handleReady);
      webview.removeEventListener('did-navigate', handleNavigate);
      webview.removeEventListener('did-navigate-in-page', handleNavigate);
      webview.removeEventListener('did-start-loading', handleStart);
      webview.removeEventListener('did-stop-loading', handleStop);
      webview.removeEventListener('did-fail-load', handleError);
    };
  }, [currentUrl, isElectron, updateNavigation]);

  const navigate = (event: FormEvent<HTMLElement>): void => {
    event.preventDefault();
    const url = normalizeBrowserUrl(address);
    if (!url) {
      setError(t('sidebar.invalidBrowserAddress'));
      return;
    }
    setCurrentUrl(url);
    setAddress(url);
    setError(null);
    if (webviewRef.current?.getURL() !== url) {
      webviewRef.current?.loadURL(url);
    }
  };

  const browserSurface = (() => {
    if (!currentUrl) return null;
    if (isElectron) {
      return (
        <webview
          ref={webviewRef}
          src={currentUrl || 'about:blank'}
          partition="persist:open-llm-vtuber-browser"
          style={sidebarStyles.browserPanel.webview}
        />
      );
    }
    return (
      <iframe
        src={currentUrl}
        title={t('sidebar.browser')}
        style={sidebarStyles.browserPanel.webview}
        sandbox="allow-forms allow-same-origin allow-scripts"
      />
    );
  })();

  return (
    <Box {...sidebarStyles.browserPanel.container}>
      <Flex
        as="form"
        align="center"
        gap="1.5"
        mb="2"
        onSubmit={navigate}
      >
        <Button
          type="button"
          aria-label={t('sidebar.browserBack')}
          title={t('sidebar.browserBack')}
          {...sidebarStyles.browserPanel.navigationButton}
          disabled={!canGoBack}
          onClick={() => webviewRef.current?.goBack()}
        >
          <FiArrowLeft />
        </Button>
        <Button
          type="button"
          aria-label={t('sidebar.browserForward')}
          title={t('sidebar.browserForward')}
          {...sidebarStyles.browserPanel.navigationButton}
          disabled={!canGoForward}
          onClick={() => webviewRef.current?.goForward()}
        >
          <FiArrowRight />
        </Button>
        <Button
          type="button"
          aria-label={t('sidebar.browserReload')}
          title={t('sidebar.browserReload')}
          {...sidebarStyles.browserPanel.navigationButton}
          onClick={() => webviewRef.current?.reload()}
          disabled={!currentUrl}
        >
          <FiRefreshCw className={isLoading ? 'runtime-scan-spin' : undefined} />
        </Button>
        <Input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder={t('sidebar.browserAddress')}
          height="36px"
          minW="0"
          px="2.5"
          fontSize="xs"
          color="#e7ecf0"
          bg="#11171b"
          borderColor="#303a42"
          _focusVisible={{ borderColor: '#6e99c8', boxShadow: 'none' }}
        />
      </Flex>

      {error && (
        <Text color="#ef8a90" fontSize="2xs" mb="2" overflowWrap="anywhere">
          {error}
        </Text>
      )}

      <Box {...sidebarStyles.browserPanel.browserContainer} position="relative">
        {browserSurface}
        {!currentUrl && <BrowserPlaceholder />}
      </Box>
    </Box>
  );
}

export default BrowserPanel;
