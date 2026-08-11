import { Outlet } from 'react-router-dom';
import { SiteChatbot } from '@/features/chatbot/components/site-chatbot';
import { ScrollToTop } from '@/shared/components/layout/scroll-to-top';
import { SiteFooter } from '@/shared/components/layout/site-footer';
import { SiteHeader } from '@/shared/components/layout/site-header';
import styles from './app-shell.module.css';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <ScrollToTop />
      <SiteHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
      <SiteFooter />
      <SiteChatbot />
    </div>
  );
}
