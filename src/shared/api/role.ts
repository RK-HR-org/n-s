import { apiClient } from './base';

export interface RoleResponse {
    id: string;
    name: string;
    description?: string | null;
    is_system?: boolean;
}

export const roleApi = {
    getRoles: () => {
        return apiClient<RoleResponse[]>('/v1/role');
    },
};
