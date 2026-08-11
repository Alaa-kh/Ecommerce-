import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { clearCredentials } from '@/app/store/app-slice';
import { selectCartCount } from '@/features/cart/store/cart-slice';
import { selectWishlistCount } from '@/features/wishlist/store/wishlist-slice';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { Button } from '@/shared/components/ui/button';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { IconCart, IconHeart, IconUser } from '@/shared/components/ui/icons';
import styles from './account-page.module.css';

export function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const user = useAppSelector((state) => state.app.auth.user);
  const wishlistCount = useAppSelector(selectWishlistCount);
  const cartCount = useAppSelector(selectCartCount);

  if (!isAuthenticated || !user) {
    return (
      <StatePanel
        tone="empty"
        title={t('auth.requiredTitle')}
        description={t('account.requiredBody')}
        icon={<IconUser />}
        actionLabel={t('auth.loginCta')}
        onAction={() => {
          requireAuth('/account');
        }}
      />
    );
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials = (
    (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? user.email?.[0] ?? '?')
  ).toUpperCase();

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <div className={styles.identity}>
          {user.avatarUrl ? (
            <img
              className={styles.avatar}
              src={user.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              {initials}
            </span>
          )}
          <div>
            <h1>{t('account.title')}</h1>
            <p>{t('account.subtitle', { name: displayName })}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            dispatch(clearCredentials());
            navigate('/');
          }}
        >
          {t('auth.logout')}
        </Button>
      </header>

      <div className={styles.layout}>
        <article className={`${styles.card} animPanel`}>
          <h2>{t('account.profileHeading')}</h2>
          <dl className={styles.details}>
            <div>
              <dt>{t('account.name')}</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt>{t('auth.email')}</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>{t('account.role')}</dt>
              <dd>{user.roles[0] ?? t('account.roleCustomer')}</dd>
            </div>
          </dl>
        </article>

        <div className={`${styles.links} animStagger`}>
          <Link to="/wishlist" className={styles.linkCard}>
            <span className={styles.linkIcon}>
              <IconHeart />
            </span>
            <span>
              <strong>{t('nav.wishlist')}</strong>
              <small>{t('account.wishlistMeta', { count: wishlistCount })}</small>
            </span>
          </Link>
          <Link to="/cart" className={styles.linkCard}>
            <span className={styles.linkIcon}>
              <IconCart />
            </span>
            <span>
              <strong>{t('nav.cart')}</strong>
              <small>{t('account.cartMeta', { count: cartCount })}</small>
            </span>
          </Link>
          <Link to="/orders" className={styles.linkCard}>
            <span className={styles.linkIcon}>
              <IconUser />
            </span>
            <span>
              <strong>{t('nav.orders')}</strong>
              <small>{t('account.ordersMeta')}</small>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
