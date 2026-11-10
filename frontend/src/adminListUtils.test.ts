import { describe, expect, it } from 'vitest';
import { moveItem } from './adminListUtils';

describe('moveItem', () => {
  it('moves an item and keeps the others in order', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('returns an unchanged copy for out-of-range or identical positions', () => {
    const list = ['a', 'b'];
    expect(moveItem(list, 0, 2)).toEqual(['a', 'b']);
    expect(moveItem(list, -1, 0)).toEqual(['a', 'b']);
    expect(moveItem(list, 1, 1)).not.toBe(list);
  });
});