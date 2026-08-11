import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { removeWishlistItem } from '@/features/wishlist/store/wishlist-slice';
import { Button } from '@/shared/components/ui/button';
import { ProductImage } from '@/shared/components/ui/product-image';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { IconHeart } from '@/shared/components/ui/icons';
import { formatMoney } from '@/shared/utils/money';
import styles from './wishlist-page.module.css';

export function WishlistPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const items = useAppSelector((state) => state.wishlist.items);

  if (!isAuthenticated) {
    return (
      <StatePanel
        tone="empty"
        title={t('auth.requiredTitle')}
        description={t('auth.requiredWishlist')}
        icon={<IconHeart />}
        actionLabel={t('auth.loginCta')}
        onAction={() => {
          requireAuth('/wishlist');
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <StatePanel
        tone="empty"
        title={t('wishlist.emptyTitle')}
        description={t('wishlist.emptyBody')}
        icon={<IconHeart />}
        actionLabel={t('actions.shopNow')}
        onAction={() => navigate('/products')}
      />
    );
  }

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <div>
          <h1>{t('wishlist.title')}</h1>
          <p>{t('wishlist.subtitle', { count: items.length })}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
          {t('actions.shopNow')}
        </Button>
      </header>

      <ul className={`${styles.grid} animStagger`}>
        {items.map((item) => (
          <li key={item.productId} className={styles.card}>
            <Link to={`/products/${item.productId}`} className={styles.media}>
              <ProductImage src={item.imageUrl} alt={item.title} />
            </Link>
            <div className={styles.body}>
              <h2>
                <Link to={`/products/${item.productId}`}>{item.title}</Link>
              </h2>
              <p className={styles.price}>{formatMoney(item.price, i18n.language)}</p>
              <div className={styles.actions}>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => navigate(`/products/${item.productId}`)}
                >
                  {t('wishlist.viewProduct')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(removeWishlistItem(item.productId))}
                >
                  {t('wishlist.remove')}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
