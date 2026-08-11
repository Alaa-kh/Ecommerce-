import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/store/hooks';
import { selectOrderById } from '@/features/orders/store/orders-slice';
import { Button } from '@/shared/components/ui/button';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { formatMoney } from '@/shared/utils/money';
import styles from './order-confirmation-page.module.css';

export function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const order = useAppSelector((state) => selectOrderById(state, orderId));

  if (!order) {
    return (
      <StatePanel
        tone="empty"
        title={t('checkout.confirmationMissingTitle')}
        description={t('checkout.confirmationMissingBody')}
        actionLabel={t('nav.orders')}
        onAction={() => navigate('/orders')}
      />
    );
  }

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('checkout.confirmationEyebrow')}</p>
        <h1>{t('checkout.confirmationTitle')}</h1>
        <p>{t('checkout.confirmationBody', { id: order.id })}</p>
      </header>

      <div className={styles.panel}>
        <dl className={styles.meta}>
          <div>
            <dt>{t('checkout.orderId')}</dt>
            <dd>{order.id}</dd>
          </div>
          <div>
            <dt>{t('checkout.paymentTitle')}</dt>
            <dd>{t(`checkout.paymentMethods.${order.paymentMethod}`)}</dd>
          </div>
          <div>
            <dt>{t('checkout.deliveryTitle')}</dt>
            <dd>{t(`checkout.deliveryMethods.${order.deliveryMethod}`)}</dd>
          </div>
          <div>
            <dt>{t('checkout.total')}</dt>
            <dd>{formatMoney(order.total, i18n.language)}</dd>
          </div>
        </dl>

        <div className={styles.address}>
          <h2>{t('checkout.shippingTitle')}</h2>
          <p>
            {order.address.fullName}
            <br />
            {order.address.line1}
            {order.address.line2 ? (
              <>
                <br />
                {order.address.line2}
              </>
            ) : null}
            <br />
            {order.address.city}, {order.address.region} {order.address.postalCode}
            <br />
            {order.address.country}
            <br />
            {order.address.phone}
          </p>
        </div>

        <div className={styles.actions}>
          <Button type="button" onClick={() => navigate('/orders')}>
            {t('nav.orders')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
            {t('actions.shopNow')}
          </Button>
          <Link to="/" className={styles.homeLink}>
            {t('auth.backHome')}
          </Link>
        </div>
      </div>
    </section>
  );
}
