interface Window {
  api?: {
    setIgnoreMouseEvents: (ignore: boolean) => void
    updateComponentHover: (componentId: string, isHovering: boolean) => void
    selectDirectory?: () => Promise<string | null>
    showContextMenu?: () => void
    onModeChanged: (callback: (mode: string) => void) => void
  }
}
