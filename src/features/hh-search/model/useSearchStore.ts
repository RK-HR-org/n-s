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
    const showHidden = ref(false)

    const getDefaultFilters = () => ({
        position: '',
        searchPeriod: null,
        textQueries: [{ text: '', logic: 'all', field: 'everywhere', period: 'all_time' }],
        ageFrom: null,
        ageTo: null,
        gender: null,
        labels: null,
        areas: null,
        relocation: null,
        metro: null,
        district: null,
        citizenship: null,
        workTicket: null,
        businessTripReadiness: null,
        period: null,
        dateFrom: null,
        dateTo: null,
        educationLevels: null,
        educationalInstitution: null,
        experience: null,
        filterExpIndustry: null,
        filterExpPeriod: null,
        employment: null,
        schedule: null,
        skills: null,
        languages: null,
        driverLicenseTypes: null,
        salaryFrom: null,
        salaryTo: null,
        currency: 'RUR',
        professionalRole: null,
        jobSearchStatus: null,
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
            searchResults.value = (executeResponse.items || []).map((item: any) => mapSearchItem(item))
            totalResults.value = executeResponse.result?.hh_found || executeResponse.found || executeResponse.total || 0

            return sessionId
        } catch (e) {
            console.error('Search error:', e)
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Load items for live search pagination
    const loadSessionItems = async (sessionId: string, page = 0) => {
        isLoading.value = true
        try {
            const executeResponse = await searchApi.executeSession(sessionId, { page })
            searchResults.value = (executeResponse.items || []).map((item: any) => mapSearchItem(item))
            totalResults.value = executeResponse.result?.hh_found || executeResponse.found || executeResponse.total || 0
        } catch (e) {
            console.error('Load items error:', e)
        } finally {
            isLoading.value = false
        }
    }

    // Map item from API to include metadata
    const mapSearchItem = (item: any) => {
        const rawData = item.raw_data || item
        return {
            ...rawData,
            _itemId: item.id || null,
            _isHidden: item.is_hidden || false,
            _isFavorite: item.is_favorite || false
        }
    }

    // Fetch items from DB for session history
    const fetchSessionHistoryItems = async (sessionId: string, limit = 1000, offset = 0) => {
        isLoading.value = true
        try {
            const itemsResponse = await searchApi.getSessionItems(sessionId, limit, offset, showHidden.value)
            searchResults.value = (itemsResponse.items || []).map((item: any) => mapSearchItem(item))
            if (itemsResponse.items) {
                totalResults.value = itemsResponse.total || itemsResponse.found || itemsResponse.items.length
            }
        } catch (e) {
            console.error('Fetch history items error:', e)
        } finally {
            isLoading.value = false
        }
    }

    // Optimistic toggle is_hidden
    const toggleItemHidden = async (sessionId: string, itemId: string, currentHidden: boolean) => {
        const newHidden = !currentHidden

        // Optimistic update
        const idx = searchResults.value.findIndex((r: any) => r._itemId === itemId)
        if (idx !== -1) {
            searchResults.value[idx] = { ...searchResults.value[idx], _isHidden: newHidden }
        }

        try {
            await searchApi.updateItemFlags(sessionId, itemId, { is_hidden: newHidden })
            // If hidden and not showing hidden items, remove from list
            if (newHidden && !showHidden.value && idx !== -1) {
                searchResults.value.splice(idx, 1)
                totalResults.value = Math.max(0, totalResults.value - 1)
            }
        } catch (e) {
            // Rollback
            if (idx !== -1) {
                searchResults.value[idx] = { ...searchResults.value[idx], _isHidden: currentHidden }
            }
            console.error('Toggle hidden error:', e)
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
    const fetchSessions = async (limit = 20, offset = 0, scope: 'mine' | 'team' = 'mine', passedTeamId?: string) => {
        isSessionsLoading.value = true
        try {
            const teamId = scope === 'team' ? (passedTeamId || getActiveTeamId()) : undefined
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

            // Extract real total from session results metadata
            if (response.results && response.results.length > 0) {
                // Find the max hh_found across all results
                const maxFound = Math.max(...response.results.map((r: any) => r.hh_found || 0))
                if (maxFound > 0) {
                    totalResults.value = maxFound
                }
            } else if (response.result?.hh_found) {
                totalResults.value = response.result.hh_found
            }

            return response
        } catch (e) {
            console.error('Fetch session metadata error:', e)
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Load all results by executing search for each page
    const loadAllSessionResults = async (sessionId: string) => {
        isLoading.value = true
        try {
            const perPage = 20
            
            // Получаем свежие метаданные сессии, чтобы узнать, сколько уже скачано
            const meta = await searchApi.getSession(sessionId)
            let savedItems = 0
            if (meta.results && meta.results.length > 0) {
                savedItems = meta.results.reduce((sum: number, r: any) => sum + (r.items_count || 0), 0)
            }
            
            let page = Math.floor(savedItems / perPage)
            let realTotal = totalResults.value || 0

            // Fetch page by page until we have all items
            while ((page * perPage) < realTotal || page === 0) {
                const executeResponse = await searchApi.executeSession(sessionId, { page })
                const count = (executeResponse.items || []).length

                if (count === 0) break

                // Update realTotal from response
                const responseTotal = executeResponse.result?.hh_found || executeResponse.found || executeResponse.total || 0
                if (responseTotal > 0) {
                    realTotal = responseTotal
                    totalResults.value = realTotal
                }

                page++

                // Safety: don't fetch more than 50 pages (1000 items)
                if (page >= 50) break
            }

            // Обновляем метаданные, чтобы на экране сразу изменилась цифра "Загружено результатов"
            const updatedMeta = await searchApi.getSession(sessionId)
            currentSessionMetadata.value = updatedMeta
            
            // Возвращаем таблицу на чистую 1 страницу (считываем из локальной базы)
            await fetchSessionHistoryItems(sessionId, perPage, 0)
        } catch (e) {
            console.error('Load all results error:', e)
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
        showHidden,
        draftFilters,
        sessions,
        isSessionsLoading,
        totalSessions,
        submitSearch,
        loadSessionItems,
        fetchSessionHistoryItems,
        toggleItemHidden,
        enrichFilters,
        fetchSessions,
        fetchSessionMetadata,
        loadAllSessionResults,
        clearFilters
    }
})
