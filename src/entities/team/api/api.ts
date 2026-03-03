import { apiClient, API_URL } from '@/shared/api/base';
import type { TeamResponse, TeamCreateUpdate, TeamMembersResponse } from '../model/types';

export const teamApi = {
    getTeams: () => apiClient<TeamResponse[]>('/v1/team'),

    getTeamById: (teamId: string) => apiClient<TeamResponse>(`/v1/team/${teamId}`),

    getTeamMembers: (teamId: string) => apiClient<TeamMembersResponse>(`/v1/team/${teamId}/members`),

    createTeam: (data: TeamCreateUpdate) =>
        apiClient<TeamResponse>('/v1/team', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateTeam: (teamId: string, data: TeamCreateUpdate) =>
        apiClient<TeamResponse>(`/v1/team/${teamId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    deleteTeam: async (teamId: string): Promise<void> => {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/v1/team/${teamId}`, {
            method: 'DELETE',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `API Error: ${response.status}`);
        }
        // Return without calling json() since 204 has no content
    }
};
