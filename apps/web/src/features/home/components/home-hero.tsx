import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { appConfig } from '@/app/config/env';
import { IconArrowRight, IconSearch } from '@/shared/components/ui/icons';
import styles from './home-hero.module.css';

interface HomeHeroProps {
  categoryCount?: number | null;
  catalogUp?: boolean | null;
}

export function HomeHero({ categoryCount = null, catalogUp = null }: HomeHeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [query, setQuery] = useState('');

  const suggestions = useMemo(
    () => [
      t('home.suggestShoes'),
      t('home.suggestFurniture'),
      t('home.suggestElectronics'),
      t('home.suggestClothes'),
    ],
    [t],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPlayback = () => {
      if (motionQuery.matches) {
        video.pause();
        return;
      }
      void video.play().catch(() => {
        /* Autoplay can be blocked; muted+playsInline usually succeeds. */
      });
    };

    syncPlayback();
    motionQuery.addEventListener('change', syncPlayback);
    return () => motionQuery.removeEventListener('change', syncPlayback);
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className={styles.hero} aria-label={t('home.headline')}>
      <div className={styles.heroMedia} aria-hidden="true">
        <video
          ref={videoRef}
          className={styles.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={appConfig.heroVideoUrl} type="video/mp4" />
          {appConfig.heroVideoUrlFallback ? (
            <source src={appConfig.heroVideoUrlFallback} type="video/mp4" />
          ) : null}
        </video>
        <div className={styles.heroScrim} />
        <div className={styles.heroGlow} />
      </div>

      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h1 className={styles.headline}>{t('home.headline')}</h1>
        <p className={styles.subtitle}>{t('home.subtitle')}</p>

        <form className={styles.search} onSubmit={onSearch}>
          <IconSearch />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('home.quickSearchPlaceholder')}
            aria-label={t('catalog.search')}
          />
          <button type="submit">{t('home.quickSearchSubmit')}</button>
        </form>

        <div className={styles.suggestions} aria-label={t('home.suggestionsLabel')}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={styles.suggestion}
              onClick={() => navigate(`/search?q=${encodeURIComponent(suggestion)}`)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <Link to="/products" className={styles.ctaPrimary}>
            {t('actions.shopNow')}
            <IconArrowRight />
          </Link>
          <Link to="/categories" className={styles.ctaSecondary}>
            {t('nav.categories')}
          </Link>
        </div>

        <p className={styles.statusLine}>
          {catalogUp === true ? t('home.chipLive') : null}
          {catalogUp === false ? t('home.chipDown') : null}
          {catalogUp !== null && typeof categoryCount === 'number' ? ' · ' : null}
          {typeof categoryCount === 'number'
            ? t('home.chipCategories', { count: categoryCount })
            : null}
        </p>
      </div>
    </section>
  );
}
