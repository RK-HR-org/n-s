import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TeamResponse } from './types';
import { teamApi } from '../api/api';

export const useTeamStore = defineStore('team', () => {
    const teams = ref<TeamResponse[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const fetchTeams = async () => {
        isLoading.value = true;
        error.value = null;
        try {
            teams.value = await teamApi.getTeams();
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch teams';
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    };

    return { teams, isLoading, error, fetchTeams };
});
