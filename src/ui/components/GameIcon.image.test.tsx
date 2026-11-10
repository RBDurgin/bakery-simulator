import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameIcon } from './GameIcon';

// Proves the asset layer can swap an emoji for real art without changing callers.
vi.mock('../../assets', () => ({
  getAsset: () => ({ kind: 'image', src: '/art/cookie.png', label: 'Cookie' }),
}));

describe('GameIcon with image assets', () => {
  it('renders an image with alt text', () => {
    render(<GameIcon id="cookie" />);
    expect(screen.getByRole('img', { name: 'Cookie' })).toHaveAttribute('src', '/art/cookie.png');
  });

  it('renders a decorative image with empty alt text', () => {
    const { container } = render(<GameIcon id="cookie" decorative />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});
