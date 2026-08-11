import { useTranslation } from 'react-i18next';
import { StatePanel } from '@/shared/components/ui/state-panel';

interface PlaceholderPageProps {
  titleKey: string;
}

export function PlaceholderPage({ titleKey }: PlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <StatePanel
      title={t(titleKey)}
      description={t('home.subtitle')}
    />
  );
}
