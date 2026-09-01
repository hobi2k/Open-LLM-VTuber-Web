interface Window {
  api?: {
    setIgnoreMouseEvents: (ignore: boolean) => void
    updateComponentHover: (componentId: string, isHovering: boolean) => void
    updatePetInteractiveRegion: (
      componentId: string,
      region: { x: number; y: number; width: number; height: number } | null,
    ) => void
    selectDirectory?: () => Promise<string | null>
    showContextMenu?: () => void
    onModeChanged: (callback: (mode: string) => void) => void
  }
}
