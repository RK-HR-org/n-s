<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayout, NLayoutContent, NSpace, NCard, NText, NH2, NButton, NIcon, NTag, NDescriptions, NDescriptionsItem, NCollapse, NCollapseItem, NSwitch } from 'naive-ui'
import * as XLSX from 'xlsx'
import { useSearchStore, ResumeTable, CandidatePreviewModal } from '@/features/hh-search'
import { searchApi } from '@/features/hh-search/api/searchApi'
import { VacancyTable, VacancyPreviewModal } from '@/features/vacancy-search'
import {
  EDUCATION_LEVEL, EXPERIENCE, EMPLOYMENT, SCHEDULE, GENDER,
  BUSINESS_TRIP_READINESS, DRIVER_LICENSE_TYPES, JOB_SEARCH_STATUSES_APPLICANT
} from '@/shared/constants/hhDictionaries'

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

const sessionId = route.params.id as string
const currentPage = ref(1)

const isPreviewModalVisible = ref(false)
const previewCandidate = ref<any>(null)

const handlePreviewCandidate = (candidate: any) => {
    previewCandidate.value = candidate
    isPreviewModalVisible.value = true
}

const isLoadingAll = ref(false)

onMounted(async () => {
    // 1. Fetch metadata
    await searchStore.fetchSessionMetadata(sessionId)
    searchStore.currentSessionId = sessionId
    
    // 2. Fetch saved results from DB
    handlePageUpdate(1)
})

const handlePageUpdate = (page: number) => {
    currentPage.value = page
    const perPage = 20
    searchStore.fetchSessionHistoryItems(sessionId, perPage, (page - 1) * perPage)
}

const handleLoadAllResults = async () => {
    isLoadingAll.value = true
    try {
        await searchStore.loadAllSessionResults(sessionId)
        currentPage.value = 1
    } finally {
        isLoadingAll.value = false
    }
}

// Toggle show hidden items
const handleShowHiddenChange = (val: boolean) => {
    searchStore.showHidden = val
    handlePageUpdate(1)
}

// Handle hide/show toggle from table
const handleToggleHidden = (payload: { itemId: string; isHidden: boolean }) => {
    searchStore.toggleItemHidden(sessionId, payload.itemId, payload.isHidden)
}

// Real total from HH API (stored in session metadata)
const hhFoundTotal = computed(() => {
    const meta = searchStore.currentSessionMetadata
    if (!meta) return 0
    // Check results array
    if (meta.results && meta.results.length > 0) {
        return Math.max(...meta.results.map((r: any) => r.hh_found || 0))
    }
    if (meta.result?.hh_found) return meta.result.hh_found
    return searchStore.totalResults || 0
})

const savedItemsCount = computed(() => {
    const meta = searchStore.currentSessionMetadata
    if (!meta) return 0
    if (meta.results && meta.results.length > 0) {
        return meta.results.reduce((sum: number, r: any) => sum + (r.items_count || 0), 0)
    }
    return searchStore.searchResults?.length || 0
})

const handleTableSort = (sorter: any) => {
    console.log('Sort triggered:', sorter)
}

const statusMap: Record<string, { type: 'success' | 'warning' | 'info' | 'error' | 'default', label: string }> = {
    'completed': { type: 'success', label: 'Завершён' },
    'in_progress': { type: 'warning', label: 'В процессе' },
    'created': { type: 'info', label: 'Создан' },
    'failed': { type: 'error', label: 'Ошибка' },
}

const sessionStatus = computed(() => {
    if (!searchStore.currentSessionMetadata) return { type: 'default', label: '—' }
    return statusMap[searchStore.currentSessionMetadata.status] || { type: 'default', label: searchStore.currentSessionMetadata.status }
})

// Formatting helpers
const getDictLabels = (values: string[] | undefined | null, dict: Array<{value: string, label: string}>) => {
    if (!values || values.length === 0) return ''
    return values.map(v => dict.find(d => d.value === v)?.label || v).join(', ')
}

const isVacancyMode = computed(() => searchStore.currentSessionMetadata?.mode === 'vacancies')

const displayResults = computed(() => {
    if (isVacancyMode.value) {
        let allVacancies: any[] = []
        searchStore.searchResults.forEach(res => {
            if (res.hh_response_json && res.hh_response_json.items) {
                allVacancies = allVacancies.concat(res.hh_response_json.items)
            } else if (res.items) {
                allVacancies = allVacancies.concat(res.items)
            } else {
               allVacancies.push(res)
            }
        })
        return allVacancies
    }
    return searchStore.searchResults
})

const formattedFilters = computed(() => {
    // The API returns filters in query_raw
    const f = searchStore.currentSessionMetadata?.query_raw || searchStore.currentSessionMetadata?.filters
    if (!f) return []

    const items: Array<{label: string, value: string}> = []
    
    // Text queries
    if (f.textQueries && f.textQueries.length) {
        const textQueriesStr = f.textQueries.map((q: any) => `"${q.text}"`).join(' И ')
        items.push({ label: 'Ключевые слова', value: textQueriesStr })
    }

    // Salary
    if (f.salaryFrom || f.salaryTo) {
        const from = f.salaryFrom ? `от ${f.salaryFrom.toLocaleString('ru-RU')}` : ''
        const to = f.salaryTo ? `до ${f.salaryTo.toLocaleString('ru-RU')}` : ''
        items.push({ label: 'Зарплата', value: `${from} ${to} ${f.currency || ''}`.trim() })
    }

    // Demography
    if (f.ageFrom || f.ageTo) {
        items.push({ label: 'Возраст', value: `${f.ageFrom ? 'от ' + f.ageFrom : ''} ${f.ageTo ? 'до ' + f.ageTo : ''}`.trim() })
    }
    if (f.gender) items.push({ label: 'Пол', value: GENDER.find(g => g.value === f.gender)?.label || f.gender })

    // Experience & Employment
    const exp = getDictLabels(f.experience, EXPERIENCE)
    if (exp) items.push({ label: 'Опыт работы', value: exp })

    const emp = getDictLabels(f.employment, EMPLOYMENT)
    if (emp) items.push({ label: 'Занятость', value: emp })

    const sched = getDictLabels(f.schedule, SCHEDULE)
    if (sched) items.push({ label: 'График', value: sched })

    // Other arrays
    if (f.skills && f.skills.length) items.push({ label: 'Навыки (ID)', value: f.skills.join(', ') })
    if (f.areas && f.areas.length) items.push({ label: 'Регионы (ID)', value: f.areas.join(', ') })
    if (f.professionalRole && f.professionalRole.length) items.push({ label: 'Роли (ID)', value: f.professionalRole.join(', ') })

    return items
})

const isExporting = ref(false)

const exportToExcel = async () => {
    isExporting.value = true
    try {
        // Запросом извлекаем все элементы порциями по 500 (максимальный лимит API)
        let allFetchedItems: any[] = []
        let currentOffset = 0
        const batchSize = 500
        
        while (true) {
            const response = await searchApi.getSessionItems(sessionId, batchSize, currentOffset, false)
            const batchItems = response.items || []
            
            if (batchItems.length === 0) {
                break
            }
            
            const mappedBatch = batchItems.map((dbItem: any) => {
                const rawData = dbItem.raw_data || dbItem
                 return {
                    ...rawData,
                    _itemId: dbItem.id || null,
                    _isHidden: dbItem.is_hidden || false,
                    _isFavorite: dbItem.is_favorite || false
                }
            })
            
            allFetchedItems = allFetchedItems.concat(mappedBatch)
            currentOffset += batchSize
            
            if (batchItems.length < batchSize) {
                break // Оптимизация: если пришло меньше запрошенного числа, значит это конец
            }
        }

        if (allFetchedItems.length === 0) {
            isExporting.value = false
            return
        }

        let partKomPosition = ''
        const f = searchStore.currentSessionMetadata?.query_raw || searchStore.currentSessionMetadata?.filters
        if (f) {
            if (f.position) {
                partKomPosition = f.position
            } else if (f.textQueries && f.textQueries.length > 0) {
                const phraseQuery = f.textQueries.find((q:any) => q.logic === 'phrase' && (q.field === 'title' || q.field === 'name'))
                if (phraseQuery) partKomPosition = phraseQuery.text
                else partKomPosition = f.textQueries[0].text
            }
        }

        let itemsToExport: any[] = []
        if (isVacancyMode.value) {
            allFetchedItems.forEach((res: any) => {
                if (res.hh_response_json && res.hh_response_json.items) {
                    itemsToExport = itemsToExport.concat(res.hh_response_json.items)
                } else if (res.items) {
                    itemsToExport = itemsToExport.concat(res.items)
                } else {
                   itemsToExport.push(res)
                }
            })
        } else {
            itemsToExport = allFetchedItems
        }

        const data = itemsToExport.map((item: any) => {
            if (isVacancyMode.value) {
                // Vacancy mapping
                let employmentName = item.employment?.name || item.employment_form?.name || ''
                if (employmentName === 'Полная' || employmentName === 'Частичная') {
                    employmentName += ' занятость'
                } else if (employmentName === 'Проектная') {
                    employmentName += ' работа'
                }

                const scheduleName = item.schedule?.name || item.work_schedule?.name || item.work_schedule_by_days?.map((s:any) => s.name).join(', ') || ''

                let salaryFrom = item.salary?.from || ''
                let salaryTo = item.salary?.to || ''
                if (item.salary?.gross === true) {
                    if (salaryFrom) salaryFrom = Math.round(salaryFrom * 0.87)
                    if (salaryTo) salaryTo = Math.round(salaryTo * 0.87)
                }

                return {
                    'Резюме/Вакансия': 'Вакансия',
                    'Источник (ссылка)': item.alternate_url || item.url || '',
                    'Сферы деятельности компании': '',
                    'География/город': item.area?.name || item.address?.city || '',
                    'Компания': item.employer?.name || '',
                    'Наименование позиции/вакансии': item.name || item.title || '',
                    'Наименование должности в ПартКом': partKomPosition,
                    'Зарплата от': salaryFrom,
                    'Зарплата до': salaryTo,
                    'Профобласть вакансии': item.professional_roles?.map((r: any) => r.name).join(', ') || '',
                    'Ключевые навыки': item.key_skills?.map((s:any) => s.name).join(', ') || '',
                    'Тип занятости': employmentName,
                    'График работы': scheduleName,
                    'Опыт работы': item.experience?.name || ''
                }
            } else {
                // Resume mapping (original)
                let expPeriod = ''
                if (item.total_experience?.months) {
                    const years = Math.floor(item.total_experience.months / 12)
                    const months = item.total_experience.months % 12
                    let expStrs = []
                    if (years) expStrs.push(`${years} г.`)
                    if (months) expStrs.push(`${months} мес.`)
                    expPeriod = expStrs.join(' ')
                } else if (item.experience) {
                    expPeriod = 'Нет опыта'
                }
                
                let lastCompany = ''
                let lastPosition = ''
                let industry = ''
                if (item.experience && item.experience.length > 0) {
                    lastCompany = item.experience[0].company || ''
                    lastPosition = item.experience[0].position || ''
                    if (item.experience[0].industries && item.experience[0].industries.length > 0) {
                        industry = item.experience[0].industries.map((i: any) => i.name).join(', ')
                    }
                }

                const skillsStr = (item.skill_set || []).join(', ')
                const empStr = (item.employment || []).map((e: any) => e.name).join(', ')
                const schedStr = (item.schedules || []).map((s: any) => s.name).join(', ')

                let salaryAmount = item.salary?.amount || ''
                if (item.salary?.gross === true && salaryAmount) {
                    salaryAmount = Math.round(salaryAmount * 0.87)
                }

                return {
                    'Резюме/Вакансия': 'Резюме',
                    'Источник (ссылка)': item.alternate_url || item.url || '',
                    'Сферы деятельности компании': industry,
                    'География/город': item.area?.name || '',
                    'Компания': lastCompany,
                    'Наименование позиции/вакансии': item.title || lastPosition || '',
                    'Наименование должности в ПартКом': partKomPosition,
                    'Зарплата от': salaryAmount,
                    'Зарплата до': '',
                    'Профобласть вакансии': item.professional_roles?.map((r: any) => r.name).join(', ') || '',
                    'Ключевые навыки': skillsStr,
                    'Тип занятости': empStr,
                    'График работы': schedStr,
                    'Опыт работы': expPeriod || 'Нет опыта'
                }
            }
        })

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Сводка')
        
        // Auto-sizing columns roughly
        const colWidths = [
            { wch: 18 }, { wch: 40 }, { wch: 30 }, { wch: 20 }, 
            { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 15 },
            { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 20 },
            { wch: 20 }, { wch: 20 }
        ]
        worksheet['!cols'] = colWidths

        XLSX.writeFile(workbook, `Выгрузка_Сессия_${sessionId}.xlsx`)
    } catch (e) {
        console.error('Ошибка при экспорте', e)
    } finally {
        isExporting.value = false
    }
}
</script>

<template>
    <n-layout>
        <n-layout-content style="padding: 24px;">
            <n-space vertical size="large">
                
                <n-space align="center">
                    <n-button text style="font-size: 20px" @click="router.push('/search-history')">
                        <n-icon>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M11.67 3.87L9.9 2.1L0 12l9.9 9.9l1.77-1.77L3.54 12z"/></svg>
                        </n-icon>
                    </n-button>
                    <n-h2 style="margin: 0">Детали сессии поиска</n-h2>
                </n-space>

                <n-card bordered :loading="searchStore.isLoading && !searchStore.currentSessionMetadata">
                    <template v-if="searchStore.currentSessionMetadata">
                        <n-descriptions label-placement="left" bordered :column="2">
                            <n-descriptions-item label="ID Сессии">
                                <n-text depth="3">{{ searchStore.currentSessionMetadata.id }}</n-text>
                            </n-descriptions-item>
                            <n-descriptions-item label="Статус">
                                <n-tag :type="sessionStatus.type as any" round size="small">
                                    {{ sessionStatus.label }}
                                </n-tag>
                            </n-descriptions-item>
                            <n-descriptions-item label="Дата создания">
                                {{ new Date(searchStore.currentSessionMetadata.created_at).toLocaleString('ru-RU') }}
                            </n-descriptions-item>
                            <n-descriptions-item label="Найдено на HH">
                                {{ hhFoundTotal }}
                            </n-descriptions-item>
                            <n-descriptions-item label="Загружено результатов">
                                {{ savedItemsCount }}
                                <n-button 
                                    v-if="savedItemsCount < hhFoundTotal"
                                    type="info" 
                                    size="tiny" 
                                    secondary
                                    style="margin-left: 8px;"
                                    :loading="isLoadingAll"
                                    @click="handleLoadAllResults"
                                >
                                    Загрузить все ({{ hhFoundTotal }})
                                </n-button>
                            </n-descriptions-item>
                        </n-descriptions>

                        <div style="margin-top: 16px;">
                            <n-text strong>Примененные фильтры:</n-text>
                            <n-space style="margin-top: 8px;">
                                <template v-if="formattedFilters.length > 0">
                                    <n-tag v-for="item in formattedFilters" :key="item.label" type="info" bordered>
                                        {{ item.label }}: <span style="font-weight: 500;">{{ item.value }}</span>
                                    </n-tag>
                                </template>
                                <n-text depth="3" v-else>Нет фильтров</n-text>
                            </n-space>
                        </div>
                    </template>
                </n-card>

                <n-card bordered>
                    <template #header>
                        <n-space justify="space-between" align="center">
                            <n-space align="center" :size="16">
                                <span>{{ isVacancyMode ? 'Вакансии' : 'Кандидаты' }}</span>
                                <n-space align="center" :size="8">
                                    <n-switch 
                                        :value="searchStore.showHidden" 
                                        @update:value="handleShowHiddenChange"
                                        size="small"
                                    />
                                    <n-text depth="3" style="font-size: 13px; font-weight: 400;">Показать скрытые</n-text>
                                </n-space>
                            </n-space>
                            <n-button 
                                type="success" 
                                size="small" 
                                @click="exportToExcel" 
                                :loading="isExporting"
                                :disabled="!searchStore.searchResults?.length"
                            >
                                <template #icon>
                                    <n-icon>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10-5H8v-2h8v2zm-3-4H8V9h5v2z"/></svg>
                                    </n-icon>
                                </template>
                                Выгрузить в Excel
                            </n-button>
                        </n-space>
                    </template>
                    <template v-if="searchStore.totalResults > 0">
                        <VacancyTable 
                            v-if="isVacancyMode"
                            :vacancies="displayResults"
                            :is-loading="searchStore.isLoading"
                            :total="searchStore.totalResults"
                            :page="currentPage"
                            :per-page="20"
                            @update:page="handlePageUpdate"
                            @update:sorter="handleTableSort"
                            @preview="handlePreviewCandidate"
                            @toggle-hidden="handleToggleHidden"
                        />
                        <ResumeTable 
                            v-else
                            :resumes="displayResults"
                            :is-loading="searchStore.isLoading"
                            :total="searchStore.totalResults"
                            :page="currentPage"
                            :per-page="20"
                            @update:page="handlePageUpdate"
                            @update:sorter="handleTableSort"
                            @preview="handlePreviewCandidate"
                            @toggle-hidden="handleToggleHidden"
                        />
                    </template>
                    <template v-else-if="!searchStore.isLoading">
                        <n-text depth="3">В этой сессии кандидатов не найдено.</n-text>
                    </template>
                </n-card>

            </n-space>
        </n-layout-content>
        <VacancyPreviewModal
            v-if="isVacancyMode"
            v-model:show="isPreviewModalVisible"
            :vacancy="previewCandidate"
        />
        <CandidatePreviewModal
            v-else
            v-model:show="isPreviewModalVisible"
            :candidate="previewCandidate"
        />
    </n-layout>
</template>
