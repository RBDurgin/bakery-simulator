import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  /** Small buttons sit inside lists; they still meet the touch-target size. */
  size?: 'normal' | 'small';
}

export function Button({ variant = 'primary', size = 'normal', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      {...rest}
    />
  );
}
