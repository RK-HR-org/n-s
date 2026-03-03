import { defineStore } from 'pinia';
import { ref } from 'vue';
import { dictionaryApi } from '../api';
import type { AreaItem, ProfessionalRoleCategory, DictionaryItem } from './types';

export const useDictionaryStore = defineStore('dictionary', () => {
    const areas = ref<AreaItem[]>([]);
    const professionalRoles = ref<ProfessionalRoleCategory[]>([]);
    const skills = ref<DictionaryItem[]>([]);

    const isLoading = ref(false);

    const fetchAll = async () => {
        if (areas.value.length > 0) return; // already loaded

        isLoading.value = true;
        try {
            // Use the individual endpoints to be safe
            const [areasData, rolesData] = await Promise.all([
                dictionaryApi.getAreas().catch(() => []),
                dictionaryApi.getProfessionalRoles().catch(() => ({ categories: [] }))
            ]);

            areas.value = areasData;
            professionalRoles.value = rolesData.categories;
        } catch (e) {
            console.error('Failed to load statics:', e);
        } finally {
            isLoading.value = false;
        }
    };

    return { areas, professionalRoles, skills, isLoading, fetchAll };
});
