import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/store/hooks';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { selectOrders } from '@/features/orders/store/orders-slice';
import { Button } from '@/shared/components/ui/button';
import { ProductImage } from '@/shared/components/ui/product-image';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { IconPackage } from '@/shared/components/ui/icons';
import { formatMoney } from '@/shared/utils/money';
import styles from './orders-page.module.css';

export function OrdersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const orders = useAppSelector(selectOrders);

  if (!isAuthenticated) {
    return (
      <StatePanel
        tone="empty"
        title={t('auth.requiredTitle')}
        description={t('orders.requiredAuth')}
        icon={<IconPackage />}
        actionLabel={t('auth.loginCta')}
        onAction={() => {
          requireAuth('/orders');
        }}
      />
    );
  }

  if (orders.length === 0) {
    return (
      <StatePanel
        tone="empty"
        title={t('orders.emptyTitle')}
        description={t('orders.emptyBody')}
        icon={<IconPackage />}
        actionLabel={t('actions.shopNow')}
        onAction={() => navigate('/products')}
      />
    );
  }

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <div>
          <h1>{t('orders.title')}</h1>
          <p>{t('orders.subtitle', { count: orders.length })}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
          {t('actions.shopNow')}
        </Button>
      </header>

      <ul className={`${styles.list} animStagger`}>
        {orders.map((order) => (
          <li key={order.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div>
                <p className={styles.id}>{order.id}</p>
                <p className={styles.date}>
                  {new Date(order.createdAt).toLocaleString(i18n.language)}
                </p>
              </div>
              <span className={styles.status}>{t(`orders.status.${order.status}`)}</span>
            </div>

            <div className={styles.thumbs}>
              {order.items.slice(0, 4).map((item) => (
                <ProductImage key={item.productId} src={item.imageUrl} alt={item.title} />
              ))}
            </div>

            <div className={styles.cardBottom}>
              <p>
                {t('orders.itemsCount', { count: order.items.length })} ·{' '}
                {formatMoney(order.total, i18n.language)}
              </p>
              <Link to={`/checkout/confirmation/${order.id}`}>{t('orders.view')}</Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
