// Типы из OpenAPI схемы (c:\Projects\n-s\.agents\skills\backend-api-expert\references\openapi.json)
import type { PermissionType } from './team';

export interface LoginRequest {
    email: string;
    password?: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RoleInfo {
    id: string;
    name: string;
}

export interface UserResponse {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: {
        id: string;
        name: string;
    };
    status: string;
    teams: any[];
    created_at: string;
}

export interface UserTeamAssignment {
    team_id: string;
    is_manager: boolean;
}

export interface UserCreateRequest {
    email: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    role_id: string;
    team_ids?: string[];
    team_assignments?: UserTeamAssignment[];
}

export interface UserUpdateRequest {
    email?: string;
    first_name?: string;
    last_name?: string;
    role_id?: string;
    status?: string;
    team_ids?: string[];
    team_assignments?: UserTeamAssignment[];
}
