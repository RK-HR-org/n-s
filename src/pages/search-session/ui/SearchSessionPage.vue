<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayout, NLayoutContent, NSpace, NCard, NText, NH2, NButton, NIcon, NTag, NDescriptions, NDescriptionsItem, NCollapse, NCollapseItem } from 'naive-ui'
import { useSearchStore, ResumeTable, CandidatePreviewModal } from '@/features/hh-search'
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

onMounted(async () => {
    // 1. Fetch metadata
    await searchStore.fetchSessionMetadata(sessionId)
    searchStore.currentSessionId = sessionId
    
    // 2. Fetch results
    handlePageUpdate(1)
})

const handlePageUpdate = (page: number) => {
    currentPage.value = page
    const perPage = 20
    searchStore.loadSessionItems(sessionId, perPage, (page - 1) * perPage)
}

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

const formattedFilters = computed(() => {
    // The API returns filters in query_raw
    const f = searchStore.currentSessionMetadata?.query_raw || searchStore.currentSessionMetadata?.filters
    if (!f) return []

    const items = []
    
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
                            <n-descriptions-item label="Найдено результатов">
                                {{ searchStore.totalResults }}
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

                        <n-collapse style="margin-top: 16px;">
                            <n-collapse-item title="Сырые данные (JSON)" name="filters">
                                <pre style="background-color: var(--n-color-modal); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 13px;">{{ JSON.stringify(searchStore.currentSessionMetadata.query_raw || searchStore.currentSessionMetadata.filters, null, 2) }}</pre>
                            </n-collapse-item>
                        </n-collapse>
                    </template>
                </n-card>

                <n-card bordered>
                    <template #header>
                        Кандидаты
                    </template>
                    <template v-if="searchStore.totalResults > 0">
                        <ResumeTable 
                            :resumes="searchStore.searchResults"
                            :is-loading="searchStore.isLoading"
                            :total="searchStore.totalResults"
                            :page="currentPage"
                            :per-page="20"
                            @update:page="handlePageUpdate"
                            @update:sorter="handleTableSort"
                            @preview="handlePreviewCandidate"
                        />
                    </template>
                    <template v-else-if="!searchStore.isLoading">
                        <n-text depth="3">В этой сессии кандидатов не найдено.</n-text>
                    </template>
                </n-card>

            </n-space>
        </n-layout-content>
        <CandidatePreviewModal
            v-model:show="isPreviewModalVisible"
            :candidate="previewCandidate"
        />
    </n-layout>
</template>
