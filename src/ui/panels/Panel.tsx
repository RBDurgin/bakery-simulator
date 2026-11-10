import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from '../components/Button';
import styles from './Panel.module.css';

interface PanelProps {
  title: string;
  closeLabel: string;
  onClose: () => void;
  testId: string;
  children: ReactNode;
}

/**
 * A menu panel that slides up over the place where its job is done. The
 * clock is stopped while it is open. Escape closes it, and focus goes back
 * to where it was.
 */
export function Panel({ title, closeLabel, onClose, testId, children }: PanelProps) {
  const sheet = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const before = document.activeElement;
    sheet.current?.focus();
    return () => {
      if (before instanceof HTMLElement && before.isConnected) before.focus();
    };
  }, []);

  return (
    <div className={styles.backdrop}>
      <div
        ref={sheet}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {/* The body scrolls, so the close button is always in reach. */}
        <div className={styles.body} tabIndex={0} role="group" aria-labelledby={titleId}>
          {children}
        </div>
        <Button onClick={onClose} data-testid="panel-close">
          {closeLabel}
        </Button>
      </div>
    </div>
  );
}
