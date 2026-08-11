import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/shared/types/catalog';
import { formatMoney } from '@/shared/utils/money';
import { Badge } from '@/shared/components/ui/badge';
import { IconButton } from '@/shared/components/ui/icon-button';
import { ProductImage } from '@/shared/components/ui/product-image';
import { IconHeart } from '@/shared/components/ui/icons';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import {
  selectIsWishlisted,
  toggleWishlistItem,
} from '@/features/wishlist/store/wishlist-slice';
import styles from './product-card.module.css';

interface ProductCardProps {
  product: Product;
  view?: 'grid' | 'list';
}

export function ProductCard({ product, view = 'grid' }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { requireAuth } = useRequireAuth();
  const wishlisted = useAppSelector((state) => selectIsWishlisted(state, product.id));
  const primary = product.images[0];
  const secondary = product.images[1] ?? primary;

  function onToggleWishlist() {
    if (!requireAuth(`/products/${product.id}`)) return;
    dispatch(
      toggleWishlistItem({
        productId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: primary ?? null,
        slug: product.slug,
        addedAt: new Date().toISOString(),
      }),
    );
  }

  return (
    <article className={view === 'list' ? `${styles.card} ${styles.list}` : styles.card}>
      <div className={styles.mediaWrap}>
        <Link to={`/products/${product.id}`} className={styles.media} aria-label={product.title}>
          <ProductImage className={styles.imagePrimary} src={primary} alt={product.title} />
          {secondary && secondary !== primary ? (
            <ProductImage className={styles.imageSecondary} src={secondary} alt="" />
          ) : null}
        </Link>

        <div className={styles.quickActions}>
          <IconButton
            label={wishlisted ? t('wishlist.remove') : t('wishlist.add')}
            variant="secondary"
            size="sm"
            active={wishlisted}
            aria-pressed={wishlisted}
            onClick={onToggleWishlist}
          >
            <IconHeart />
          </IconButton>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <Badge tone="info">{product.category.name}</Badge>
        </div>
        <h3 className={styles.title}>
          <Link to={`/products/${product.id}`}>{product.title}</Link>
        </h3>
        {view === 'list' ? <p className={styles.description}>{product.description}</p> : null}
        <div className={styles.footer}>
          <p className={styles.price}>{formatMoney(product.price, i18n.language)}</p>
          <Link to={`/products/${product.id}`} className={styles.link}>
            {t('products.viewDetails')}
          </Link>
        </div>
      </div>
    </article>
  );
}
