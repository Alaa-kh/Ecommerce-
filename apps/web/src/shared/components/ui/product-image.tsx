import { useState } from 'react';
import styles from './product-image.module.css';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function ProductImage({
  src,
  alt,
  className,
  loading = 'lazy',
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        className={[styles.fallback, styles.reveal, className].filter(Boolean).join(' ')}
        role="img"
        aria-label={alt}
      >
        <span className={styles.pattern} aria-hidden="true" />
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.label}>Lumina</span>
      </div>
    );
  }

  return (
    <img
      className={[
        styles.image,
        loaded ? styles.loaded : styles.loading,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}
