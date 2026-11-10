import { describe, expect, it } from 'vitest';
import { ASSET_IDS, getAsset } from './index';

describe('asset layer', () => {
  it('has a label for every asset, so an icon is never the only signal', () => {
    for (const id of ASSET_IDS) {
      expect(getAsset(id).label.trim()).not.toBe('');
    }
  });

  it('returns emoji assets for the starter set', () => {
    expect(getAsset('cookie')).toEqual({ kind: 'emoji', emoji: '🍪', label: 'Cookie' });
  });
});
