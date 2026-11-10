import { useEffect, useRef } from 'react';
import { text } from '../../content/text';
import { Button } from './Button';
import styles from './PauseDialog.module.css';

interface PauseDialogProps {
  onResume: () => void;
  onCloseShop: () => void;
}

/** Covers the open screen while the clock is stopped. */
export function PauseDialog({ onResume, onCloseShop }: PauseDialogProps) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.querySelector('button')?.focus();
  }, []);

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialog}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-heading"
        data-testid="pause-dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onResume();
        }}
      >
        <h2 id="pause-heading" className={styles.heading}>
          {text.pause.heading}
        </h2>
        <p className={styles.body}>{text.pause.body}</p>
        <Button onClick={onResume} data-testid="resume-button">
          {text.pause.resume}
        </Button>
        <Button variant="secondary" onClick={onCloseShop} data-testid="close-shop-button">
          {text.pause.closeShop}
        </Button>
      </div>
    </div>
  );
}
