import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
  /** Optional bottom bar for thumb-reachable actions and navigation. */
  bottomBar?: ReactNode;
}

/** Mobile-first page frame: safe-area padding, centred content, optional bottom bar. */
export function AppShell({ children, bottomBar }: AppShellProps) {
  return (
    <div className={styles.shell} data-testid="app-shell">
      <main className={styles.main}>{children}</main>
      {bottomBar ? <nav className={styles.bottomBar}>{bottomBar}</nav> : null}
    </div>
  );
}
