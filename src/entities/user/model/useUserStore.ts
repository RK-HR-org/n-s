import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, type UserResponse, type LoginRequest } from '@/shared/api';

export const useUserStore = defineStore('user', () => {
    const user = ref<UserResponse | null>(null);
    const isAuthenticated = computed(() => !!user.value);

    const login = async (credentials: LoginRequest) => {
        try {
            const tokens = await authApi.login(credentials);
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
            await fetchMe();
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        user.value = null;
    };

    const fetchMe = async () => {
        try {
            if (!localStorage.getItem('access_token')) return;
            const userData = await authApi.getMe();
            user.value = userData;
        } catch (error) {
            logout(); // Если токен протух или невалидный
            throw error;
        }
    };

    return {
        user,
        isAuthenticated,
        login,
        logout,
        fetchMe
    };
});
