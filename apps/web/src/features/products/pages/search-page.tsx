import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '@/features/products/components/product-card';
import { PaginationControls } from '@/features/products/components/pagination-controls';
import {
  useProductList,
  useProductSuggestions,
} from '@/features/products/hooks/use-products';
import { Button } from '@/shared/components/ui/button';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { ProductGridSkeleton, Skeleton } from '@/shared/components/ui/skeleton';
import type { ProductListQuery, ProductSort } from '@/shared/types/catalog';
import { toAppError } from '@/shared/types/errors';
import { isQueryAwaitingData } from '@/shared/utils/query-status';
import styles from './search-page.module.css';

const HISTORY_KEY = 'lumina.search.history';

function readHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, 8);
  } catch {
    return [];
  }
}

function writeHistory(term: string) {
  const next = [term, ...readHistory().filter((item) => item !== term)].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function clearHistoryStorage() {
  localStorage.removeItem(HISTORY_KEY);
}

export function SearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [input, setInput] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [syncedQuery, setSyncedQuery] = useState(initial);
  const [history, setHistory] = useState<string[]>(() => readHistory());
  const sort = (params.get('sort') as ProductSort) || 'relevance';
  const page = Number(params.get('page') ?? 1) || 1;

  if (initial !== syncedQuery) {
    setSyncedQuery(initial);
    setInput(initial);
    setDebounced(initial);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(input.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [input]);

  const suggestionsQuery = useProductSuggestions(debounced);

  const listQuery: ProductListQuery = useMemo(
    () => ({
      title: params.get('q') ?? undefined,
      sort,
      page,
      pageSize: 12,
    }),
    [params, sort, page],
  );

  const resultsQuery = useProductList(listQuery);
  const hasQuery = Boolean(params.get('q'));
  const resultsPending = isQueryAwaitingData(resultsQuery);
  const suggestionsPending =
    suggestionsQuery.isLoading ||
    (suggestionsQuery.isFetching && !suggestionsQuery.data);

  function runSearch(term: string, nextPage = 1, nextSort: ProductSort = sort) {
    const trimmed = term.trim();
    const next = new URLSearchParams();
    if (trimmed) {
      next.set('q', trimmed);
      writeHistory(trimmed);
      setHistory(readHistory());
    }
    if (nextSort !== 'relevance') next.set('sort', nextSort);
    if (nextPage > 1) next.set('page', String(nextPage));
    setParams(next);
  }

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <h1>{t('search.title')}</h1>
        <p>{t('search.subtitle')}</p>
      </header>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(input, 1);
        }}
      >
        <label className={styles.field}>
          <span className={styles.srOnly}>{t('catalog.search')}</span>
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('catalog.searchPlaceholder')}
            autoComplete="off"
          />
        </label>
        <Button type="submit" isLoading={hasQuery && resultsPending}>
          {t('search.submit')}
        </Button>
      </form>

      {debounced.length >= 2 && !hasQuery ? (
        <div className={styles.suggestions}>
          <h2>{t('search.suggestions')}</h2>
          {suggestionsPending ? (
            <div className={styles.suggestionLoading} aria-busy="true">
              <Skeleton height="1rem" width="70%" />
              <Skeleton height="1rem" width="55%" />
              <Skeleton height="1rem" width="62%" />
            </div>
          ) : null}
          {!suggestionsPending && suggestionsQuery.isError ? (
            <StatePanel
              title={t('states.error')}
              description={toAppError(suggestionsQuery.error).message}
              actionLabel={t('actions.retry')}
              onAction={() => void suggestionsQuery.refetch()}
            />
          ) : null}
          {!suggestionsPending &&
          suggestionsQuery.isSuccess &&
          suggestionsQuery.data.length === 0 ? (
            <p>{t('search.noSuggestions')}</p>
          ) : null}
          {!suggestionsPending && suggestionsQuery.isSuccess ? (
            <ul>
              {suggestionsQuery.data.map((product) => (
                <li key={product.id}>
                  <Link to={`/products/${product.id}`}>{product.title}</Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className={styles.history}>
          <div className={styles.historyHeader}>
            <h2>{t('search.history')}</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                clearHistoryStorage();
                setHistory([]);
              }}
            >
              {t('search.clearHistory')}
            </Button>
          </div>
          <div className={styles.historyList}>
            {history.map((term) => (
              <button key={term} type="button" onClick={() => runSearch(term, 1)}>
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {hasQuery ? (
        <>
          <label className={styles.sort}>
            <span>{t('catalog.sort')}</span>
            <select
              value={sort}
              disabled={resultsPending}
              onChange={(event) =>
                runSearch(params.get('q') ?? '', 1, event.target.value as ProductSort)
              }
            >
              <option value="relevance">{t('catalog.sortOptions.relevance')}</option>
              <option value="price_asc">{t('catalog.sortOptions.price_asc')}</option>
              <option value="price_desc">{t('catalog.sortOptions.price_desc')}</option>
              <option value="newest">{t('catalog.sortOptions.newest')}</option>
              <option value="title_asc">{t('catalog.sortOptions.title_asc')}</option>
            </select>
          </label>

          {resultsPending ? (
            <ProductGridSkeleton
              className={`${styles.grid} animStagger`}
              label={t('states.loading')}
            />
          ) : null}

          {!resultsPending && resultsQuery.isError ? (
            <StatePanel
              title={t('states.error')}
              description={toAppError(resultsQuery.error).message}
              actionLabel={t('actions.retry')}
              onAction={() => void resultsQuery.refetch()}
            />
          ) : null}

          {!resultsPending &&
          resultsQuery.isSuccess &&
          resultsQuery.data.items.length === 0 ? (
            <StatePanel title={t('states.empty')} description={t('search.empty')} />
          ) : null}

          {!resultsPending &&
          resultsQuery.isSuccess &&
          resultsQuery.data.items.length > 0 ? (
            <>
              <div
                key={`search-page-${resultsQuery.data.page}`}
                className={`${styles.grid} animStagger`}
              >
                {resultsQuery.data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <PaginationControls
                page={resultsQuery.data.page}
                pageSize={resultsQuery.data.pageSize}
                hasNext={resultsQuery.data.hasNext}
                hasPrev={resultsQuery.data.hasPrev}
                total={resultsQuery.data.total}
                onPageChange={(nextPage) => runSearch(params.get('q') ?? '', nextPage)}
              />
            </>
          ) : null}
        </>
      ) : (
        <StatePanel title={t('search.promptTitle')} description={t('search.promptBody')} />
      )}
    </section>
  );
}
