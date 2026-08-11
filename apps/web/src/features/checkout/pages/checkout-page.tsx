import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  isPaypalConfigured,
  isStripeConfigured,
} from '@/app/config/env';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { clearCart, selectCartCount } from '@/features/cart/store/cart-slice';
import { DeliveryLocation } from '@/features/checkout/components/delivery-location';
import {
  defaultShippingAddress,
  isShippingAddressReady,
  normalizeCoord,
  normalizeShippingAddress,
  shippingAddressSchema,
  type ShippingAddressInput,
} from '@/features/checkout/domain/address-schema';
import {
  calcOrderTotals,
  canPlaceOrder,
  FREE_STANDARD_SHIPPING_MIN,
  type DeliveryMethodId,
  type PaymentMethodId,
} from '@/features/checkout/domain/checkout-math';
import {
  createOrderId,
  placeOrder,
} from '@/features/orders/store/orders-slice';
import { Button } from '@/shared/components/ui/button';
import { TextField } from '@/shared/components/ui/field';
import { ProductImage } from '@/shared/components/ui/product-image';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { IconCart } from '@/shared/components/ui/icons';
import { formatMoney } from '@/shared/utils/money';
import styles from './checkout-page.module.css';

const shippingResolver = zodResolver(
  shippingAddressSchema,
) as Resolver<ShippingAddressInput>;

export function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const items = useAppSelector((state) => state.cart.items);
  const count = useAppSelector(selectCartCount);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodId>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stripeReady = isStripeConfigured();
  const paypalReady = isPaypalConfigured();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<ShippingAddressInput>({
    resolver: async (values, context, options) =>
      shippingResolver(normalizeShippingAddress(values), context, options),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: defaultShippingAddress,
  });

  const latitude = useWatch({ control, name: 'latitude' });
  const longitude = useWatch({ control, name: 'longitude' });
  const formValues = useWatch({ control });

  const totals = useMemo(
    () => calcOrderTotals(items, deliveryMethod),
    [items, deliveryMethod],
  );

  const addressReady = useMemo(
    () => isShippingAddressReady(formValues ?? defaultShippingAddress),
    [formValues],
  );

  const paymentReady = canPlaceOrder({
    itemCount: count,
    paymentMethod,
    stripeConfigured: stripeReady,
    paypalConfigured: paypalReady,
  });

  /** Keep clickable when payment is ready so Zod can surface field errors. */
  const canSubmit = paymentReady && !isSubmitting && !formSubmitting;

  if (!isAuthenticated) {
    return (
      <StatePanel
        tone="empty"
        title={t('auth.requiredTitle')}
        description={t('checkout.requiredAuth')}
        icon={<IconCart />}
        actionLabel={t('auth.loginCta')}
        onAction={() => {
          requireAuth('/checkout');
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <StatePanel
        tone="empty"
        title={t('checkout.emptyTitle')}
        description={t('checkout.emptyBody')}
        icon={<IconCart />}
        actionLabel={t('actions.shopNow')}
        onAction={() => navigate('/products')}
      />
    );
  }

  function onSubmit(address: ShippingAddressInput) {
    if (!paymentReady) return;
    setIsSubmitting(true);
    const orderId = createOrderId();
    dispatch(
      placeOrder({
        id: orderId,
        items,
        address: {
          ...address,
          line2: address.line2 || '',
          notes: address.notes || '',
          latitude: address.latitude ?? null,
          longitude: address.longitude ?? null,
        },
        deliveryMethod,
        paymentMethod,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
      }),
    );
    dispatch(clearCart());
    navigate(`/checkout/confirmation/${orderId}`, { replace: true });
  }

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <div>
          <h1>{t('checkout.title')}</h1>
          <p>{t('checkout.subtitle')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate('/cart')}>
          {t('checkout.backToCart')}
        </Button>
      </header>

      <form className={styles.layout} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className={styles.main}>
          <section className={styles.panel}>
            <h2>{t('checkout.shippingTitle')}</h2>
            <div className={styles.grid2}>
              <TextField
                label={t('checkout.fullName')}
                error={errors.fullName ? t('checkout.errors.required') : undefined}
                {...register('fullName')}
              />
              <TextField
                label={t('checkout.phone')}
                error={errors.phone ? t('checkout.errors.phone') : undefined}
                {...register('phone')}
              />
            </div>
            <TextField
              label={t('checkout.line1')}
              error={errors.line1 ? t('checkout.errors.required') : undefined}
              {...register('line1')}
            />
            <TextField label={t('checkout.line2')} {...register('line2')} />
            <div className={styles.grid2}>
              <TextField
                label={t('checkout.city')}
                error={errors.city ? t('checkout.errors.required') : undefined}
                {...register('city')}
              />
              <TextField
                label={t('checkout.region')}
                error={errors.region ? t('checkout.errors.required') : undefined}
                {...register('region')}
              />
            </div>
            <div className={styles.grid2}>
              <TextField
                label={t('checkout.postalCode')}
                {...register('postalCode')}
              />
              <TextField
                label={t('checkout.country')}
                error={errors.country ? t('checkout.errors.required') : undefined}
                {...register('country')}
              />
            </div>
            <TextField label={t('checkout.notes')} {...register('notes')} />
          </section>

          <DeliveryLocation
            latitude={latitude}
            longitude={longitude}
            onChange={(coords) => {
              setValue('latitude', normalizeCoord(coords.latitude), {
                shouldValidate: true,
                shouldDirty: true,
              });
              setValue('longitude', normalizeCoord(coords.longitude), {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />

          <section className={styles.panel}>
            <h2>{t('checkout.deliveryTitle')}</h2>
            <div className={styles.choices}>
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryMethod === 'standard'}
                  onChange={() => setDeliveryMethod('standard')}
                />
                <span>
                  <strong>{t('checkout.deliveryStandard')}</strong>
                  <em>
                    {totals.subtotal >= FREE_STANDARD_SHIPPING_MIN
                      ? t('checkout.deliveryFree')
                      : formatMoney(8, i18n.language)}
                  </em>
                  <small>{t('checkout.deliveryStandardHint')}</small>
                </span>
              </label>
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryMethod === 'express'}
                  onChange={() => setDeliveryMethod('express')}
                />
                <span>
                  <strong>{t('checkout.deliveryExpress')}</strong>
                  <em>{formatMoney(18, i18n.language)}</em>
                  <small>{t('checkout.deliveryExpressHint')}</small>
                </span>
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <h2>{t('checkout.paymentTitle')}</h2>
            <div className={styles.choices}>
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span>
                  <strong>{t('checkout.paymentCod')}</strong>
                  <small>{t('checkout.paymentCodHint')}</small>
                </span>
              </label>
              <label className={`${styles.choice} ${stripeReady ? '' : styles.choiceDisabled}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'stripe'}
                  disabled={!stripeReady}
                  onChange={() => setPaymentMethod('stripe')}
                />
                <span>
                  <strong>{t('checkout.paymentStripe')}</strong>
                  <small>
                    {stripeReady
                      ? t('checkout.paymentStripeReady')
                      : t('checkout.paymentStripeMissing')}
                  </small>
                </span>
              </label>
              <label className={`${styles.choice} ${paypalReady ? '' : styles.choiceDisabled}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'paypal'}
                  disabled={!paypalReady}
                  onChange={() => setPaymentMethod('paypal')}
                />
                <span>
                  <strong>{t('checkout.paymentPaypal')}</strong>
                  <small>
                    {paypalReady
                      ? t('checkout.paymentPaypalReady')
                      : t('checkout.paymentPaypalMissing')}
                  </small>
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className={`${styles.summary} animPanel`}>
          <h2>{t('checkout.summaryTitle')}</h2>
          <ul className={styles.lines}>
            {items.map((item) => (
              <li key={item.productId}>
                <ProductImage
                  className={styles.thumb}
                  src={item.imageUrl}
                  alt={item.title}
                />
                <div className={styles.lineBody}>
                  <Link to={`/products/${item.productId}`}>{item.title}</Link>
                  <p>
                    ×{item.quantity} · {formatMoney(item.price * item.quantity, i18n.language)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <dl className={styles.totals}>
            <div>
              <dt>{t('cart.subtotal')}</dt>
              <dd>{formatMoney(totals.subtotal, i18n.language)}</dd>
            </div>
            <div>
              <dt>{t('checkout.shipping')}</dt>
              <dd>
                {totals.shipping === 0
                  ? t('checkout.deliveryFree')
                  : formatMoney(totals.shipping, i18n.language)}
              </dd>
            </div>
            <div className={styles.grand}>
              <dt>{t('checkout.total')}</dt>
              <dd>{formatMoney(totals.total, i18n.language)}</dd>
            </div>
          </dl>

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting || formSubmitting}
            disabled={!canSubmit}
          >
            {t('checkout.placeOrder')}
          </Button>
          {!paymentReady ? (
            <p className={styles.hint}>{t('checkout.cannotComplete')}</p>
          ) : !addressReady ? (
            <p className={styles.hint}>{t('checkout.fillAddress')}</p>
          ) : (
            <p className={styles.hint}>{t('checkout.placeOrderHint')}</p>
          )}
        </aside>
      </form>
    </section>
  );
}
