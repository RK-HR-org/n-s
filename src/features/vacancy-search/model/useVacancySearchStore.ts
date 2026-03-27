import { defineStore } from 'pinia'
import { ref } from 'vue'
import { searchApi, type AdvancedSearchFiltersDTO, type VacancySearchFiltersDTO } from '@/features/hh-search/api/searchApi'
import { useUserStore } from '@/entities/user'

export const useVacancySearchStore = defineStore('vacancy-search', () => {
    const isLoading = ref(false)
    const isEnriching = ref(false)
    const currentSessionId = ref<string | null>(null)
    const clientVacancyLabels = ref<string[] | null>(null)

    const searchResults = ref<any[]>([])
    const totalResults = ref(0)

    const getDefaultFilters = () => ({
        position: '',
        searchPeriod: null,
        text: '',
        excluded_text: '',
        areas: null,
        period: null,
        dateFrom: null,
        dateTo: null,
        educationLevels: null,
        experience: null,
        workFormat: null,
        employmentForm: null,
        workScheduleByDays: null,
        workingHours: null,
        vacancyLabels: null,
        driverLicenseTypes: null,
        salary: null,
        currency: 'RUR',
        industry: null,
        professionalRole: null,
        employerIds: null,
        search_field: null,
        orderBy: 'relevance'
    })

    const draftFilters = ref<any>(getDefaultFilters())

    const clearFilters = () => {
        draftFilters.value = getDefaultFilters()
        currentSessionId.value = null
        searchResults.value = []
        totalResults.value = 0
    }

    // Helper to get active team ID
    const getActiveTeamId = () => {
        const userStore = useUserStore()
        const teams = userStore.user?.teams
        if (teams && teams.length > 0) {
            return teams[0].id || teams[0]
        }
        throw new Error('У пользователя нет привязанных команд')
    }

    // Create search session with filters (mode: 'vacancies')
    const submitSearch = async (filters: VacancySearchFiltersDTO, passedTeamId?: string, vacancyLabels?: string[] | null) => {
        isLoading.value = true
        try {
            const teamId = passedTeamId || getActiveTeamId()
            clientVacancyLabels.value = vacancyLabels || null

            const createResponse = await searchApi.createSession({
                team_id: teamId,
                mode: 'vacancies',
                searchType: 'advanced',
                vacancy_filters: filters
            })

            const sessionId = createResponse.id
            currentSessionId.value = sessionId

            await searchApi.approveSession(sessionId)

            const executeResponse = await searchApi.executeSession(sessionId)

            let items = (executeResponse.items || []).map((item: any) => item.raw_data || item)

            // Client-side labels (backend DTO doesn't support vacancy labels yet)
            if (clientVacancyLabels.value?.includes('with_salary')) {
                items = items.filter((v: any) => !!v?.salary)
            }

            searchResults.value = items
            totalResults.value = clientVacancyLabels.value?.includes('with_salary')
                ? items.length
                : (executeResponse.result?.hh_found || executeResponse.found || executeResponse.total || 0)

            return sessionId
        } catch (e) {
            console.error('Vacancy search error:', e)
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Load items with pagination
    const loadSessionItems = async (sessionId: string, page = 0) => {
        isLoading.value = true
        try {
            const executeResponse = await searchApi.executeSession(sessionId, { page })
            let items = (executeResponse.items || []).map((item: any) => item.raw_data || item)

            if (clientVacancyLabels.value?.includes('with_salary')) {
                items = items.filter((v: any) => !!v?.salary)
            }

            searchResults.value = items
            totalResults.value = clientVacancyLabels.value?.includes('with_salary')
                ? items.length
                : (executeResponse.result?.hh_found || executeResponse.found || executeResponse.total || 0)
        } catch (e) {
            console.error('Load vacancy items error:', e)
        } finally {
            isLoading.value = false
        }
    }

    // AI Enrich filters
    const enrichFilters = async (positivePrompt: string, negativePrompt: string, currentFilters: VacancySearchFiltersDTO, passedTeamId?: string) => {
        isEnriching.value = true
        try {
            let sessionId = currentSessionId.value
            const teamId = passedTeamId || getActiveTeamId()

            if (!sessionId) {
                const createResponse = await searchApi.createSession({
                    team_id: teamId,
                    mode: 'vacancies',
                    searchType: 'advanced',
                    vacancy_filters: currentFilters
                })
                sessionId = createResponse.id
                currentSessionId.value = sessionId
            }

            const res = await searchApi.enrichSession(sessionId!, {
                prompts: {
                    positive: positivePrompt,
                    negative: negativePrompt
                }
            })

            return res.enriched_filters
        } catch (e) {
            console.error('Enrich error:', e)
            throw e
        } finally {
            isEnriching.value = false
        }
    }

    return {
        isLoading,
        isEnriching,
        currentSessionId,
        searchResults,
        totalResults,
        draftFilters,
        submitSearch,
        loadSessionItems,
        enrichFilters,
        clearFilters
    }
})
