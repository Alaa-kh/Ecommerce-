import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ThemeMode } from '@/app/config/design-tokens';

export type Locale = 'en' | 'ar';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  avatarUrl?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

interface UiState {
  theme: ThemeMode;
  locale: Locale;
  direction: 'ltr' | 'rtl';
  isMobileNavOpen: boolean;
}

interface AppState {
  auth: AuthState;
  ui: UiState;
}

function readStoredTheme(): ThemeMode {
  const value = localStorage.getItem('theme');
  if (value === 'light' || value === 'dark') return value;
  // Legacy "system" (or missing) → resolve once into an explicit preference.
  if (value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function readStoredAuth(): AuthState {
  try {
    const raw = localStorage.getItem('lumina.auth.v1');
    if (!raw) {
      return { accessToken: null, user: null, isAuthenticated: false };
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { accessToken: null, user: null, isAuthenticated: false };
    }
    const data = parsed as {
      accessToken?: unknown;
      user?: AuthUser | null;
    };
    if (typeof data.accessToken !== 'string' || !data.user) {
      return { accessToken: null, user: null, isAuthenticated: false };
    }
    return {
      accessToken: data.accessToken,
      user: data.user,
      isAuthenticated: true,
    };
  } catch {
    return { accessToken: null, user: null, isAuthenticated: false };
  }
}

const storedTheme = readStoredTheme();
const storedLocale = (localStorage.getItem('locale') as Locale | null) ?? 'en';
const storedAuth = readStoredAuth();

const initialState: AppState = {
  auth: storedAuth,
  ui: {
    theme: storedTheme,
    locale: storedLocale,
    direction: storedLocale === 'ar' ? 'rtl' : 'ltr',
    isMobileNavOpen: false,
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; user: AuthUser }>,
    ) {
      state.auth.accessToken = action.payload.accessToken;
      state.auth.user = action.payload.user;
      state.auth.isAuthenticated = true;
    },
    clearCredentials(state) {
      state.auth.accessToken = null;
      state.auth.user = null;
      state.auth.isAuthenticated = false;
      localStorage.removeItem('lumina.auth.v1');
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.ui.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setLocale(state, action: PayloadAction<Locale>) {
      state.ui.locale = action.payload;
      state.ui.direction = action.payload === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('locale', action.payload);
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.ui.isMobileNavOpen = action.payload;
    },
  },
});

export const {
  setCredentials,
  clearCredentials,
  setTheme,
  setLocale,
  setMobileNavOpen,
} = appSlice.actions;

export const appReducer = appSlice.reducer;
