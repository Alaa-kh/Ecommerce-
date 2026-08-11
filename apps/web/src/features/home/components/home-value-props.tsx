import { useTranslation } from 'react-i18next';
import { IconHeart, IconPackage, IconShield } from '@/shared/components/ui/icons';
import styles from './home-value-props.module.css';

export function HomeValueProps() {
  const { t } = useTranslation();

  const items = [
    {
      id: 'clarity',
      icon: <IconShield />,
      title: t('home.valueClarityTitle'),
      body: t('home.valueClarityBody'),
    },
    {
      id: 'catalog',
      icon: <IconPackage />,
      title: t('home.valueCatalogTitle'),
      body: t('home.valueCatalogBody'),
    },
    {
      id: 'lists',
      icon: <IconHeart />,
      title: t('home.valueListsTitle'),
      body: t('home.valueListsBody'),
    },
  ] as const;

  return (
    <section className={styles.section} aria-labelledby="value-props-heading">
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('home.valueEyebrow')}</p>
        <h2 id="value-props-heading">{t('home.valueTitle')}</h2>
        <p className={styles.lede}>{t('home.valueBody')}</p>
      </div>

      <ul className={`${styles.list} animStagger`}>
        {items.map((item, index) => (
          <li key={item.id} className={styles.row}>
            <span className={styles.index} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={styles.icon} aria-hidden="true">
              {item.icon}
            </span>
            <div className={styles.copy}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
