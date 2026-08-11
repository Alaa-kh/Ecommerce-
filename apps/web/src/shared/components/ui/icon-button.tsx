import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './icon-button.module.css';

type IconButtonVariant = 'ghost' | 'secondary' | 'primary';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  badge?: number | string;
  active?: boolean;
}

export function IconButton({
  label,
  children,
  variant = 'ghost',
  size = 'md',
  badge,
  active = false,
  className,
  ...props
}: IconButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    active ? styles.active : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} aria-label={label} title={label} {...props}>
      <span className={styles.icon}>{children}</span>
      {badge !== undefined && badge !== 0 && badge !== '0' ? (
        <span className={styles.badge} aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
