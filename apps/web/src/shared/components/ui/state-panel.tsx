import type { ReactNode } from 'react';
import { Button } from '@/shared/components/ui/button';
import styles from './state-panel.module.css';

interface StatePanelProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  tone?: 'neutral' | 'error' | 'empty';
  icon?: ReactNode;
}

export function StatePanel({
  title,
  description,
  actionLabel,
  onAction,
  children,
  tone = 'neutral',
  icon,
}: StatePanelProps) {
  return (
    <div className={`${styles.panel} ${styles[tone]}`} role="status">
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      <h2 className={styles.title}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children}
      {actionLabel && onAction ? (
        <Button type="button" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
