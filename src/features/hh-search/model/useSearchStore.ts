import { defineStore } from 'pinia'
import { ref } from 'vue'
import { searchApi, type AdvancedSearchFiltersDTO } from '../api/searchApi'
import { useUserStore } from '@/entities/user'

export const useSearchStore = defineStore('hh-search', () => {
    const isLoading = ref(false)
    const isEnriching = ref(false)
    const currentSessionId = ref<string | null>(null)

    const searchResults = ref<any[]>([])
    const totalResults = ref(0)

    // Helper to get active team ID
    const getActiveTeamId = () => {
        const userStore = useUserStore()
        const teams = userStore.user?.teams
        if (teams && teams.length > 0) {
            return teams[0].id || teams[0] // handle object or string ID
        }
        throw new Error('У пользователя нет привязанных команд')
    }

    // Create search session with filters
    const submitSearch = async (filters: AdvancedSearchFiltersDTO, passedTeamId?: string) => {
        isLoading.value = true
        try {
            const teamId = passedTeamId || getActiveTeamId()

            // Create session
            const createResponse = await searchApi.createSession({
                team_id: teamId,
                mode: 'resumes',
                searchType: 'advanced',
                filters
            })

            const sessionId = createResponse.id
            currentSessionId.value = sessionId

            // Approve the session (required by backend before execution)
            await searchApi.approveSession(sessionId)

            // Execute the search and use its response for the first page
            const executeResponse = await searchApi.executeSession(sessionId)

            // Map the search results correctly (handling both db row structures and direct items)
            searchResults.value = (executeResponse.items || []).map((item: any) => item.raw_data || item)
            totalResults.value = executeResponse.found || executeResponse.total || 0

            return sessionId
        } catch (e) {
            console.error('Search error:', e)
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Load items with pagination
    const loadSessionItems = async (sessionId: string, limit = 20, offset = 0) => {
        isLoading.value = true
        try {
            const itemsResponse = await searchApi.getSessionItems(sessionId, limit, offset)
            searchResults.value = (itemsResponse.items || []).map((item: any) => item.raw_data || item)
            totalResults.value = itemsResponse.total || itemsResponse.found || 0
        } catch (e) {
            console.error('Load items error:', e)
        } finally {
            isLoading.value = false
        }
    }

    // AI Enrich filters
    const enrichFilters = async (positivePrompt: string, negativePrompt: string, currentFilters: AdvancedSearchFiltersDTO, passedTeamId?: string) => {
        isEnriching.value = true
        try {
            let sessionId = currentSessionId.value
            const teamId = passedTeamId || getActiveTeamId()

            // If we don't have a session ID yet, create a dummy one or an empty one first
            if (!sessionId) {
                const createResponse = await searchApi.createSession({
                    team_id: teamId,
                    mode: 'resumes',
                    searchType: 'advanced',
                    filters: currentFilters
                })
                sessionId = createResponse.id
                currentSessionId.value = sessionId
            }

            // Enrich logic using Coze via the backend
            const res = await searchApi.enrichSession(sessionId!, {
                prompts: {
                    positive: positivePrompt,
                    negative: negativePrompt
                }
            })

            // Return the enriched values
            return res.enriched_filters
        } catch (e) {
            console.error('Enrich error:', e)
            throw e
        } finally {
            isEnriching.value = false
        }
    }

    // Session history
    const sessions = ref<any[]>([])
    const isSessionsLoading = ref(false)
    const totalSessions = ref(0)

    // Detailed session metadata
    const currentSessionMetadata = ref<any>(null)

    // Fetch user sessions
    const fetchSessions = async (limit = 20, offset = 0, passedTeamId?: string) => {
        isSessionsLoading.value = true
        try {
            const teamId = passedTeamId || getActiveTeamId()
            const response = await searchApi.getSessions(limit, offset, teamId)

            sessions.value = response.items || []
            totalSessions.value = response.total || response.found || 0
        } catch (e) {
            console.error('Fetch sessions error:', e)
        } finally {
            isSessionsLoading.value = false
        }
    }

    // Fetch individual session metadata
    const fetchSessionMetadata = async (sessionId: string) => {
        isLoading.value = true
        try {
            const response = await searchApi.getSession(sessionId)
            currentSessionMetadata.value = response
            return response
        } catch (e) {
            console.error('Fetch session metadata error:', e)
            throw e
        } finally {
            isLoading.value = false
        }
    }

    return {
        isLoading,
        isEnriching,
        currentSessionId,
        currentSessionMetadata,
        searchResults,
        totalResults,
        sessions,
        isSessionsLoading,
        totalSessions,
        submitSearch,
        loadSessionItems,
        enrichFilters,
        fetchSessions,
        fetchSessionMetadata
    }
})
