import { describe, expect, it } from 'vitest';
import {
  petCursorInInteractiveRegion,
  petWindowInteractionState,
} from './pet-window-state';

describe('petWindowInteractionState', () => {
  it('passes clicks through outside interactive regions', () => {
    expect(petWindowInteractionState(0, false)).toEqual({
      ignoreMouse: true,
    });
  });

  it('accepts input only while an interactive pet component is hovered', () => {
    expect(petWindowInteractionState(1, false)).toEqual({
      ignoreMouse: false,
    });
  });

  it('keeps forced passthrough authoritative', () => {
    expect(petWindowInteractionState(2, true)).toEqual({
      ignoreMouse: true,
    });
  });
});

describe('petCursorInInteractiveRegion', () => {
  const regions = [{ x: 100, y: 200, width: 80, height: 40 }];

  it('detects the cursor inside a renderer-reported region', () => {
    expect(petCursorInInteractiveRegion({ x: 140, y: 220 }, regions)).toBe(true);
  });

  it('keeps the desktop clickable outside the reported regions', () => {
    expect(petCursorInInteractiveRegion({ x: 99, y: 220 }, regions)).toBe(false);
    expect(petCursorInInteractiveRegion({ x: 180, y: 220 }, regions)).toBe(false);
  });

  it('ignores malformed regions', () => {
    expect(petCursorInInteractiveRegion(
      { x: 100, y: 200 },
      [{ x: 100, y: 200, width: Number.NaN, height: 40 }],
    )).toBe(false);
  });
});
