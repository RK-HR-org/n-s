<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NCard, NDataTable, NButton, NSpace, NText, NTag } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/features/hh-search/model/useSearchStore'

const router = useRouter()
const searchStore = useSearchStore()

const page = ref(1)
const perPage = ref(20)

onMounted(() => {
    fetchData()
})

const fetchData = () => {
    const offset = (page.value - 1) * perPage.value
    searchStore.fetchSessions(perPage.value, offset)
}

const handlePageChange = (newPage: number) => {
    page.value = newPage
    fetchData()
}

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
                 'completed': { type: 'success', label: 'Завершён' },
                 'in_progress': { type: 'warning', label: 'В процессе' },
                 'created': { type: 'info', label: 'Создан' },
                 'failed': { type: 'error', label: 'Ошибка' },
             }
             const s = statusMap[row.status] || { type: 'default', label: row.status }
             return h(NTag, { type: s.type, round: true }, { default: () => s.label })
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
                <n-data-table
                    :columns="columns"
                    :data="searchStore.sessions"
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
