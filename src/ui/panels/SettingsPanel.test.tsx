import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { text } from '../../content/text';
import { readSettings } from '../../save/settings';
import { useSettingsStore } from '../../store/settingsStore';
import { SettingsPanel } from './SettingsPanel';

const settings = () => useSettingsStore.getState().settings;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SettingsPanel', () => {
  it('switches sound off and on, and stores the choice', async () => {
    render(<SettingsPanel onClose={vi.fn()} />);
    const sound = screen.getByRole('checkbox', { name: text.settings.sound });
    expect(sound).toBeChecked();
    expect(sound).toHaveAccessibleDescription(text.settings.soundHint);

    await userEvent.click(sound);
    expect(settings().sound).toBe(false);
    expect(readSettings().sound).toBe(false);
    await userEvent.click(sound);
    expect(settings().sound).toBe(true);
  });

  it('follows the device for less movement until the player chooses', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(<SettingsPanel onClose={vi.fn()} />);
    const motion = screen.getByRole('checkbox', { name: text.settings.motion });
    expect(motion).toBeChecked();
    expect(settings().reducedMotion).toBeNull();

    await userEvent.click(motion);
    expect(motion).not.toBeChecked();
    expect(settings().reducedMotion).toBe(false);
  });

  it('is full movement where the device says nothing', async () => {
    render(<SettingsPanel onClose={vi.fn()} />);
    const motion = screen.getByRole('checkbox', { name: text.settings.motion });
    expect(motion).not.toBeChecked();
    await userEvent.click(motion);
    expect(settings().reducedMotion).toBe(true);
  });

  it('picks a text size', async () => {
    render(<SettingsPanel onClose={vi.fn()} />);
    expect(screen.getByRole('radio', { name: text.settings.sizes.normal })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: text.settings.sizes.larger }));
    expect(settings().textSize).toBe('larger');
    expect(screen.getByRole('radio', { name: text.settings.sizes.larger })).toBeChecked();
  });

  it('closes with Done', async () => {
    const onClose = vi.fn();
    render(<SettingsPanel onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: text.settings.done }));
    expect(onClose).toHaveBeenCalled();
  });
});
