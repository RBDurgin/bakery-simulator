import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Dialog.module.css';

interface DialogProps {
  heading: string;
  /** Called when Escape is pressed. Leave it out for a question that must be answered. */
  onEscape?: () => void;
  /** An alert dialog is announced at once, for questions and bad news. */
  alert?: boolean;
  testId: string;
  /** A line or two of words, then the buttons. */
  children: ReactNode;
}

/**
 * A small box in the middle of the screen that covers the game: the pause
 * screen, the menu, and questions such as deleting a save. The first button
 * gets the focus, and focus goes back to where it was afterwards.
 */
export function Dialog({ heading, onEscape, alert = false, testId, children }: DialogProps) {
  const dialog = useRef<HTMLDivElement>(null);
  const headingId = useId();

  useEffect(() => {
    const before = document.activeElement;
    dialog.current?.querySelector('button')?.focus();
    return () => {
      if (before instanceof HTMLElement && before.isConnected) before.focus();
    };
  }, []);

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialog}
        className={styles.dialog}
        role={alert ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={headingId}
        data-testid={testId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onEscape?.();
        }}
      >
        <h2 id={headingId} className={styles.heading}>
          {heading}
        </h2>
        {children}
      </div>
    </div>
  );
}
