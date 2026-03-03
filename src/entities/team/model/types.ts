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
