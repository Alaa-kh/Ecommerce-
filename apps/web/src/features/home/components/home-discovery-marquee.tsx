import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/shared/types/catalog';
import { ProductImage } from '@/shared/components/ui/product-image';
import { formatMoney } from '@/shared/utils/money';
import styles from './home-discovery-marquee.module.css';

interface HomeDiscoveryMarqueeProps {
  products: Product[];
}

export function HomeDiscoveryMarquee({ products }: HomeDiscoveryMarqueeProps) {
  const { t, i18n } = useTranslation();
  const items = products.slice(0, 12);
  if (items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <section className={styles.section} aria-label={t('home.marqueeTitle')}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('home.marqueeEyebrow')}</p>
        <h2>{t('home.marqueeTitle')}</h2>
      </div>
      <div className={styles.viewport}>
        <ul className={styles.track}>
          {loop.map((product, index) => (
            <li key={`${product.id}-${index}`}>
              <Link to={`/products/${product.id}`} className={styles.item}>
                <span className={styles.thumb}>
                  <ProductImage src={product.images[0]} alt="" />
                </span>
                <span className={styles.meta}>
                  <strong>{product.title}</strong>
                  <em>{formatMoney(product.price, i18n.language)}</em>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
