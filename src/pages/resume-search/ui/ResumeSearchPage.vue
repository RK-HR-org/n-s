<script setup lang="ts">
import { ref } from 'vue'
import { NLayout, NLayoutContent, NText, NH2, NSpace, NGrid, NGridItem, NCard, NTag, NAlert, NButton, NIcon } from 'naive-ui'
import { HHSearchForm, ResumeList, useSearchStore } from '@/features/hh-search'

const searchStore = useSearchStore()
const currentPage = ref(1)

const handlePageUpdate = (page: number) => {
  currentPage.value = page
  if (searchStore.currentSessionId) {
    searchStore.loadSessionItems(searchStore.currentSessionId, page - 1)
  }
}

import { computed } from 'vue'
import {
  EDUCATION_LEVEL, EXPERIENCE, EMPLOYMENT, SCHEDULE, GENDER, FILTER_EXP_PERIOD
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
    if (f.textQueries && f.textQueries.length) {
        const filled = f.textQueries.filter((q: any) => q.text.trim() !== '')
        if (filled.length) {
            items.push({ label: 'Ключевые слова', tags: filled.map((q: any) => q.text) })
        }
    }

    // Areas (regions)
    if (f.areas && f.areas.length) {
        const areaTags = f.areas.map((id: string) => findAreaName(id, dictStore.areas) || id)
        items.push({ label: 'Регион', tags: areaTags })
    }

    // Salary
    if (f.salaryFrom || f.salaryTo) {
        const from = f.salaryFrom ? `от ${f.salaryFrom.toLocaleString('ru-RU')}` : ''
        const to = f.salaryTo ? `до ${f.salaryTo.toLocaleString('ru-RU')}` : ''
        items.push({ label: 'Зарплата', tags: [`${from} ${to} ${f.currency || ''}`.trim()] })
    }

    // Demography
    if (f.ageFrom || f.ageTo) {
        items.push({ label: 'Возраст', tags: [`${f.ageFrom ? 'от ' + f.ageFrom : ''} ${f.ageTo ? 'до ' + f.ageTo : ''}`.trim()] })
    }
    if (f.gender) items.push({ label: 'Пол', tags: [GENDER.find(g => g.value === f.gender)?.label || f.gender] })

    // Experience & Employment
    const expTags = getDictTags(f.experience, EXPERIENCE)
    if (expTags.length) items.push({ label: 'Опыт работы', tags: expTags })

    // Industry experience
    if (f.filterExpIndustry && f.filterExpIndustry.length) {
        const indTags = f.filterExpIndustry.map((id: string) => {
            for (const ind of (dictStore.industries as any[])) {
                if (String(ind.id) === String(id)) return ind.name
                if (ind.industries) {
                    const sub = ind.industries.find((i: any) => String(i.id) === String(id))
                    if (sub) return sub.name
                }
            }
            return id
        })
        items.push({ label: 'Опыт в отрасли', tags: indTags })
    }

    if (f.filterExpPeriod) {
        const periodLabel = FILTER_EXP_PERIOD.find(p => p.value === f.filterExpPeriod)?.label || f.filterExpPeriod
        items.push({ label: 'Период в отрасли', tags: [periodLabel] })
    }

    const empTags = getDictTags(f.employment, EMPLOYMENT)
    if (empTags.length) items.push({ label: 'Занятость', tags: empTags })

    const schedTags = getDictTags(f.schedule, SCHEDULE)
    if (schedTags.length) items.push({ label: 'График', tags: schedTags })

    // Labels
    if (f.labels && f.labels.length) items.push({ label: 'Метки', tags: f.labels })

    // Skills
    if (f.skills && f.skills.length) items.push({ label: 'Навыки', tags: f.skills })

    return items
})
</script>

<template>
  <n-layout>
    <n-layout-content style="padding: 24px;">
      <n-space vertical size="large">
        <n-space align="center" justify="start" style="gap: 24px;">
          <n-h2 style="margin: 0">Поиск резюме</n-h2>
          <n-button type="info" size="small" @click="searchStore.clearFilters">
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48"><!-- Icon from Plump free icons by Streamline - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" fill-rule="evenodd" d="M21.468 19.922q-.285 1.044-.562 2.07c2.921 2.096 4.548 5.826 4.467 9.535l-.056 2.538a4.95 4.95 0 0 0 1.462 3.627l1.084 1.073c2.705 2.677 1.196 7.439-2.764 7.77c-2.83.235-6.366.464-9.477.464c-4.013 0-8.002-.38-10.476-.672c-2.458-.29-4.37-2.442-4.125-5.04c.33-3.485 1.198-7.386 2.069-10.676c1.387-5.242 5.521-9.67 11.1-10.267l.289-1.101l.003-.013c1.383-5.274 2.866-10.928 4.457-16.021c.443-1.417 1.78-2.533 3.468-2.123c.288.07.635.163.92.248c1.674.498 2.287 2.146 1.964 3.608c-1.068 4.838-2.482 10.043-3.819 14.964l-.004.013zm-11.459 14.92a2 2 0 0 1 1.769 2.207c-.122 1.106.006 3.759 1.205 5.896a68 68 0 0 0 2.9.053c-1.236-2.447-1.234-4.912-1.233-5.86v-.061a2 2 0 1 1 4 0c0 1.3.057 3.941 2.045 5.76c1.417-.081 2.808-.184 4.071-.289a.5.5 0 0 0 .28-.101a.56.56 0 0 0 .003-.839l-1.084-1.072a8.95 8.95 0 0 1-2.647-6.559l.056-2.538c.09-4.068-2.545-7.163-5.895-7.163c-3.997 0-7.38 3.038-8.522 7.358c-.85 3.21-1.655 6.866-1.953 10.028c-.03.314.187.643.61.693c.82.096 1.806.202 2.898.3c-.808-2.453-.843-4.838-.71-6.044a2 2 0 0 1 2.207-1.769m16.351-5.217a2 2 0 0 1 2-2h11.76a2 2 0 1 1 0 4H28.36a2 2 0 0 1-2-2m4.44 3.879a2 2 0 1 0 0 4h11.76a2 2 0 1 0 0-4zm2.44 5.879a2 2 0 1 0 0 4H45a2 2 0 1 0 0-4z" clip-rule="evenodd"/></svg>
              </n-icon>
            </template>
            Очистить форму
          </n-button>
        </n-space>
        
        <n-grid :cols="4" x-gap="24">
          <!-- Left side: Search Form -->
          <n-grid-item :span="2">
            <HHSearchForm />
          </n-grid-item>

          <!-- Right side: Results -->
          <n-grid-item :span="2">
            <template v-if="!searchStore.currentSessionId && !searchStore.isLoading">
              <n-card bordered :content-style="{ padding: '16px', minHeight: '500px' }">
                <div v-if="formattedFilters.length === 0" style="color: var(--n-text-color-3);">
                  Заполните критерии поиска и нажмите "Найти", чтобы увидеть результаты.
                </div>
                <div v-else>
                    <n-alert v-if="!searchStore.draftFilters?.searchPeriod" type="warning" show-icon style="margin-bottom: 16px;">
                        Если не выбрать период обновления, то будут найдены нерелевантные устаревшие резюме.
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
              <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
                <n-button 
                  type="info" 
                  secondary 
                  size="small" 
                  @click="$router.push(`/search-history/${searchStore.currentSessionId}`)"
                  v-if="searchStore.currentSessionId"
                >
                  Перейти к результатам
                </n-button>
              </div>
              <ResumeList 
                :resumes="searchStore.searchResults"
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
