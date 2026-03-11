<script setup lang="ts">
import { ref } from 'vue'
import { NLayout, NLayoutContent, NText, NH2, NSpace, NGrid, NGridItem, NCard, NTag, NAlert } from 'naive-ui'
import { VacancySearchForm, VacancyTable, useVacancySearchStore } from '@/features/vacancy-search'

const searchStore = useVacancySearchStore()
const currentPage = ref(1)

const handlePageUpdate = (page: number) => {
  currentPage.value = page
  if (searchStore.currentSessionId) {
    searchStore.loadSessionItems(searchStore.currentSessionId, page - 1)
  }
}

import { computed } from 'vue'
import {
  EXPERIENCE, EMPLOYMENT, SCHEDULE, VACANCY_SEARCH_ORDER, CURRENCY_OPTIONS
} from '@/shared/constants/hhDictionaries'
import { useDictionaryStore } from '@/entities/dictionary'

const dictStore = useDictionaryStore()

const getDictTags = (values: string[] | undefined | null, dict: Array<{value: string, label: string}>): string[] => {
    if (!values || values.length === 0) return []
    return values.map(v => dict.find(d => d.value === v)?.label || v)
}

// Recursively find area name by ID in the areas tree
const findAreaName = (id: string, areas: any[]): string | null => {
    for (const area of areas) {
        if (String(area.id) === String(id)) return area.name
        if (area.areas && area.areas.length) {
            const found = findAreaName(id, area.areas)
            if (found) return found
        }
    }
    return null
}

const formattedFilters = computed(() => {
    const f = searchStore.draftFilters
    if (!f) return []

    const items: Array<{label: string, tags: string[]}> = []
    
    // Position
    if (f.position) items.push({ label: 'Должность', tags: [f.position] })

    // Text queries
    if (f.text) {
        items.push({ label: 'Ключевые слова', tags: [f.text] })
    }

    if (f.excluded_text) {
        items.push({ label: 'Исключить слова', tags: [f.excluded_text] })
    }

    // Areas (regions)
    if (f.areas && f.areas.length) {
        const areaTags = f.areas.map((id: string) => findAreaName(id, dictStore.areas) || id)
        items.push({ label: 'Регион', tags: areaTags })
    }

    // Salary
    if (f.salary) {
        items.push({ label: 'Зарплата', tags: [`от ${f.salary.toLocaleString('ru-RU')} ${f.currency || 'RUR'}`.trim()] })
    }

    // Experience & Employment
    const expTags = getDictTags(f.experience, EXPERIENCE)
    if (expTags.length) items.push({ label: 'Опыт работы', tags: expTags })

    const empTags = getDictTags(f.employmentForm, EMPLOYMENT)
    if (empTags.length) items.push({ label: 'Занятость', tags: empTags })

    const schedTags = getDictTags(f.workScheduleByDays, SCHEDULE)
    if (schedTags.length) items.push({ label: 'График', tags: schedTags })

    // Other Formats
    if (f.workFormat && f.workFormat.length) {
        items.push({ label: 'Формат работы', tags: f.workFormat })
    }

    // Employer IDs
    if (f.employerIds && f.employerIds.length) items.push({ label: 'Работодатели', tags: f.employerIds })

    // Search Field
    if (f.search_field && f.search_field.length) {
        const fieldLabels: Record<string, string> = { name: 'Название вакансии', company_name: 'Название компании', description: 'Описание вакансии' }
        items.push({ label: 'Области поиска', tags: f.search_field.map((s: string) => fieldLabels[s] || s) })
    }

    // Labels
    if (f.vacancyLabels && f.vacancyLabels.length) {
        items.push({ label: 'Метки вакансий', tags: f.vacancyLabels })
    }

    // Driver Licenses
    if (f.driverLicenseTypes && f.driverLicenseTypes.length) {
        items.push({ label: 'Категории прав', tags: f.driverLicenseTypes })
    }

    return items
})
</script>

<template>
  <n-layout>
    <n-layout-content style="padding: 24px;">
      <n-space vertical size="large">
        <n-h2>Поиск вакансий</n-h2>
        
        <n-grid :cols="4" x-gap="24">
          <!-- Left side: Search Form -->
          <n-grid-item :span="2">
            <VacancySearchForm />
          </n-grid-item>

          <!-- Right side: Results -->
          <n-grid-item :span="2">
            <template v-if="!searchStore.currentSessionId && !searchStore.isLoading">
              <n-card bordered :content-style="{ padding: '16px', minHeight: '500px' }">
                <div v-if="formattedFilters.length === 0" style="color: var(--n-text-color-3);">
                  Заполните критерии поиска и нажмите "Найти вакансии", чтобы увидеть результаты.
                </div>
                <div v-else>
                    <n-alert v-if="!searchStore.draftFilters?.searchPeriod" type="warning" show-icon style="margin-bottom: 16px;">
                        Если не выбрать период публикации, то будут найдены нерелевантные устаревшие вакансии.
                    </n-alert>
                    <n-text strong style="display: block; margin-bottom: 12px;">Выбранные фильтры:</n-text>
                    <n-space vertical :size="10">
                        <div v-for="item in formattedFilters" :key="item.label" style="display: flex; align-items: flex-start; gap: 8px;">
                            <n-text depth="3" style="min-width: 120px; flex-shrink: 0; padding-top: 4px;">{{ item.label }}:</n-text>
                            <n-space :size="6">
                                <n-tag v-for="tag in item.tags" :key="tag" type="info" size="small" round bordered>
                                    {{ tag }}
                                </n-tag>
                            </n-space>
                        </div>
                    </n-space>
                </div>
              </n-card>
            </template>
            <template v-else>
              <VacancyTable 
                :vacancies="searchStore.searchResults"
                :is-loading="searchStore.isLoading"
                :total="searchStore.totalResults"
                :page="currentPage"
                :per-page="20"
                @update:page="handlePageUpdate"
              />
            </template>
          </n-grid-item>
        </n-grid>
      </n-space>
    </n-layout-content>
  </n-layout>
</template>
