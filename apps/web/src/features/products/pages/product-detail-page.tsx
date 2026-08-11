import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '@/features/products/components/product-card';
import { PaginationControls } from '@/features/products/components/pagination-controls';
import {
  useProductDetail,
  useRelatedProducts,
} from '@/features/products/hooks/use-products';
import { paginateItems } from '@/features/products/utils/catalog-query';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { IconButton } from '@/shared/components/ui/icon-button';
import { ProductImage } from '@/shared/components/ui/product-image';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { IconHeart, IconPackage, IconShield } from '@/shared/components/ui/icons';
import { formatMoney } from '@/shared/utils/money';
import { trackRecentlyViewed } from '@/shared/utils/recently-viewed';
import { toAppError } from '@/shared/types/errors';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import {
  selectIsWishlisted,
  toggleWishlistItem,
} from '@/features/wishlist/store/wishlist-slice';
import { addCartItem } from '@/features/cart/store/cart-slice';
import styles from './product-detail-page.module.css';

const RELATED_PAGE_SIZE = 8;

export function ProductDetailPage() {
  const { productId } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { requireAuth } = useRequireAuth();
  const detailQuery = useProductDetail(productId);
  const relatedQuery = useRelatedProducts(detailQuery.data?.id);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedPage, setRelatedPage] = useState(1);
  const [syncedProductId, setSyncedProductId] = useState<number | null>(null);
  const wishlisted = useAppSelector((state) =>
    selectIsWishlisted(state, detailQuery.data?.id ?? -1),
  );

  const productIdValue = detailQuery.data?.id ?? null;
  if (productIdValue !== syncedProductId) {
    setSyncedProductId(productIdValue);
    setActiveImage(0);
    setRelatedPage(1);
  }

  const relatedPaged = useMemo(
    () => paginateItems(relatedQuery.data ?? [], relatedPage, RELATED_PAGE_SIZE),
    [relatedQuery.data, relatedPage],
  );

  const trackedProduct = detailQuery.data;
  useEffect(() => {
    if (!trackedProduct) return;
    trackRecentlyViewed({
      productId: trackedProduct.id,
      title: trackedProduct.title,
      price: trackedProduct.price,
      imageUrl: trackedProduct.images[0] ?? null,
      slug: trackedProduct.slug,
    });
  }, [trackedProduct]);

  if (detailQuery.isLoading || (detailQuery.isFetching && !detailQuery.data)) {
    return (
      <section className={styles.page}>
        <div className={styles.layout}>
          <Skeleton height="28rem" radius="xl" />
          <div className={styles.summary}>
            <Skeleton width="30%" height="1rem" />
            <Skeleton width="80%" height="2.5rem" />
            <Skeleton width="40%" height="1.5rem" />
            <Skeleton width="100%" height="6rem" />
          </div>
        </div>
      </section>
    );
  }

  if (detailQuery.isError) {
    return (
      <StatePanel
        tone="error"
        title={t('states.error')}
        description={toAppError(detailQuery.error).message}
        actionLabel={t('actions.retry')}
        onAction={() => void detailQuery.refetch()}
      />
    );
  }

  if (!detailQuery.data) {
    return (
      <StatePanel
        tone="empty"
        title={t('states.empty')}
        description={t('products.notFound')}
        icon={<IconPackage />}
      />
    );
  }

  const product = detailQuery.data;
  const images = product.images.length > 0 ? product.images : [];
  const currentImage = images[Math.min(activeImage, Math.max(images.length - 1, 0))];

  function onToggleWishlist() {
    if (!requireAuth(`/products/${product.id}`)) return;
    dispatch(
      toggleWishlistItem({
        productId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.images[0] ?? null,
        slug: product.slug,
        addedAt: new Date().toISOString(),
      }),
    );
  }

  function onAddToCart() {
    if (!requireAuth(`/products/${product.id}`)) return;
    dispatch(
      addCartItem({
        productId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.images[0] ?? null,
        quantity,
      }),
    );
  }

  function onBuyNow() {
    if (!requireAuth(`/products/${product.id}`)) return;
    dispatch(
      addCartItem({
        productId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.images[0] ?? null,
        quantity,
      }),
    );
    navigate('/checkout');
  }

  return (
    <section className={`${styles.page} animPage`}>
      <div className={styles.layout}>
        <div className={styles.gallery}>
          <div className={styles.heroImage}>
            <ProductImage src={currentImage} alt={product.title} loading="eager" />
          </div>
          {images.length > 1 ? (
            <div className={styles.thumbs} role="list">
              {images.map((image, index) => (
                <button
                  key={image + index}
                  type="button"
                  className={
                    index === activeImage ? `${styles.thumb} ${styles.activeThumb}` : styles.thumb
                  }
                  onClick={() => setActiveImage(index)}
                  aria-label={t('products.imageN', { n: index + 1 })}
                >
                  <ProductImage src={image} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.purchase}>
          <div className={styles.summary}>
            <Badge tone="info">{product.category.name}</Badge>
            <h1>{product.title}</h1>
            <p className={styles.price}>{formatMoney(product.price, i18n.language)}</p>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.quantityRow}>
              <label htmlFor="qty">{t('products.quantity')}</label>
              <input
                id="qty"
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
                }
              />
            </div>

            <div className={styles.actions}>
              <Button type="button" size="lg" onClick={onBuyNow}>
                {t('products.buyNow')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={onAddToCart}
              >
                {t('products.addToCart')}
              </Button>
              <IconButton
                label={wishlisted ? t('wishlist.remove') : t('wishlist.add')}
                variant="secondary"
                active={wishlisted}
                aria-pressed={wishlisted}
                onClick={onToggleWishlist}
              >
                <IconHeart />
              </IconButton>
            </div>

            <Link to={`/categories/${product.category.slug}`} className={styles.categoryLink}>
              {t('products.browseCategory', { name: product.category.name })}
            </Link>

            <ul className={styles.trust}>
              <li>
                <IconShield />
                <span>{t('products.trustSecure')}</span>
              </li>
              <li>
                <IconPackage />
                <span>{t('products.trustShipping')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section className={styles.related} aria-labelledby="related-heading">
        <h2 id="related-heading">{t('products.related')}</h2>
        {relatedQuery.isLoading || (relatedQuery.isFetching && !relatedQuery.data) ? (
          <div className={`${styles.relatedGrid} animStagger`} aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} height="16rem" radius="xl" />
            ))}
          </div>
        ) : null}
        {!relatedQuery.isLoading &&
        !(relatedQuery.isFetching && !relatedQuery.data) &&
        relatedQuery.isError ? (
          <StatePanel
            tone="error"
            title={t('states.error')}
            description={toAppError(relatedQuery.error).message}
          />
        ) : null}
        {!relatedQuery.isLoading &&
        !(relatedQuery.isFetching && !relatedQuery.data) &&
        relatedQuery.isSuccess &&
        relatedPaged.total === 0 ? (
          <StatePanel
            tone="empty"
            title={t('states.empty')}
            description={t('products.relatedEmpty')}
          />
        ) : null}
        {!relatedQuery.isLoading &&
        !(relatedQuery.isFetching && !relatedQuery.data) &&
        relatedQuery.isSuccess &&
        relatedPaged.items.length > 0 ? (
          <>
            <div
              key={`related-page-${relatedPaged.page}`}
              className={`${styles.relatedGrid} animStagger`}
            >
              {relatedPaged.items.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
            <PaginationControls
              page={relatedPaged.page}
              pageSize={RELATED_PAGE_SIZE}
              hasNext={relatedPaged.hasNext}
              hasPrev={relatedPaged.hasPrev}
              total={relatedPaged.total}
              onPageChange={setRelatedPage}
            />
          </>
        ) : null}
      </section>
    </section>
  );
}
