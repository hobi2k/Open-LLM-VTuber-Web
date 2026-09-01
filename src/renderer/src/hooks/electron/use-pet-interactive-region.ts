import { RefObject, useEffect } from 'react';

export function usePetInteractiveRegion(
  componentId: string,
  elementRef: RefObject<HTMLElement | null>,
  active: boolean,
  padding = 0,
): void {
  useEffect(() => {
    const { api } = window;
    if (!api?.updatePetInteractiveRegion || !active) {
      api?.updatePetInteractiveRegion?.(componentId, null);
      return undefined;
    }

    let previous = '';
    const update = () => {
      const rect = elementRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        const region = {
          x: rect.left - padding,
          y: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        };
        const key = [region.x, region.y, region.width, region.height]
          .map((value) => Math.round(value * 2) / 2)
          .join(':');
        if (key !== previous) {
          previous = key;
          api.updatePetInteractiveRegion(componentId, region);
        }
      }
    };

    update();
    const interval = window.setInterval(update, 80);
    return () => {
      window.clearInterval(interval);
      api.updatePetInteractiveRegion(componentId, null);
    };
  }, [active, componentId, elementRef, padding]);
}
