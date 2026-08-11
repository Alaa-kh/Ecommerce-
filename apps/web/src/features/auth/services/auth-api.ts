import { platziRequest } from '@/shared/services/http/platzi-client';

export interface PlatziLoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface PlatziProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar: string;
}

export const authApi = {
  login(email: string, password: string): Promise<PlatziLoginResponse> {
    return platziRequest<PlatziLoginResponse>({
      url: '/auth/login',
      method: 'POST',
      data: { email, password },
    });
  },

  profile(accessToken: string): Promise<PlatziProfile> {
    return platziRequest<PlatziProfile>({
      url: '/auth/profile',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};
