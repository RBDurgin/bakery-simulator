import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameIcon } from './GameIcon';

describe('GameIcon', () => {
  it('renders an emoji with an accessible label', () => {
    render(<GameIcon id="cookie" />);
    expect(screen.getByRole('img', { name: 'Cookie' })).toHaveTextContent('🍪');
  });

  it('hides decorative icons from assistive technology', () => {
    const { container } = render(<GameIcon id="cookie" decorative />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
