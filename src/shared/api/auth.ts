import { apiClient } from './base';
import type { LoginRequest, TokenResponse, UserResponse } from './models';

export const authApi = {
    login: (data: LoginRequest) => {
        return apiClient<TokenResponse>('/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getMe: () => {
        return apiClient<UserResponse>('/v1/auth/me', {
            method: 'GET',
        });
    },
};
