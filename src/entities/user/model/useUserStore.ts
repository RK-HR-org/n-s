import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, type UserResponse, type LoginRequest } from '@/shared/api';
import { teamApi, type PermissionType } from '@/entities/team';

export const useUserStore = defineStore('user', () => {
    const user = ref<UserResponse | null>(null);
    const permissions = ref<Set<PermissionType>>(new Set());
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
        permissions.value.clear();
    };

    const fetchMe = async () => {
        try {
            if (!localStorage.getItem('access_token')) return;
            const userData = await authApi.getMe();
            user.value = userData;
            await fetchPermissions();
        } catch (error) {
            logout(); // Если токен протух или невалидный
            throw error;
        }
    };

    const fetchPermissions = async () => {
        if (!user.value) return;

        try {
            const perms = new Set<PermissionType>();
            for (const team of user.value.teams) {
                // Извлекаем team_id, учитывая разные возможные структуры ответа API для teams
                const teamId = typeof team === 'string' ? team : (team.team_id || team.id);
                if (teamId) {
                    try {
                        const teamPerms = await teamApi.getTeamPermissions(teamId);
                        teamPerms.permissions.forEach(p => perms.add(p.permission_type));
                    } catch (e) {
                        console.error(`Failed to fetch permissions for team ${teamId}`, e);
                    }
                }
            }
            permissions.value = perms;
        } catch (error) {
            console.error('Failed to fetch user permissions', error);
        }
    };

    const hasPermission = (permission: PermissionType): boolean => {
        if (!user.value) return false;
        if (user.value.role?.name?.toLowerCase() === 'superadmin') return true;
        return permissions.value.has(permission);
    };

    return {
        user,
        permissions,
        isAuthenticated,
        login,
        logout,
        fetchMe,
        hasPermission
    };
});
