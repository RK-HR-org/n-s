import { apiClient } from './base';

export interface TeamResponse {
    id: string;
    name: string;
    description?: string | null;
    is_active?: boolean;
    created_at: string;
}

export type PermissionType =
    | 'add_users'
    | 'edit_users'
    | 'delete_users'
    | 'view_users_list'
    | 'view_user_details'
    | 'view_teams_list'
    | 'view_team_details'
    | 'execute_hh_search'
    | 'manage_team_permissions'
    | 'manage_team_quotas';

export interface TeamPermissionResponse {
    id: string;
    permission_type: PermissionType;
    created_at: string;
}

export interface TeamPermissionsListResponse {
    team_id: string;
    team_name: string;
    permissions: TeamPermissionResponse[];
}

export const teamApi = {
    getTeams: () => {
        return apiClient<TeamResponse[]>('/v1/team');
    },
    getTeamPermissions: (teamId: string) => {
        return apiClient<TeamPermissionsListResponse>(`/v1/team/${teamId}/permission`);
    },
    addTeamPermission: (teamId: string, permissionType: PermissionType) => {
        return apiClient<TeamPermissionResponse>(`/v1/team/${teamId}/permission`, {
            method: 'POST',
            body: JSON.stringify({ permission_type: permissionType })
        });
    },
    removeTeamPermission: (teamId: string, permissionType: PermissionType) => {
        return apiClient<void>(`/v1/team/${teamId}/permission/${permissionType}`, {
            method: 'DELETE'
        });
    }
};
