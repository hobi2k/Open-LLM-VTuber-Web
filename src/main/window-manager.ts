/* eslint-disable no-param-reassign */
import {
  BrowserWindow, screen, shell, ipcMain,
} from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import {
  PetInteractiveRegion,
  petCursorInInteractiveRegion,
  petWindowInteractionState,
} from './pet-window-state';

const isMac = process.platform === 'darwin';
const PET_CURSOR_POLL_INTERVAL_MS = 16;
const PET_INTERACTION_EXIT_GRACE_MS = 750;

function isSafeBrowserUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'about:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export class WindowManager {
  private window: BrowserWindow | null = null;

  private windowedBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  private petInteractiveRegions: Map<string, PetInteractiveRegion> = new Map();

  private petInteractionTimer: NodeJS.Timeout | null = null;

  private mousePassthrough: boolean | null = null;

  private petInteractiveUntil = 0;

  private currentMode: 'window' | 'pet' = 'window';

  // Track if mouse events are forcibly ignored
  private forceIgnoreMouse = false;

  constructor() {
    ipcMain.on('renderer-ready-for-mode-change', (_event, newMode) => {
      if (newMode === 'pet') {
        setTimeout(() => {
          this.continueSetWindowModePet();
        }, 500);
      } else {
        setTimeout(() => {
          this.continueSetWindowModeWindow();
        }, 500);
      }
    });

    ipcMain.on('mode-change-rendered', () => {
      this.revealWindow();
    });

    ipcMain.on('window-unfullscreen', () => {
      const window = this.getWindow();
      if (window && window.isFullScreen()) {
        window.setFullScreen(false);
      }
    });

    // Handle toggle force ignore mouse events from renderer
    ipcMain.on('toggle-force-ignore-mouse', () => {
      this.toggleForceIgnoreMouse();
    });
  }

  createWindow(options: Electron.BrowserWindowConstructorOptions): BrowserWindow {
    this.window = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      transparent: true,
      backgroundColor: '#ffffff',
      autoHideMenuBar: true,
      frame: false,
      icon: process.platform === 'win32'
        ? join(__dirname, '../../resources/icon.ico')
        : join(__dirname, '../../resources/icon.png'),
      ...(isMac ? { titleBarStyle: 'hiddenInset' } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true,
      },
      hasShadow: false,
      paintWhenInitiallyHidden: true,
      ...options,
    });

    this.setupWindowEvents();
    this.setupWebviewSecurity();
    this.loadContent();

    this.window.on('enter-full-screen', () => {
      this.window?.webContents.send('window-fullscreen-change', true);
    });

    this.window.on('leave-full-screen', () => {
      this.window?.webContents.send('window-fullscreen-change', false);
    });

    this.window.on('closed', () => {
      this.stopPetInteractionTracking();
      this.window = null;
    });

    return this.window;
  }

  private setupWindowEvents(): void {
    if (!this.window) return;

    this.window.on('ready-to-show', () => {
      this.window?.show();
      this.window?.webContents.send(
        'window-maximized-change',
        this.window.isMaximized(),
      );
    });

    this.window.on('maximize', () => {
      this.window?.webContents.send('window-maximized-change', true);
    });

    this.window.on('unmaximize', () => {
      this.window?.webContents.send('window-maximized-change', false);
    });

    this.window.on('resize', () => {
      const window = this.getWindow();
      if (window) {
        const bounds = window.getBounds();
        const { width, height } = screen.getPrimaryDisplay().workArea;
        const isMaximized = bounds.width >= width && bounds.height >= height;
        window.webContents.send('window-maximized-change', isMaximized);
      }
    });

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  }

  private setupWebviewSecurity(): void {
    if (!this.window) return;

    this.window.webContents.on('will-attach-webview', (_event, preferences) => {
      delete preferences.preload;
      preferences.nodeIntegration = false;
      preferences.contextIsolation = true;
      preferences.sandbox = true;
    });
    this.window.webContents.on('did-attach-webview', (_event, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        if (isSafeBrowserUrl(url)) {
          contents.loadURL(url).catch((error) => {
            console.error('Failed to open browser view URL:', error);
          });
        }
        return { action: 'deny' };
      });
      contents.on('will-navigate', (event, url) => {
        if (!isSafeBrowserUrl(url)) event.preventDefault();
      });
    });
  }

  private loadContent(): void {
    if (!this.window) return;

    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      this.window.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'));
    }
  }

  setWindowMode(mode: 'window' | 'pet'): void {
    if (!this.window) return;

    this.currentMode = mode;
    this.window.setOpacity(0);

    if (mode === 'window') {
      this.setWindowModeWindow();
    } else {
      this.setWindowModePet();
    }
  }

  private setWindowModeWindow(): void {
    if (!this.window) return;

    this.stopPetInteractionTracking();
    this.petInteractiveRegions.clear();
    this.petInteractiveUntil = 0;
    this.window.setAlwaysOnTop(false);
    this.setMousePassthrough(false);
    this.window.setSkipTaskbar(false);
    this.window.setResizable(true);
    this.window.setFocusable(true);
    this.window.setAlwaysOnTop(false);

    this.window.setBackgroundColor('#ffffff');
    this.window.webContents.send('pre-mode-changed', 'window');
  }

  private continueSetWindowModeWindow(): void {
    if (!this.window) return;
    if (this.windowedBounds) {
      this.window.setBounds(this.windowedBounds);
    } else {
      this.window.setSize(900, 670);
      this.window.center();
    }

    if (isMac) {
      this.window.setWindowButtonVisibility(true);
      this.window.setVisibleOnAllWorkspaces(false, {
        visibleOnFullScreen: false,
      });
    }

    this.setMousePassthrough(false);

    this.window.webContents.send('mode-changed', 'window');
    this.scheduleReveal('window');
  }

  private setWindowModePet(): void {
    if (!this.window) return;

    this.petInteractiveRegions.clear();
    this.petInteractiveUntil = 0;
    this.windowedBounds = this.window.getBounds();

    if (this.window.isFullScreen()) {
      this.window.setFullScreen(false);
    }

    this.window.setBackgroundColor('#00000000');

    this.window.setAlwaysOnTop(true, 'screen-saver');

    this.window.webContents.send('pre-mode-changed', 'pet');
  }

  private continueSetWindowModePet(): void {
    if (!this.window) return;

    // A canvas spanning every display can exceed WebGL's renderbuffer limit.
    // Keep the pet on the display where window mode was last visible.
    const display = screen.getDisplayMatching(
      this.windowedBounds || this.window.getBounds(),
    );
    this.window.setBounds(display.workArea);

    if (isMac) this.window.setWindowButtonVisibility(false);
    this.window.setResizable(false);
    this.window.setSkipTaskbar(true);
    // macOS must keep the pet window focusable so forwarded hover events can
    // activate the input dock and model before the click is delivered.
    this.window.setFocusable(true);

    if (isMac) {
      this.setMousePassthrough(true);
      this.window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
    } else {
      this.setMousePassthrough(true);
    }

    this.startPetInteractionTracking();

    this.window.webContents.send('mode-changed', 'pet');
    this.scheduleReveal('pet');
  }

  getWindow(): BrowserWindow | null {
    return this.window;
  }

  setIgnoreMouseEvents(ignore: boolean): void {
    this.setMousePassthrough(ignore);
  }

  maximizeWindow(): void {
    if (!this.window) return;

    if (this.isWindowMaximized()) {
      if (this.windowedBounds) {
        this.window.setBounds(this.windowedBounds);
        this.windowedBounds = null;
        this.window.webContents.send('window-maximized-change', false);
      }
    } else {
      this.windowedBounds = this.window.getBounds();
      const { width, height } = screen.getPrimaryDisplay().workArea;
      this.window.setBounds({
        x: 0, y: 0, width, height,
      });
      this.window.webContents.send('window-maximized-change', true);
    }
  }

  isWindowMaximized(): boolean {
    if (!this.window) return false;
    const bounds = this.window.getBounds();
    const { width, height } = screen.getPrimaryDisplay().workArea;
    return bounds.width >= width && bounds.height >= height;
  }

  updateComponentHover(_componentId: string, isHovering: boolean): void {
    if (this.currentMode === 'window') return;
    if (isHovering) this.petInteractiveUntil = Date.now() + PET_INTERACTION_EXIT_GRACE_MS;
    this.refreshPetInteraction();
  }

  updatePetInteractiveRegion(
    componentId: string,
    region: PetInteractiveRegion | null,
  ): void {
    if (this.currentMode !== 'pet') return;
    if (!region) {
      this.petInteractiveRegions.delete(componentId);
      this.refreshPetInteraction();
      return;
    }

    const valid = [region.x, region.y, region.width, region.height]
      .every(Number.isFinite)
      && region.width > 0
      && region.height > 0;
    if (!valid) return;

    this.petInteractiveRegions.set(componentId, region);
    this.refreshPetInteraction();
  }

  // Toggle force ignore mouse events
  toggleForceIgnoreMouse(): void {
    this.forceIgnoreMouse = !this.forceIgnoreMouse;

    // Apply the new setting immediately
    this.refreshPetInteraction();

    // Notify renderer about the change
    this.window?.webContents.send('force-ignore-mouse-changed', this.forceIgnoreMouse);
  }

  // Get current force ignore state
  isForceIgnoreMouse(): boolean {
    return this.forceIgnoreMouse;
  }

  // Get current mode
  getCurrentMode(): 'window' | 'pet' {
    return this.currentMode;
  }

  private setMousePassthrough(ignore: boolean): void {
    if (this.mousePassthrough === ignore) return;
    this.mousePassthrough = ignore;
    this.window?.setIgnoreMouseEvents(ignore, { forward: true });
  }

  private startPetInteractionTracking(): void {
    this.stopPetInteractionTracking();
    this.refreshPetInteraction();
    this.petInteractionTimer = setInterval(() => {
      this.refreshPetInteraction();
    }, PET_CURSOR_POLL_INTERVAL_MS);
  }

  private stopPetInteractionTracking(): void {
    if (!this.petInteractionTimer) return;
    clearInterval(this.petInteractionTimer);
    this.petInteractionTimer = null;
  }

  private refreshPetInteraction(): void {
    if (this.currentMode !== 'pet' || !this.window) return;
    const bounds = this.window.getBounds();
    const cursor = screen.getCursorScreenPoint();
    const cursorInside = petCursorInInteractiveRegion(
      { x: cursor.x - bounds.x, y: cursor.y - bounds.y },
      [...this.petInteractiveRegions.values()],
    );
    if (cursorInside) this.petInteractiveUntil = Date.now() + PET_INTERACTION_EXIT_GRACE_MS;
    const isInteractive = cursorInside || Date.now() < this.petInteractiveUntil;
    const state = petWindowInteractionState(isInteractive ? 1 : 0, this.forceIgnoreMouse);
    this.setMousePassthrough(state.ignoreMouse);
  }

  private revealWindow(): void {
    this.window?.webContents.invalidate();
    this.window?.setOpacity(1);
  }

  private scheduleReveal(mode: 'window' | 'pet'): void {
    setTimeout(() => {
      if (this.currentMode === mode) this.revealWindow();
    }, 250);
  }
}
