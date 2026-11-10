import { TEXT_SIZES } from '../../save/settings';
import { text } from '../../content/text';
import { useSettingsStore } from '../../store/settingsStore';
import { wantsLessMotion } from '../motion';
import { Panel } from './Panel';
import styles from './SettingsPanel.module.css';

/** Sound, movement and text size. These belong to the device, not to one save. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useSettingsStore((store) => store.settings);
  const change = useSettingsStore((store) => store.change);

  return (
    <Panel
      title={text.settings.heading}
      closeLabel={text.settings.done}
      onClose={onClose}
      testId="settings-panel"
    >
      <label className={styles.option}>
        <input
          type="checkbox"
          className={styles.box}
          checked={settings.sound}
          aria-labelledby="sound-name"
          aria-describedby="sound-hint"
          data-testid="setting-sound"
          onChange={(event) => change({ sound: event.target.checked })}
        />
        <span className={styles.words}>
          <span id="sound-name" className={styles.name}>
            {text.settings.sound}
          </span>
          <span id="sound-hint" className={styles.hint}>
            {text.settings.soundHint}
          </span>
        </span>
      </label>

      <label className={styles.option}>
        <input
          type="checkbox"
          className={styles.box}
          checked={wantsLessMotion(settings)}
          aria-labelledby="motion-name"
          aria-describedby="motion-hint"
          data-testid="setting-motion"
          onChange={(event) => change({ reducedMotion: event.target.checked })}
        />
        <span className={styles.words}>
          <span id="motion-name" className={styles.name}>
            {text.settings.motion}
          </span>
          <span id="motion-hint" className={styles.hint}>
            {text.settings.motionHint}
          </span>
        </span>
      </label>

      <fieldset className={styles.group}>
        <legend className={styles.name}>{text.settings.textSize}</legend>
        <div className={styles.sizes}>
          {TEXT_SIZES.map((size) => (
            <label key={size} className={styles.size} data-testid={`text-size-${size}`}>
              <input
                type="radio"
                name="text-size"
                className={styles.sizeInput}
                value={size}
                checked={settings.textSize === size}
                onChange={() => change({ textSize: size })}
              />
              {text.settings.sizes[size]}
            </label>
          ))}
        </div>
      </fieldset>
    </Panel>
  );
}
