import { text } from '../../content/text';
import { Button } from './Button';
import { Dialog } from './Dialog';
import styles from './Dialog.module.css';

interface MenuDialogProps {
  /** True while the shop is open: the clock is stopped and the shop can be closed early. */
  shopOpen: boolean;
  onResume: () => void;
  onCloseShop: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

/**
 * Covers the game while it is stopped. While the shop is open this is the
 * pause screen; at other times of day it is a plain menu.
 */
export function MenuDialog({
  shopOpen,
  onResume,
  onCloseShop,
  onSettings,
  onQuit,
}: MenuDialogProps) {
  const words = shopOpen ? text.pause : text.menu;
  return (
    <Dialog heading={words.heading} onEscape={onResume} testId="pause-dialog">
      <p className={styles.body}>{words.body}</p>
      <Button onClick={onResume} data-testid="resume-button">
        {text.pause.resume}
      </Button>
      {shopOpen ? (
        <Button variant="secondary" onClick={onCloseShop} data-testid="close-shop-button">
          {text.pause.closeShop}
        </Button>
      ) : null}
      <Button variant="secondary" onClick={onSettings} data-testid="settings-button">
        {text.pause.settings}
      </Button>
      <Button variant="secondary" onClick={onQuit} data-testid="quit-button">
        {words.quit}
      </Button>
      {shopOpen ? (
        <p className={styles.note} data-testid="quit-note">
          {text.pause.quitNote}
        </p>
      ) : null}
    </Dialog>
  );
}
