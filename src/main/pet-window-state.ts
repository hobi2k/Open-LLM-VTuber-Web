export interface PetWindowInteractionState {
  ignoreMouse: boolean;
}

export interface PetInteractiveRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PetCursorPoint {
  x: number;
  y: number;
}

export function petWindowInteractionState(
  interactiveRegionCount: number,
  forceIgnoreMouse: boolean,
): PetWindowInteractionState {
  const interactive = !forceIgnoreMouse && interactiveRegionCount > 0;
  return {
    ignoreMouse: !interactive,
  };
}

export function petCursorInInteractiveRegion(
  point: PetCursorPoint,
  regions: PetInteractiveRegion[],
): boolean {
  return regions.some((region) => (
    Number.isFinite(region.x)
    && Number.isFinite(region.y)
    && Number.isFinite(region.width)
    && Number.isFinite(region.height)
    && region.width > 0
    && region.height > 0
    && point.x >= region.x
    && point.x < region.x + region.width
    && point.y >= region.y
    && point.y < region.y + region.height
  ));
}
