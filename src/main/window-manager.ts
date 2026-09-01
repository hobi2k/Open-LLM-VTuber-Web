import {
  BrowserWindow, screen, shell, ipcMain,
} from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { petWindowInteractionState } from './pet-window-state';

const isMac = process.platform === 'darwin';

export class WindowManager {
  private window: BrowserWindow | null = null;

  private windowedBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  private hoveringComponents: Set<string> = new Set();

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
      },
      hasShadow: false,
      paintWhenInitiallyHidden: true,
      ...options,
    });

    this.setupWindowEvents();
    this.loadContent();

    this.window.on('enter-full-screen', () => {
      this.window?.webContents.send('window-fullscreen-change', true);
    });

    this.window.on('leave-full-screen', () => {
      this.window?.webContents.send('window-fullscreen-change', false);
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

    this.hoveringComponents.clear();
    this.window.setAlwaysOnTop(false);
    this.window.setIgnoreMouseEvents(false);
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

    this.window?.setIgnoreMouseEvents(false, { forward: true });

    this.window.webContents.send('mode-changed', 'window');
    this.scheduleReveal('window');
  }

  private setWindowModePet(): void {
    if (!this.window) return;

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
    this.window.setFocusable(false);
    this.window.blur();

    this.hoveringComponents.clear();
    if (isMac) {
      this.setMousePassthrough(true);
      this.window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
    } else {
      this.setMousePassthrough(true);
    }

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

  updateComponentHover(componentId: string, isHovering: boolean): void {
    if (this.currentMode === 'window') return;

    if (isHovering) {
      this.hoveringComponents.add(componentId);
    } else {
      this.hoveringComponents.delete(componentId);
    }

    if (this.window) {
      const state = petWindowInteractionState(
        this.hoveringComponents.size,
        this.forceIgnoreMouse,
      );
      this.setMousePassthrough(state.ignoreMouse);
      this.window.setFocusable(state.focusable);
      if (!state.focusable) this.window.blur();
    }
  }

  // Toggle force ignore mouse events
  toggleForceIgnoreMouse(): void {
    this.forceIgnoreMouse = !this.forceIgnoreMouse;

    // Apply the new setting immediately
    const state = petWindowInteractionState(
      this.hoveringComponents.size,
      this.forceIgnoreMouse,
    );
    this.setMousePassthrough(state.ignoreMouse);
    this.window?.setFocusable(state.focusable);
    if (!state.focusable) this.window?.blur();

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
    this.window?.setIgnoreMouseEvents(ignore, { forward: true });
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
