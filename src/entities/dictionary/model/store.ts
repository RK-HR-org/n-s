import { defineStore } from 'pinia';
import { ref } from 'vue';
import { dictionaryApi } from '../api';
import type { AreaItem, ProfessionalRoleCategory, DictionaryItem } from './types';

export const useDictionaryStore = defineStore('dictionary', () => {
    const areas = ref<AreaItem[]>([]);
    const professionalRoles = ref<ProfessionalRoleCategory[]>([]);
    const industries = ref<DictionaryItem[]>([]);
    const skills = ref<DictionaryItem[]>([]);

    const isLoading = ref(false);

    const fetchAll = async () => {
        if (areas.value.length > 0) return; // already loaded

        isLoading.value = true;
        try {
            // Use the individual endpoints to be safe
            const [areasData, rolesData, industriesData] = await Promise.all([
                dictionaryApi.getAreas().catch(() => []),
                dictionaryApi.getProfessionalRoles().catch(() => ({ categories: [] })),
                dictionaryApi.getIndustries().catch(() => []),
            ]);

            areas.value = areasData;
            professionalRoles.value = rolesData.categories;
            industries.value = industriesData;
        } catch (e) {
            console.error('Failed to load statics:', e);
        } finally {
            isLoading.value = false;
        }
    };

    return { areas, professionalRoles, industries, skills, isLoading, fetchAll };
});
