import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stars } from './Stars';

describe('Stars', () => {
  it('shows filled and empty stars with words for screen readers', () => {
    render(<Stars stars={2} />);
    const stars = screen.getByRole('img', { name: '2 out of 5 stars' });
    expect(stars).toHaveTextContent('★★☆☆☆');
  });
});
