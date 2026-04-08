import { apiClient } from '@/shared/api/base'

export interface TextQueryDTO {
    text: string
    logic?: 'all' | 'any' | 'phrase' | 'except'
    field?: (
        // Resume fields
        'everywhere' | 'title' | 'education' | 'experience' | 'experience_company' | 'experience_position' | 'experience_description' | 'skills'
        // Vacancy fields
        | 'name' | 'company_name' | 'description'
    )
    period?: 'all_time' | 'last_year' | 'last_three_years' | 'last_six_years'
}

export interface AdvancedSearchFiltersDTO {
    text?: string
    excluded_text?: string
    search_field?: string[] | null
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
    filterExpIndustry?: string[] | null
    filterExpPeriod?: string | null
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

export interface VacancySearchFiltersDTO {
    text?: string | null
    excluded_text?: string | null
    search_field?: string[] | null
    areas?: number[] | null
    metro?: number[] | null
    employment_form?: string[] | null
    work_schedule_by_days?: string[] | null
    working_hours?: string[] | null
    work_format?: string[] | null
    experience?: string[] | null
    professional_role?: number[] | null
    industry?: string[] | null
    education?: string[] | null
    employer_id?: string[] | null
    salary?: number | null
    currency?: string | null
    only_with_salary?: boolean | null
    label?: string[] | null
    period?: number | null
    date_from?: string | null
    date_to?: string | null
    accept_temporary?: boolean | null
    no_magic?: boolean | null
    order_by?: string | null
    clusters?: boolean | null
    page?: number | null
    per_page?: number | null
}

export interface SearchCreateRequest {
    team_id: string
    mode?: 'resumes' | 'vacancies'
    searchType: 'simple' | 'advanced'
    queryRaw?: any
    filters?: AdvancedSearchFiltersDTO
    vacancy_filters?: VacancySearchFiltersDTO
}

export interface SearchEnrichRequest {
    prompts: {
        positive?: string
        negative?: string
    }
}

export interface SearchExecuteRequest {
    page?: number // 0-indexed page number
    override_filters?: AdvancedSearchFiltersDTO
    override_vacancy_filters?: VacancySearchFiltersDTO
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

    getSessionItems(sessionId: string, limit = 20, offset = 0, includeHidden = false) {
        return apiClient<any>(`/v1/search/sessions/${sessionId}/items?limit=${limit}&offset=${offset}&include_hidden=${includeHidden}`, {
            method: 'GET'
        })
    },

    updateItemFlags(sessionId: string, itemId: string, body: { is_hidden?: boolean; is_favorite?: boolean }) {
        return apiClient<any>(`/v1/search/sessions/${sessionId}/items/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify(body)
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

        const path = teamId ? `/v1/search/teams/${teamId}/sessions` : `/v1/search/sessions`

        return apiClient<any>(`${path}?${params.toString()}`, {
            method: 'GET'
        })
    }
}
