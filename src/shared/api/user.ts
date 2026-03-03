import { apiClient } from './base';
import type { UserResponse, UserCreateRequest, UserUpdateRequest } from './models';

export const userApi = {
    getUsers: () => {
        return apiClient<UserResponse[]>('/v1/user');
    },
    getUser: (userId: string) => {
        return apiClient<UserResponse>(`/v1/user/${userId}`);
    },
    createUser: (data: UserCreateRequest) => {
        return apiClient<UserResponse>('/v1/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    updateUser: (userId: string, data: UserUpdateRequest) => {
        return apiClient<UserResponse>(`/v1/user/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    deleteUser: (userId: string) => {
        return apiClient<void>(`/v1/user/${userId}`, {
            method: 'DELETE'
        });
    }
};
