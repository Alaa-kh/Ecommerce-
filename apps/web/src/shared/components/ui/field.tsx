import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { useTranslation } from 'react-i18next';
import { IconEye, IconEyeOff } from '@/shared/components/ui/icons';
import styles from './field.module.css';

interface FieldShellProps {
  label: string;
  htmlFor: string;
  helperText?: string;
  error?: string;
  children: ReactNode;
}

export function FieldShell({ label, htmlFor, helperText, error, children }: FieldShellProps) {
  return (
    <label className={styles.field} htmlFor={htmlFor}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span className={styles.helper}>{helperText}</span>
      ) : null}
    </label>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export function TextField({
  label,
  id,
  helperText,
  error,
  className,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? props.name ?? label;
  return (
    <FieldShell label={label} htmlFor={fieldId} helperText={helperText} error={error}>
      <input
        id={fieldId}
        className={[styles.control, error ? styles.invalid : '', className].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldShell>
  );
}

interface PasswordFieldProps extends Omit<TextFieldProps, 'type'> {
  revealLabel?: string;
  hideLabel?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    {
      label,
      id,
      helperText,
      error,
      className,
      revealLabel,
      hideLabel,
      ...props
    },
    ref,
  ) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const fieldId = id ?? props.name ?? label;
    const showLabel = revealLabel ?? t('auth.showPassword');
    const concealLabel = hideLabel ?? t('auth.hidePassword');

    return (
      <FieldShell label={label} htmlFor={fieldId} helperText={helperText} error={error}>
        <span className={styles.passwordWrap}>
          <input
            id={fieldId}
            ref={ref}
            type={visible ? 'text' : 'password'}
            className={[
              styles.control,
              styles.passwordInput,
              error ? styles.invalid : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={Boolean(error)}
            {...props}
          />
          <button
            type="button"
            className={styles.passwordToggle}
            aria-label={visible ? concealLabel : showLabel}
            aria-pressed={visible}
            onClick={(event) => {
              event.preventDefault();
              setVisible((current) => !current);
            }}
          >
            {visible ? <IconEyeOff /> : <IconEye />}
          </button>
        </span>
      </FieldShell>
    );
  },
);

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  helperText?: string;
  error?: string;
  children: ReactNode;
}

export function SelectField({
  label,
  id,
  helperText,
  error,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? props.name ?? label;
  return (
    <FieldShell label={label} htmlFor={fieldId} helperText={helperText} error={error}>
      <select
        id={fieldId}
        className={[styles.control, error ? styles.invalid : '', className].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  onClear?: () => void;
  clearLabel?: string;
}

export function SearchField({
  label,
  id,
  className,
  onClear,
  clearLabel = 'Clear',
  value,
  ...props
}: SearchFieldProps) {
  const fieldId = id ?? 'search';
  const hasValue = typeof value === 'string' && value.length > 0;

  return (
    <label className={styles.search} htmlFor={fieldId}>
      <span className="sr-only">{label}</span>
      <input
        id={fieldId}
        type="search"
        className={[styles.searchInput, className].filter(Boolean).join(' ')}
        value={value}
        {...props}
      />
      {hasValue && onClear ? (
        <button type="button" className={styles.clear} onClick={onClear} aria-label={clearLabel}>
          ×
        </button>
      ) : null}
    </label>
  );
}
