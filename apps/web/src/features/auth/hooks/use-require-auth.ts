import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/store/hooks';

export function useRequireAuth() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.app.auth.isAuthenticated);

  function requireAuth(redirectTo?: string): boolean {
    if (isAuthenticated) return true;
    const redirect = redirectTo ?? `${window.location.pathname}${window.location.search}`;
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
    return false;
  }

  return { isAuthenticated, requireAuth };
}
