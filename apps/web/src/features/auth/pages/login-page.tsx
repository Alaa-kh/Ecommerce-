import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/app/store/hooks';
import { persistAuthSession } from '@/features/auth/domain/session';
import { authApi } from '@/features/auth/services/auth-api';
import { Button } from '@/shared/components/ui/button';
import { PasswordField, TextField } from '@/shared/components/ui/field';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { toAppError } from '@/shared/types/errors';
import styles from './auth-page.module.css';

export { AUTH_STORAGE_KEY } from '@/features/auth/domain/session';

export function LoginPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('john@mail.com');
  const [password, setPassword] = useState('changeme');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const tokens = await authApi.login(email.trim(), password);
      const profile = await authApi.profile(tokens.access_token);
      persistAuthSession(dispatch, tokens, profile);
      const redirect = params.get('redirect') || '/';
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(toAppError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={`${styles.page} animPage`}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h1>{t('auth.loginTitle')}</h1>
        <p className={styles.subtitle}>{t('auth.loginSubtitle')}</p>

        <form className={styles.form} onSubmit={(event) => void onSubmit(event)}>
          <TextField
            label={t('auth.email')}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <PasswordField
            label={t('auth.password')}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error ? (
            <StatePanel tone="error" title={t('auth.loginFailed')} description={error} />
          ) : null}

          <Button type="submit" size="lg" isLoading={isSubmitting}>
            {t('auth.loginCta')}
          </Button>
        </form>

        <p className={styles.hint}>{t('auth.demoHint')}</p>
        <Link to="/" className={styles.back}>
          {t('auth.backHome')}
        </Link>
      </div>
    </section>
  );
}
