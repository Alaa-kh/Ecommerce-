import styles from './brand-logo.module.css';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  withWordmark?: boolean;
  wordmark?: string;
  tagline?: string;
  className?: string;
}

export function BrandLogo({
  size = 'md',
  withWordmark = false,
  wordmark,
  tagline,
  className,
}: BrandLogoProps) {
  const classes = [styles.logo, styles[size], className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      <svg
        className={styles.mark}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="14" className={styles.markBg} />
        <path
          d="M18 42V22l14 18 14-18v20"
          className={styles.markStroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="16" r="4" className={styles.markDot} />
      </svg>
      {withWordmark && wordmark ? (
        <span className={styles.wordmark}>
          <strong>{wordmark}</strong>
          {tagline ? <small>{tagline}</small> : null}
        </span>
      ) : null}
    </span>
  );
}
