import { useTranslation } from 'react-i18next';
import type { CatalogViewMode, ProductSort } from '@/shared/types/catalog';
import { Button } from '@/shared/components/ui/button';
import { IconGrid, IconList } from '@/shared/components/ui/icons';
import styles from './product-toolbar.module.css';

export interface ProductToolbarValues {
  title: string;
  categoryId: string;
  priceMin: string;
  priceMax: string;
  sort: ProductSort;
  pageSize: number;
  view: CatalogViewMode;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface ProductToolbarProps {
  values: ProductToolbarValues;
  categories: CategoryOption[];
  onChange: (patch: Partial<ProductToolbarValues>) => void;
  onSubmit: () => void;
  onReset: () => void;
}

const SORT_OPTIONS: ProductSort[] = [
  'relevance',
  'price_asc',
  'price_desc',
  'newest',
  'title_asc',
];

const PAGE_SIZES = [8, 12, 24];

export function ProductToolbar({
  values,
  categories,
  onChange,
  onSubmit,
  onReset,
}: ProductToolbarProps) {
  const { t } = useTranslation();

  return (
    <form
      className={`${styles.toolbar} animSidebar`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className={styles.heading}>
        <strong>{t('catalog.filtersTitle')}</strong>
        <span>{t('catalog.filtersSubtitle')}</span>
      </div>

      <label className={`${styles.field} fieldPulse`}>
        <span>{t('catalog.search')}</span>
        <input
          type="search"
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder={t('catalog.searchPlaceholder')}
        />
      </label>

      <label className={styles.field}>
        <span>{t('catalog.category')}</span>
        <select
          value={values.categoryId}
          onChange={(event) => onChange({ categoryId: event.target.value })}
        >
          <option value="">{t('catalog.allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>{t('catalog.priceMin')}</span>
        <input
          type="number"
          min={0}
          inputMode="decimal"
          value={values.priceMin}
          onChange={(event) => onChange({ priceMin: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span>{t('catalog.priceMax')}</span>
        <input
          type="number"
          min={0}
          inputMode="decimal"
          value={values.priceMax}
          onChange={(event) => onChange({ priceMax: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span>{t('catalog.sort')}</span>
        <select
          value={values.sort}
          onChange={(event) => onChange({ sort: event.target.value as ProductSort })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`catalog.sortOptions.${option}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>{t('catalog.pageSize')}</span>
        <select
          value={String(values.pageSize)}
          onChange={(event) => onChange({ pageSize: Number(event.target.value) })}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.viewToggle} role="group" aria-label={t('catalog.viewMode')}>
        <Button
          type="button"
          size="sm"
          variant={values.view === 'grid' ? 'primary' : 'ghost'}
          onClick={() => onChange({ view: 'grid' })}
          leadingIcon={<IconGrid />}
        >
          {t('catalog.grid')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={values.view === 'list' ? 'primary' : 'ghost'}
          onClick={() => onChange({ view: 'list' })}
          leadingIcon={<IconList />}
        >
          {t('catalog.list')}
        </Button>
      </div>

      <div className={styles.actions}>
        <Button type="submit">{t('catalog.apply')}</Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          {t('catalog.reset')}
        </Button>
      </div>
    </form>
  );
}
