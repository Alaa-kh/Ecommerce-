import type { ReactNode } from 'react';
import styles from './badge.module.css';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
