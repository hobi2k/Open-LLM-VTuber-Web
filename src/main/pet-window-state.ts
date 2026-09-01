export interface PetWindowInteractionState {
  focusable: boolean;
  ignoreMouse: boolean;
}

export function petWindowInteractionState(
  hoveringComponentCount: number,
  forceIgnoreMouse: boolean,
): PetWindowInteractionState {
  const interactive = !forceIgnoreMouse && hoveringComponentCount > 0;
  return {
    focusable: interactive,
    ignoreMouse: !interactive,
  };
}
