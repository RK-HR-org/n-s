import { apiClient } from './base';

export interface StaticSuggestItem {
    text: string;
}

export interface StaticSuggestResponse {
    items: StaticSuggestItem[];
    suggest_id?: string;
}

function normalizeSuggestResponse(res: any): string[] {
    if (!res) return [];
    // Most endpoints return: { items: [{ text: string }, ...] }
    if (Array.isArray(res.items)) {
        return res.items
            .map((item: any) => (typeof item === 'string' ? item : item?.text))
            .filter((v: any): v is string => typeof v === 'string' && v.trim().length > 0);
    }
    // Sometimes could be a plain array
    if (Array.isArray(res)) {
        return res
            .map((item: any) => (typeof item === 'string' ? item : item?.text))
            .filter((v: any): v is string => typeof v === 'string' && v.trim().length > 0);
    }
    return [];
}

export const staticApi = {
    /**
     * Get keyword suggestions for resume search
     */
    async getResumeKeywordSuggestions(text: string): Promise<string[]> {
        if (!text.trim()) return [];
        const res = await apiClient<any>(`/v1/static/suggest/resume-search-keyword?text=${encodeURIComponent(text)}`);
        return normalizeSuggestResponse(res);
    },

    /**
     * Get keyword suggestions for vacancy search
     */
    async getVacancyKeywordSuggestions(text: string): Promise<string[]> {
        if (!text.trim()) return [];
        const res = await apiClient<any>(`/v1/static/suggest/vacancy-search-keyword?text=${encodeURIComponent(text)}`);
        return normalizeSuggestResponse(res);
    },

    /**
     * Get keyword suggestions for employers (companies) — text-only, for autocomplete hints.
     * NOT suitable for employer ID filtering.
     */
    async getEmployerKeywordSuggestions(text: string): Promise<string[]> {
        if (!text.trim()) return [];
        const res = await apiClient<any>(`/v1/static/suggest/companies?text=${encodeURIComponent(text)}`);
        return normalizeSuggestResponse(res);
    },

    /**
     * Search employers by name using /v1/static/employers — returns {id, text} pairs.
     * Use this for vacancy employer filter (employerIds), as it returns actual HH employer IDs.
     */
    async getEmployerSuggestions(text: string): Promise<{ id: string; text: string }[]> {
        if (!text.trim()) return [];
        const res = await apiClient<any>(`/v1/static/employers?text=${encodeURIComponent(text)}&only_with_vacancies=true`);
        // Response: { items: [{ id, name, ... }], found, ... }
        const items: any[] = Array.isArray(res?.items) ? res.items : []
        return items
            .filter((item: any) => item?.id && item?.name)
            .map((item: any) => ({ id: String(item.id), text: item.name }))
    },

    /**
     * Suggest positions (generic, mostly for resume search "position/title")
     */
    async getPositionsSuggestions(text: string): Promise<string[]> {
        if (!text.trim()) return [];
        const res = await apiClient<any>(`/v1/static/suggest/positions?text=${encodeURIComponent(text)}`);
        return normalizeSuggestResponse(res);
    },

    /**
     * Suggest vacancy positions (for vacancy search "position/title")
     */
    async getVacancyPositionsSuggestions(text: string): Promise<string[]> {
        if (!text.trim()) return [];
        const res = await apiClient<any>(`/v1/static/suggest/vacancy-positions?text=${encodeURIComponent(text)}`);
        return normalizeSuggestResponse(res);
    },

    /**
     * Suggest skills
     */
    async getSkillsSuggestions(text: string): Promise<string[]> {
        if (!text.trim()) return [];
        const res = await apiClient<any>(`/v1/static/suggest/skills?text=${encodeURIComponent(text)}`);
        return normalizeSuggestResponse(res);
    },

    /**
     * Generic suggest endpoint (if needed for other types in the future)
     */
    async getSuggestions(type: string, text: string): Promise<string[]> {
        if (!text.trim()) return [];
        const res = await apiClient<any>(`/v1/static/suggest/${type}?text=${encodeURIComponent(text)}`);
        return normalizeSuggestResponse(res);
    }
};
