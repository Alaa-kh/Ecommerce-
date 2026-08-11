import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import styles from './pagination-controls.module.css';

interface PaginationControlsProps {
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number | null;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  hasNext,
  hasPrev,
  total,
  pageSize,
  onPageChange,
}: PaginationControlsProps) {
  const { t } = useTranslation();
  const totalPages = total !== null ? Math.max(1, Math.ceil(total / pageSize)) : null;

  return (
    <nav key={page} className={`${styles.nav} animPanel`} aria-label={t('catalog.pagination')}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!hasPrev}
        onClick={() => onPageChange(page - 1)}
      >
        {t('catalog.previous')}
      </Button>

      <p className={styles.status}>
        {totalPages
          ? t('catalog.pageOf', { page, total: totalPages })
          : t('catalog.page', { page })}
      </p>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
      >
        {t('catalog.next')}
      </Button>
    </nav>
  );
}
