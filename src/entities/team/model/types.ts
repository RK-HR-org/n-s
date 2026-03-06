export interface TeamResponse {
    id: string;
    name: string;
    description: string | null;
    is_active?: boolean;
    created_at: string;
}

export interface TeamCreateUpdate {
    name: string;
    description: string | null;
}

export interface TeamMemberInfo {
    user_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    is_manager: boolean;
    joined_at: string;
}

export interface TeamMembersResponse {
    team_id: string;
    team_name: string;
    members: TeamMemberInfo[];
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
