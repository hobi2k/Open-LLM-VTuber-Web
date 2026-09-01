import { describe, expect, it } from 'vitest';
import { petWindowInteractionState } from './pet-window-state';

describe('petWindowInteractionState', () => {
  it('passes clicks through and drops focus outside interactive regions', () => {
    expect(petWindowInteractionState(0, false)).toEqual({
      focusable: false,
      ignoreMouse: true,
    });
  });

  it('accepts input only while an interactive pet component is hovered', () => {
    expect(petWindowInteractionState(1, false)).toEqual({
      focusable: true,
      ignoreMouse: false,
    });
  });

  it('keeps forced passthrough authoritative', () => {
    expect(petWindowInteractionState(2, true)).toEqual({
      focusable: false,
      ignoreMouse: true,
    });
  });
});
