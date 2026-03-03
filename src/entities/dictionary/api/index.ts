import { apiClient } from '@/shared/api/base';
import type { StaticDictionariesResponse, AreaItem, ProfessionalRoleCategory, DictionaryItem } from '../model/types';

export const dictionaryApi = {
    // Option 1: Fetch everything at once if endpoint supports it
    getAllDictionaries(): Promise<StaticDictionariesResponse> {
        return apiClient<StaticDictionariesResponse>('/v1/static');
    },

    // Option 2: Individual endpoints just in case
    getAreas(): Promise<AreaItem[]> {
        return apiClient<AreaItem[]>('/v1/static/areas');
    },
    getProfessionalRoles(): Promise<{ categories: ProfessionalRoleCategory[] }> {
        return apiClient<{ categories: ProfessionalRoleCategory[] }>('/v1/static/professional-roles');
    },
    getSkills(): Promise<DictionaryItem[]> {
        return apiClient<DictionaryItem[]>('/v1/static/skills');
    }
};
