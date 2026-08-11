import type { CSSProperties } from 'react';
import styles from './skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  radius = 'md',
  className,
}: SkeletonProps) {
  const style: CSSProperties = {
    width,
    height,
  };

  return (
    <span
      className={[styles.skeleton, styles[radius], className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.productCard} aria-hidden="true">
      <Skeleton height="100%" className={styles.productMedia} radius="lg" />
      <div className={styles.productBody}>
        <Skeleton width="40%" height="0.75rem" />
        <Skeleton width="85%" height="1.1rem" />
        <Skeleton width="35%" height="1rem" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
  label,
}: {
  count?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={className}
      aria-busy="true"
      aria-label={label}
      role="status"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className={styles.categoryCard} aria-hidden="true">
      <Skeleton height="100%" className={styles.categoryMedia} radius="lg" />
      <Skeleton width="55%" height="1.1rem" />
    </div>
  );
}

export function PageLoader({ label }: { label: string }) {
  return (
    <div className={styles.pageLoader} role="status" aria-live="polite" aria-label={label}>
      <div className={styles.pageLoaderInner}>
        <span className={styles.spinner} aria-hidden="true" />
        <p>{label}</p>
        <div className={styles.pageLoaderBars}>
          <Skeleton height="0.75rem" width="70%" />
          <Skeleton height="0.75rem" width="50%" />
          <Skeleton height="10rem" radius="xl" />
        </div>
      </div>
    </div>
  );
}
