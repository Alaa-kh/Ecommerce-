import type { AppDispatch } from '@/app/store';
import { setCredentials, type AuthUser } from '@/app/store/app-slice';
import type {
  PlatziLoginResponse,
  PlatziProfile,
} from '@/features/auth/services/auth-api';

export const AUTH_STORAGE_KEY = 'lumina.auth.v1';

export function mapProfileToAuthUser(profile: PlatziProfile): AuthUser {
  const [firstName, ...rest] = profile.name.split(' ');
  return {
    id: String(profile.id),
    email: profile.email,
    firstName: firstName || profile.name,
    lastName: rest.join(' '),
    roles: [profile.role],
    permissions: [],
    avatarUrl: profile.avatar || null,
  };
}

export function persistAuthSession(
  dispatch: AppDispatch,
  tokens: PlatziLoginResponse,
  profile: PlatziProfile,
): AuthUser {
  const user = mapProfileToAuthUser(profile);
  dispatch(
    setCredentials({
      accessToken: tokens.access_token,
      user,
    }),
  );
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user,
    }),
  );
  return user;
}
