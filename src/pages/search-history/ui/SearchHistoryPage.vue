<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { NCard, NDataTable, NButton, NSpace, NText, NTag, NTabs, NTabPane, NInput } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/features/hh-search/model/useSearchStore'

const router = useRouter()
const searchStore = useSearchStore()

const page = ref(1)
const perPage = ref(20)
const scope = ref<'mine' | 'team'>('team')
const localKeyword = ref('')

onMounted(() => {
    fetchData()
})

const fetchData = () => {
    const offset = (page.value - 1) * perPage.value
    searchStore.fetchSessions(perPage.value, offset, scope.value)
}

const handlePageChange = (newPage: number) => {
    page.value = newPage
    fetchData()
}

const handleScopeChange = () => {
    page.value = 1
    fetchData()
}

const filteredSessions = computed(() => {
    if (!localKeyword.value) return searchStore.sessions
    const q = localKeyword.value.toLowerCase()
    return searchStore.sessions.filter((s: any) => {
        const queries = s.query_raw?.textQueries?.map((t: any) => t.text.toLowerCase()) || []
        const qStr = queries.join(' ')
        return qStr.includes(q) || (s.status && s.status.toLowerCase().includes(q)) || (s.searchType && s.searchType.toLowerCase().includes(q))
    })
})

const handleJumpToSession = (sessionId: string) => {
    router.push({ name: 'search-session', params: { id: sessionId } })
}

const columns = [
    {
        title: 'Дата создания',
        key: 'created_at',
        render(row: any) {
            if (!row.created_at) return '—'
            return new Date(row.created_at).toLocaleString('ru-RU')
        }
    },
    {
        title: 'Тип поиска',
        key: 'searchType',
        render(row: any) {
             return h(NTag, { type: row.searchType === 'advanced' ? 'info' : 'default' }, { default: () => row.searchType || 'simple' })
        }
    },
    {
        title: 'Режим',
        key: 'mode',
        render(row: any) {
             return row.mode === 'resumes' ? 'Резюме' : 'Вакансии'
        }
    },
    {
        title: 'Статус',
        key: 'status',
        render(row: any) {
             const statusMap: Record<string, { type: 'success' | 'warning' | 'info' | 'error' | 'default', label: string }> = {
                 'executed': { type: 'success', label: 'Завершён' },
                 'approved': { type: 'success', label: 'Обработка' },
                 'draft': { type: 'info', label: 'Черновик' },
                 'in_progress': { type: 'warning', label: 'В процессе' },
                 'created': { type: 'info', label: 'Создан' },
                 'failed': { type: 'error', label: 'Ошибка' },
             }
             const s = statusMap[row.status] || { type: 'default', label: row.status }
             return h(NTag, { type: s.type, round: true }, { default: () => s.label })
        }
    },
    {
        title: 'Ключевые слова',
        key: 'keywords',
        render(row: any) {
             const queries = row.query_raw?.textQueries || []
             if (!queries || queries.length === 0) return '—'
             
             return h(NSpace, { size: 'small' }, {
                 default: () => queries.slice(0, 3).map((q: any) => h(NTag, { type: 'primary', size: 'small', bordered: false }, { default: () => q.text }))
             })
        }
    },
    {
        title: 'Фильтры',
        key: 'filters',
        render(row: any) {
            const f = row.query_raw || {}
            const parts: string[] = []
            if (f.salaryFrom || f.salaryTo) {
                const sFrom = f.salaryFrom ? `от ${f.salaryFrom}` : ''
                const sTo = f.salaryTo ? `до ${f.salaryTo}` : ''
                const currency = f.currency === 'RUR' ? '₽' : f.currency || ''
                parts.push(`ЗП: ${sFrom} ${sTo}`.trim() + ` ${currency}`)
            }
            if (f.experience && f.experience.length > 0) {
                parts.push(`Опыт: ${f.experience.length} кат.`)
            }
            if (f.areas && f.areas.length > 0) {
                parts.push(`Регионы: ${f.areas.length}`)
            }
            
            if (parts.length === 0) return '—'
            return h(NSpace, { size: 'small' }, {
                default: () => parts.map(p => h(NTag, { size: 'small', bordered: true }, { default: () => p }))
            })
        }
    },
    {
        title: 'Действия',
        key: 'actions',
        render(row: any) {
            return h(
                NButton,
                {
                    size: 'small',
                    type: 'primary',
                    secondary: true,
                    onClick: () => handleJumpToSession(row.id)
                },
                { default: () => 'Открыть результат' }
            )
        }
    }
]

</script>

<template>
    <div class="search-history-page">
        <n-space vertical :size="24">
            <div>
                <n-text tag="h1" class="text-2xl font-bold mb-2">История поиска</n-text>
                <n-text depth="3">Список ранее сохраненных поисковых сессий</n-text>
            </div>
            
            <n-card :bordered="false" class="shadow-sm rounded-xl">
                <n-space vertical :size="16">
                    <n-space justify="space-between" align="center">
                        <n-tabs v-model:value="scope" type="segment" @update:value="handleScopeChange" style="width: 300px">
                            <n-tab-pane name="mine" tab="Мои сессии" />
                            <n-tab-pane name="team" tab="Сессии команды" />
                        </n-tabs>
                        
                        <n-input v-model:value="localKeyword" placeholder="Поиск по 20 записям..." style="width: 250px" clearable>
                            <template #prefix>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21l-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314"/></svg>
                            </template>
                        </n-input>
                    </n-space>
                
                    <n-data-table
                        :columns="columns"
                        :data="filteredSessions"
                    :loading="searchStore.isSessionsLoading"
                    :pagination="{
                        page: page,
                        pageSize: perPage,
                        itemCount: searchStore.totalSessions,
                        onChange: handlePageChange
                    }"
                    remote
                    :bordered="false"
                />
                </n-space>
            </n-card>
        </n-space>
    </div>
</template>

<style scoped>
.search-history-page {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
}
</style>
