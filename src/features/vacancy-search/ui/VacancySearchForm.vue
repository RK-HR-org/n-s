<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NForm, NFormItem, NInput, NSelect, NButton, NSpace, NDivider, NGrid, NFormItemGi, NInputNumber, NCard, NText, NTreeSelect, NCollapse, NCollapseItem, NDynamicInput, NIcon, NAutoComplete, NTooltip
} from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useDictionaryStore } from '@/entities/dictionary'
import {
  EXPERIENCE, VACANCY_EMPLOYMENT_FORM, VACANCY_WORK_SCHEDULE, VACANCY_WORK_FORMAT, VACANCY_WORKING_HOURS, VACANCY_LABEL, VACANCY_SEARCH_ORDER, CURRENCY_OPTIONS,
  DRIVER_LICENSE_TYPES, EDUCATION_LEVEL
} from '@/shared/constants/hhDictionaries'
import SparklesIcon from '@/shared/ui/icons/SparklesIcon.vue'
import { useVacancySearchStore } from '../model/useVacancySearchStore'
import { useUserStore } from '@/entities/user'
import { staticApi } from '@/shared/api'

const userStore = useUserStore()


const selectedTeamId = ref(userStore.user?.teams?.[0]?.id || userStore.user?.teams?.[0] || null)

// AI Prompt enrichment
const positivePrompt = ref('')
const negativePrompt = ref('')
const searchStore = useVacancySearchStore()

const handleEnrich = async () => {
  if (!positivePrompt.value && !negativePrompt.value) return
  try {
    const enriched = await searchStore.enrichFilters(
      positivePrompt.value, 
      negativePrompt.value,
      formModel.value as any,
      selectedTeamId.value || undefined
    )
    if (enriched) {
      Object.assign(formModel.value, enriched)
    }
  } catch (e) {
    console.error('Failed to enrich filters', e)
  }
}

// Dictionary store
const dictStore = useDictionaryStore()
const { areas, professionalRoles, isLoading } = storeToRefs(dictStore)

onMounted(() => {
  dictStore.fetchAll()
})

// Mappers for Naive UI TreeSelect
const areaOptions = computed(() => {
  const mapArea = (area: any): any => ({
    key: area.id,
    label: area.name,
    children: area.areas && area.areas.length > 0 ? area.areas.map(mapArea) : undefined
  })
  return areas.value.map(mapArea)
})

const roleOptions = computed(() => {
  return professionalRoles.value.map(cat => ({
    key: cat.id,
    label: cat.name,
    children: cat.roles.map(r => ({ key: r.id, label: r.name }))
  }))
})

// Full form model (from store)
const { draftFilters: formModel } = storeToRefs(searchStore)

// Vacancy text query: 'field' must be from TextQueryDTO enum (backend validates it)
// For vacancies we just use 'everywhere' — the scope (name/description) is set via searchField filter
const TEXT_QUERY_FIELDS = [
  { value: 'everywhere', label: 'Везде' },
  { value: 'title', label: 'В названии вакансии' },
  { value: 'experience_company', label: 'В компании' },
]

const TEXT_QUERY_LOGIC = [
  { value: 'all', label: 'Все слова' },
  { value: 'any', label: 'Любое из слов' },
  { value: 'phrase', label: 'Точная фраза' },
  { value: 'except', label: 'Исключить слова' }
]

const TEXT_QUERY_PERIODS = [
  { value: 'all_time', label: 'За все время' },
  { value: 'last_year', label: 'За последний год' },
  { value: 'last_three_years', label: 'За последние 3 года' },
  { value: 'last_six_years', label: 'За последние 6 лет' }
]

// Vacancy search field options (areas to search within)
const SEARCH_FIELD_OPTIONS = [
  { value: 'name', label: 'Название вакансии' },
  { value: 'company_name', label: 'Название компании' },
  { value: 'description', label: 'Описание вакансии' }
]

const onCreateTextQuery = () => {
  return {
    text: '',
    logic: 'all',
    field: 'everywhere',
    period: 'all_time'
  }
}

// Suggestions logic
const positionOptions = ref<{label: string, value: string}[]>([])
const keywordOptions = ref<{label: string, value: string}[]>([])
// Employer: stores {label: companyName, value: HH_employerId}
const employerOptions = ref<{label: string, value: string}[]>([])
// Selected employers: array of HH employer IDs (strings)
const selectedEmployerIds = ref<string[]>([])
let positionSuggestTimer: number | undefined
let keywordSuggestTimer: number | undefined
let employerSuggestTimer: number | undefined

const handlePositionSearch = (query: string) => {
  if (!query || query.length < 3) {
    positionOptions.value = []
    return
  }
  if (positionSuggestTimer) window.clearTimeout(positionSuggestTimer)
  positionSuggestTimer = window.setTimeout(async () => {
    try {
      const suggestions = await staticApi.getVacancyPositionsSuggestions(query)
      positionOptions.value = suggestions.map(s => ({ label: s, value: s }))
    } catch (e) {
      console.error('Failed to fetch suggestions', e)
      positionOptions.value = []
    }
  }, 250)
}

const handleKeywordSearch = (query: string) => {
  if (!query || query.length < 3) {
    keywordOptions.value = []
    return
  }
  if (keywordSuggestTimer) window.clearTimeout(keywordSuggestTimer)
  keywordSuggestTimer = window.setTimeout(async () => {
    try {
      const suggestions = await staticApi.getVacancyKeywordSuggestions(query)
      keywordOptions.value = suggestions.map(s => ({ label: s, value: s }))
    } catch (e) {
      console.error('Failed to fetch keyword suggestions', e)
      keywordOptions.value = []
    }
  }, 250)
}

const handleEmployerSearch = (query: string) => {
  if (!query || query.length < 2) {
    if (!selectedEmployerIds.value.length) employerOptions.value = []
    return
  }
  if (employerSuggestTimer) window.clearTimeout(employerSuggestTimer)
  employerSuggestTimer = window.setTimeout(async () => {
    try {
      const suggestions = await staticApi.getEmployerSuggestions(query)
      // Keep already-selected employers in options so selection is preserved
      const existing = employerOptions.value.filter(o => selectedEmployerIds.value.includes(o.value))
      const newOpts = suggestions.map(s => ({ label: s.text, value: s.id }))
      const merged = [...existing]
      for (const opt of newOpts) {
        if (!merged.find(m => m.value === opt.value)) merged.push(opt)
      }
      employerOptions.value = merged
    } catch (e) {
      console.error('Failed to fetch employer suggestions', e)
    }
  }, 250)
}

const handleSearch = async () => {
  try {
    console.log('Searching vacancies with model:', formModel.value)
    
    const raw = JSON.parse(JSON.stringify(formModel.value))
    const vacancyLabels = Array.isArray(raw.vacancyLabels) ? raw.vacancyLabels : null

    // Remove new vacancy UI fields not yet supported by the backend DTO
    delete raw.workFormat
    delete raw.employmentForm
    delete raw.workScheduleByDays
    delete raw.workingHours
    delete raw.vacancyLabels

    // Remove UI-only helpers
    delete raw.position
    delete raw.searchPeriod

    // Build clean filters: only include fields with actual values
    const filters: Record<string, any> = {}

    // Handle Search Period -> period (days)
    if (formModel.value.searchPeriod) {
      filters.period = formModel.value.searchPeriod
    }

    // Text queries: collect non-empty ones + position phrase
    const textQueries: any[] = (raw.textQueries || []).filter((q: any) => q.text?.trim())
    if (formModel.value.position?.trim()) {
      textQueries.push({
        text: formModel.value.position.trim(),
        logic: 'phrase',
        field: 'title',
        period: 'all_time'
      })
    }
    if (textQueries.length > 0) {
      filters.textQueries = textQueries
    }

    // Areas: numeric array
    if (Array.isArray(raw.areas) && raw.areas.length > 0) {
      filters.areas = raw.areas.map(Number)
    }

    // Metro: accept string or array, coerce to number[]
    if (raw.metro) {
      const metroArr = Array.isArray(raw.metro) ? raw.metro : [raw.metro]
      const metroNums = metroArr.map(Number).filter((n: number) => !isNaN(n))
      if (metroNums.length > 0) filters.metro = metroNums
    }

    // Salary — only include currency if there's at least one salary bound
    if (raw.salaryFrom) filters.salaryFrom = raw.salaryFrom
    if (raw.salaryTo) filters.salaryTo = raw.salaryTo
    if ((filters.salaryFrom || filters.salaryTo) && raw.currency) {
      filters.currency = raw.currency
    }

    // Simple array/string fields — only include if non-empty
    const arrayFields = [
      'experience', 'educationLevels', 'driverLicenseTypes',
      'professionalRole', 'searchField'
    ] as const
    for (const key of arrayFields) {
      const val = raw[key]
      if (Array.isArray(val) && val.length > 0) {
        filters[key] = val
      }
    }

    // Employer IDs — from the dedicated selectedEmployerIds ref (actual HH company IDs)
    if (Array.isArray(selectedEmployerIds.value) && selectedEmployerIds.value.length > 0) {
      filters.employerIds = selectedEmployerIds.value.filter(id => id && /^\d+$/.test(id))
      if (filters.employerIds.length === 0) delete filters.employerIds
    }

    // Date fields
    if (raw.dateFrom) filters.dateFrom = raw.dateFrom
    if (raw.dateTo) filters.dateTo = raw.dateTo

    // Ordering
    if (raw.orderBy) filters.orderBy = raw.orderBy

    // Pagination
    filters.page = 0
    filters.perPage = 20

    if (!selectedTeamId.value) {
      console.error('Team not selected')
    }

    console.log('Vacancy search payload:', filters)
    await searchStore.submitSearch(filters as any, selectedTeamId.value || undefined, vacancyLabels)
  } catch (e) {
    console.error('Search initiation failed', e)
  }
}
</script>

<template>
  <n-card bordered :content-style="{ padding: '16px' }">
    <n-space vertical size="large">
      

      <!-- AI Enrichment Section -->
      <n-tooltip trigger="hover" placement="top">
        <template #trigger>
          <div style="width: 100%;">
            <n-collapse>
              <n-collapse-item name="ai-search" disabled>
                <template #header>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <n-icon :component="SparklesIcon" size="20" color="#F74C00" />
                    <span style="color: var(--n-text-color-disabled);">Умный поиск (AI)</span>
                  </div>
                </template>
                <n-grid :cols="1" y-gap="12">
                  <n-form-itemGi label="Опишите, какую вакансию вы ищете (Позитивный промпт)">
                    <n-input
                      v-model:value="positivePrompt"
                      type="textarea"
                      placeholder="Например:   из Нижнего Новгорода, зп от 30 до 80 тыс руб, опыт работы от 1 года до 3 лет, удаленка"
                      disabled
                    />
                  </n-form-itemGi>
                  <n-form-itemGi label="Чего НЕ должно быть (Негативный промпт)">
                    <n-input
                      v-model:value="negativePrompt"
                      type="textarea"
                      placeholder="Например: не стажировка, не в офисе"
                      disabled
                    />
                  </n-form-itemGi>
                </n-grid>
                <n-button type="info" secondary block style="margin-top: 12px;" @click="handleEnrich" :loading="searchStore.isEnriching" disabled>
                  Автозаполнение фильтров с помощью AI
                </n-button>
              </n-collapse-item>
            </n-collapse>
          </div>
        </template>
        Функция в разработке
      </n-tooltip>

      <n-divider style="margin: 12px 0;" />

      <!-- Manual Form Section -->
      <n-form :model="formModel" @submit.prevent="handleSearch">
        <n-text depth="3" style="margin-bottom: 8px; display: block;">Ручные фильтры поиска вакансий</n-text>

        <n-space vertical>
          <!-- Position Field and Search Period -->
          <n-grid :cols="4" x-gap="12">
            <n-form-itemGi :span="3" label="Должность (Искать в названии вакансии по точной фразе за все время)">
              <n-auto-complete
                v-model:value="formModel.position"
                :options="positionOptions"
                placeholder="Например: Frontend-разработчик"
                clearable
                @update:value="handlePositionSearch"
              />
            </n-form-itemGi>
            <n-form-itemGi :span="1" label="Период публикации">
              <n-input-number
                status="warning"
                v-model:value="formModel.searchPeriod"
                placeholder="Дней"
                clearable
                :min="1"
                :max="365"
              />
            </n-form-itemGi>
          </n-grid>

          <!-- Keywords / Text Queries -->
          <n-form-item label="Ключевые слова и параметры текстового поиска">
            <n-dynamic-input
              v-model:value="formModel.textQueries"
              :on-create="onCreateTextQuery"
            >
              <template #create-button-default>
                Добавить условие поиска
              </template>
              <template #default="{ value }">
                <n-space vertical style="width: 100%; border: 1px solid var(--n-border-color); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                  <n-auto-complete
                    v-model:value="value.text"
                    placeholder="Введите ключевые слова..."
                    :options="keywordOptions"
                    clearable
                    @update:value="handleKeywordSearch"
                  />
                  <n-grid :cols="3" x-gap="12">
                    <n-form-itemGi label="Где искать?" :show-feedback="false">
                      <n-select v-model:value="value.field" :options="TEXT_QUERY_FIELDS" />
                    </n-form-itemGi>
                    <n-form-itemGi label="Условие" :show-feedback="false">
                      <n-select v-model:value="value.logic" :options="TEXT_QUERY_LOGIC" />
                    </n-form-itemGi>
                    <n-form-itemGi label="Период" :show-feedback="false">
                      <n-select v-model:value="value.period" :options="TEXT_QUERY_PERIODS" />
                    </n-form-itemGi>
                  </n-grid>
                </n-space>
              </template>
            </n-dynamic-input>
          </n-form-item>

          <!-- Geography -->
          <n-grid :cols="2" x-gap="12">
            <n-form-itemGi label="Регион">
              <n-tree-select
                v-model:value="formModel.areas"
                :options="areaOptions"
                multiple
                cascade
                checkable
                filterable
                clearable
                placeholder="Выберите регионы"
              />
            </n-form-itemGi>
            <n-form-itemGi label="Работодатели (поиск по названию компании)">
              <n-select
                status="warning"
                v-model:value="selectedEmployerIds"
                multiple
                filterable
                clearable
                remote
                :options="employerOptions"
                placeholder="Начните вводить название компании..."
                :loading="false"
                @search="handleEmployerSearch"
              />
            </n-form-itemGi>
          </n-grid>

          <!-- Salary -->
          <n-grid :cols="3" x-gap="12">
            <n-form-itemGi label="Валюта">
              <n-select v-model:value="formModel.currency" :options="CURRENCY_OPTIONS" />
            </n-form-itemGi>
            <n-form-itemGi label="Зарплата от">
              <n-input-number v-model:value="formModel.salaryFrom" clearable />
            </n-form-itemGi>
            <n-form-itemGi label="Зарплата до">
              <n-input-number v-model:value="formModel.salaryTo" clearable />
            </n-form-itemGi>
          </n-grid>

          <!-- Employment & Schedule -->
          <n-grid :cols="4" x-gap="12">
            <n-form-itemGi label="Опыт работы">
              <n-select v-model:value="formModel.experience" :options="EXPERIENCE" multiple clearable />
            </n-form-itemGi>
            <n-form-itemGi label="Формат работы">
              <n-select v-model:value="formModel.workFormat" :options="VACANCY_WORK_FORMAT" multiple clearable />
            </n-form-itemGi>
            <n-form-itemGi label="Тип занятости">
              <n-select v-model:value="formModel.employmentForm" :options="VACANCY_EMPLOYMENT_FORM" multiple clearable />
            </n-form-itemGi>
            <n-form-itemGi label="График работы">
              <n-select v-model:value="formModel.workScheduleByDays" :options="VACANCY_WORK_SCHEDULE" multiple clearable />
            </n-form-itemGi>
          </n-grid>

          <!-- Extra Work Filters and Labels -->
          <n-grid :cols="2" x-gap="12">
            <n-form-itemGi label="Подработка / Рабочие часы">
              <n-select v-model:value="formModel.workingHours" :options="VACANCY_WORKING_HOURS" multiple clearable />
            </n-form-itemGi>
            <n-form-itemGi label="Метки вакансий">
              <n-select v-model:value="formModel.vacancyLabels" :options="VACANCY_LABEL" multiple clearable />
            </n-form-itemGi>
          </n-grid>

          <!-- Expander for Additional Filters -->
          <n-collapse>
            <n-collapse-item title="Дополнительные фильтры" name="1">
              
              <n-form-item label="Профессиональная роль">
                <n-tree-select
                  v-model:value="formModel.professionalRole"
                  :options="roleOptions"
                  multiple
                  cascade
                  checkable
                  filterable
                  clearable
                  placeholder="Выберите роли"
                />
              </n-form-item>

              <!-- Location & Travel -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Местоположение</n-text>
              <n-grid :cols="1" x-gap="12">
                <n-form-itemGi label="Станция метро (название или ID)">
                  <n-input v-model:value="formModel.metro" placeholder="Ветка или станция..." />
                </n-form-itemGi>
              </n-grid>

              <!-- Education -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Образование</n-text>
              <n-form-item label="Уровень образования">
                <n-select v-model:value="formModel.educationLevels" :options="EDUCATION_LEVEL" multiple clearable />
              </n-form-item>

              <!-- Search Field -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Области поиска</n-text>
              <n-form-item label="Области поиска в вакансиях">
                <n-select v-model:value="formModel.searchField" :options="SEARCH_FIELD_OPTIONS" multiple clearable placeholder="Где искать по тексту" />
              </n-form-item>

              <!-- Other Filters -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Автомобиль / Права</n-text>
              <n-grid :cols="1" x-gap="12">
                <n-form-itemGi label="Категории прав">
                  <n-select v-model:value="formModel.driverLicenseTypes" :options="DRIVER_LICENSE_TYPES" multiple clearable />
                </n-form-itemGi>
              </n-grid>

            </n-collapse-item>
          </n-collapse>

          <!-- Sorting -->
          <n-form-item label="Сортировка" style="margin-top: 12px;">
            <n-select v-model:value="formModel.orderBy" :options="VACANCY_SEARCH_ORDER" />
          </n-form-item>

          <n-button type="primary" block attr-type="submit" size="large" :loading="searchStore.isLoading">
            Найти вакансии
          </n-button>
        </n-space>
      </n-form>
    </n-space>
  </n-card>
</template>
