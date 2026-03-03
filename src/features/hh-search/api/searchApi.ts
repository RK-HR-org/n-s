import { apiClient } from '@/shared/api/base'

export interface TextQueryDTO {
    text: string
    logic?: 'all' | 'any' | 'phrase' | 'except'
    field?: 'everywhere' | 'title' | 'education' | 'experience' | 'experience_company' | 'experience_position' | 'experience_description' | 'skills'
    period?: 'all_time' | 'last_year' | 'last_three_years' | 'last_six_years'
}

export interface AdvancedSearchFiltersDTO {
    textQueries?: TextQueryDTO[]
    ageFrom?: number | null
    ageTo?: number | null
    gender?: string | null
    labels?: string[] | null
    areas?: number[] | null
    relocation?: string | null
    district?: string | null
    citizenship?: number[] | null
    workTicket?: number[] | null
    businessTripReadiness?: string[] | null
    period?: number | null
    educationLevels?: string[] | null
    experience?: string[] | null
    employment?: string[] | null
    schedule?: string[] | null
    skills?: number[] | null
    driverLicenseTypes?: string[] | null
    currency?: string | null
    salaryFrom?: number | null
    salaryTo?: number | null
    professionalRole?: number[] | null
    jobSearchStatus?: string[] | null
    orderBy?: string | null
    page?: number
    perPage?: number
}

export interface SearchCreateRequest {
    team_id: string
    mode?: 'resumes' | 'vacancies'
    searchType: 'simple' | 'advanced'
    queryRaw?: any
    filters?: AdvancedSearchFiltersDTO
}

export interface SearchEnrichRequest {
    prompts: {
        positive?: string
        negative?: string
    }
}

export interface SearchExecuteRequest {
    override_filters?: AdvancedSearchFiltersDTO
}

export const searchApi = {
    createSession(payload: SearchCreateRequest) {
        return apiClient<any>('/v1/search/sessions', {
            method: 'POST',
            body: JSON.stringify(payload)
        })
    },

    enrichSession(sessionId: string, payload: SearchEnrichRequest) {
        return apiClient<any>(`/v1/search/sessions/${sessionId}/enrich`, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
    },

    approveSession(sessionId: string) {
        return apiClient<any>(`/v1/search/sessions/${sessionId}/approve`, {
            method: 'POST'
        })
    },

    executeSession(sessionId: string, payload: SearchExecuteRequest = {}) {
        return apiClient<any>(`/v1/search/sessions/${sessionId}/execute`, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
    },

    getSessionItems(sessionId: string, limit = 20, offset = 0) {
        return apiClient<any>(`/v1/search/sessions/${sessionId}/items?limit=${limit}&offset=${offset}`, {
            method: 'GET'
        })
    },

    getSession(sessionId: string) {
        return apiClient<any>(`/v1/search/sessions/${sessionId}?with_results=true`, {
            method: 'GET'
        })
    },

    getSessions(limit = 20, offset = 0, teamId?: string) {
        const params = new URLSearchParams()
        params.append('limit', limit.toString())
        params.append('offset', offset.toString())
        if (teamId) {
            params.append('team_id', teamId)
        }
        return apiClient<any>(`/v1/search/sessions?${params.toString()}`, {
            method: 'GET'
        })
    }
}
