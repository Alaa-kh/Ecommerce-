import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import {
  removeCartItem,
  selectCartCount,
  updateCartQuantity,
} from '@/features/cart/store/cart-slice';
import { Button } from '@/shared/components/ui/button';
import { ProductImage } from '@/shared/components/ui/product-image';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { IconCart } from '@/shared/components/ui/icons';
import { formatMoney } from '@/shared/utils/money';
import styles from './cart-page.module.css';

export function CartPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const items = useAppSelector((state) => state.cart.items);
  const count = useAppSelector(selectCartCount);

  if (!isAuthenticated) {
    return (
      <StatePanel
        tone="empty"
        title={t('auth.requiredTitle')}
        description={t('auth.requiredCart')}
        icon={<IconCart />}
        actionLabel={t('auth.loginCta')}
        onAction={() => {
          requireAuth('/cart');
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <StatePanel
        tone="empty"
        title={t('cart.emptyTitle')}
        description={t('cart.emptyBody')}
        icon={<IconCart />}
        actionLabel={t('actions.shopNow')}
        onAction={() => navigate('/products')}
      />
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <div>
          <h1>{t('cart.title')}</h1>
          <p>{t('cart.subtitle', { count })}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
          {t('actions.shopNow')}
        </Button>
      </header>

      <div className={styles.layout}>
        <ul className={`${styles.list} animStagger`}>
          {items.map((item) => {
            const lineTotal = item.price * item.quantity;
            return (
              <li key={item.productId} className={styles.item}>
                <Link to={`/products/${item.productId}`} className={styles.media}>
                  <ProductImage src={item.imageUrl} alt={item.title} />
                </Link>

                <div className={styles.body}>
                  <div className={styles.top}>
                    <h2>
                      <Link to={`/products/${item.productId}`}>{item.title}</Link>
                    </h2>
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => dispatch(removeCartItem(item.productId))}
                    >
                      {t('cart.remove')}
                    </button>
                  </div>

                  <p className={styles.unit}>
                    {t('cart.unitPrice')}: {formatMoney(item.price, i18n.language)}
                  </p>

                  <div className={styles.controls}>
                    <div className={styles.qtyGroup} role="group" aria-label={t('products.quantity')}>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        aria-label={t('cart.decreaseQty')}
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          dispatch(
                            updateCartQuantity({
                              productId: item.productId,
                              quantity: item.quantity - 1,
                            }),
                          )
                        }
                      >
                        −
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        aria-label={t('cart.increaseQty')}
                        disabled={item.quantity >= 20}
                        onClick={() =>
                          dispatch(
                            updateCartQuantity({
                              productId: item.productId,
                              quantity: item.quantity + 1,
                            }),
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                    <p className={styles.lineTotal}>
                      <span>{t('cart.lineTotal')}</span>
                      <strong>{formatMoney(lineTotal, i18n.language)}</strong>
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className={`${styles.summary} animPanel`}>
          <h2>{t('cart.orderSummary')}</h2>
          <dl className={styles.summaryRows}>
            <div>
              <dt>{t('cart.items')}</dt>
              <dd>{count}</dd>
            </div>
            <div>
              <dt>{t('cart.subtotal')}</dt>
              <dd>{formatMoney(subtotal, i18n.language)}</dd>
            </div>
          </dl>
          <Button type="button" size="lg" onClick={() => navigate('/checkout')}>
            {t('cart.checkout')}
          </Button>
          <p className={styles.hint}>{t('cart.checkoutHint')}</p>
        </aside>
      </div>
    </section>
  );
}
