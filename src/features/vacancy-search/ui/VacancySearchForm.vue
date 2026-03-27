<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NForm, NFormItem, NInput, NSelect, NButton, NSpace, NDivider, NGrid, NFormItemGi, NInputNumber, NCard, NText, NTreeSelect, NCollapse, NCollapseItem, NDynamicInput, NIcon, NAutoComplete, NTooltip, useMessage
} from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useDictionaryStore } from '@/entities/dictionary'
import {
  EXPERIENCE, VACANCY_EMPLOYMENT_FORM, VACANCY_WORK_SCHEDULE, VACANCY_WORK_FORMAT, VACANCY_WORKING_HOURS, VACANCY_LABEL, VACANCY_SEARCH_ORDER, CURRENCY_OPTIONS,
  DRIVER_LICENSE_TYPES, EDUCATION_LEVEL
} from '@/shared/constants/hhDictionaries'
import SparklesIcon from '@/shared/ui/icons/SparklesIcon.vue'
import InfoIcon from '@/shared/ui/icons/InfoIcon.vue'
import { useVacancySearchStore } from '../model/useVacancySearchStore'
import { useUserStore } from '@/entities/user'
import { staticApi } from '@/shared/api'

const userStore = useUserStore()
const message = useMessage()


const selectedTeamId = ref(userStore.user?.teams?.[0]?.id || userStore.user?.teams?.[0] || null)

// AI Prompt enrichment
const positivePrompt = ref('')
const negativePrompt = ref('')
const searchStore = useVacancySearchStore()

import LogicTreeIcon from '@/shared/ui/icons/LogicTreeIcon.vue'
import { HHQueryBuilderModal } from '@/features/hh-query-builder'

const showQueryBuilder = ref(false)

const handleQuerySubmit = (query: string) => {
  if (formModel.value) {
    formModel.value.text = query
  }
}

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
      const mapped: any = { ...enriched }
      
      // text_queries -> text (vacancies search uses a single text string mostly)
      let textStrings: string[] = []
      let excludeStrings: string[] = []

      if (mapped.text_queries && mapped.text_queries.length > 0) {
        // Construct string from text queries for vacancy search which only accepts one `text` string out of the box
        mapped.text_queries.forEach((q: any) => {
          let t = q.text || ''
          if (q.exact) t = `!${t}`
          
          if (q.logic === 'except') excludeStrings.push(t)
          else textStrings.push(t)
        })
        delete mapped.text_queries
      }

      if (mapped.keywords_include) {
        textStrings.push(...mapped.keywords_include)
        delete mapped.keywords_include
      }
      if (mapped.skills) {
        textStrings.push(...mapped.skills)
        delete mapped.skills
      }
      if (mapped.keywords_exclude) {
        excludeStrings.push(...mapped.keywords_exclude)
        delete mapped.keywords_exclude
      }

      if (textStrings.length > 0) {
        mapped.text = [...(formModel.value?.text ? [formModel.value.text] : []), ...textStrings].join(' ')
      }
      if (excludeStrings.length > 0) {
        mapped.excluded_text = [...(formModel.value?.excluded_text ? [formModel.value.excluded_text] : []), ...excludeStrings].join(' ')
      }

      // Helper to find area ID by name
      const findAreaIdByName = (areas: any[], name: string): number | null => {
        for (const area of areas) {
          if (area.name.toLowerCase() === name.toLowerCase()) return Number(area.id)
          if (area.areas && area.areas.length > 0) {
            const found = findAreaIdByName(area.areas, name)
            if (found !== null) return found
          }
        }
        return null
      }

      // areas
      if (mapped.location) {
        if (mapped.location.area_id) {
          mapped.areas = [mapped.location.area_id]
        } else if (mapped.location.area_name) {
          const foundId = findAreaIdByName(dictStore.areas, mapped.location.area_name)
          if (foundId) mapped.areas = [foundId]
        }
        delete mapped.location
      }

      // salary mapping
      if (mapped.salary) {
        if (mapped.salary.salary_from) mapped.salary = mapped.salary.salary_from
        else if (mapped.salary.salary_to) mapped.salary = mapped.salary.salary_to
        
        if (mapped.salary.currency) mapped.currency = mapped.salary.currency
        
        if (mapped.salary.only_with_salary) {
          if (!mapped.vacancyLabels) mapped.vacancyLabels = []
          if (!mapped.vacancyLabels.includes('with_salary')) {
            mapped.vacancyLabels.push('with_salary')
          }
        }
        delete mapped.salary
      }

      // experience mapping
      if (mapped.experience) {
        if (mapped.experience.hh_experience_id) {
          mapped.experience = [mapped.experience.hh_experience_id]
        } else {
          delete mapped.experience
        }
      }

      if (mapped.gender === null) delete mapped.gender
      if (mapped.age) delete mapped.age // not supported natively by vacancy search at the root, mostly
      if (mapped.schedule && mapped.schedule.length === 0) delete mapped.schedule
      if (mapped.employment && mapped.employment.length === 0) delete mapped.employment

      Object.assign(formModel.value, mapped)
      const importedKeys = Object.keys(mapped).filter(k => Array.isArray(mapped[k]) ? mapped[k].length > 0 : !!mapped[k])
      if (importedKeys.length) {
          message.success('Фильтры успешно заполнены AI')
      } else {
          message.info('AI не вернул фильтры')
      }
    }
  } catch (e) {
    console.error('Failed to enrich filters', e)
    message.error('Ошибка при генерации фильтров')
  }
}

// Dictionary store
const dictStore = useDictionaryStore()
const { areas, professionalRoles, industries, isLoading } = storeToRefs(dictStore)

onMounted(() => {
  dictStore.fetchAll()
})

// Mappers for Naive UI TreeSelect
const areaOptions = ref<{label: string, value: string}[]>([])
const isAreaLoading = ref(false)
let areaSuggestTimer: number | undefined

const handleAreaSearch = (query: string) => {
  if (!query || query.trim().length === 0) {
     areaOptions.value = areaOptions.value.filter(opt => formModel.value.areas?.includes(opt.value))
     return
  }

  isAreaLoading.value = true
  if (areaSuggestTimer) window.clearTimeout(areaSuggestTimer)

  areaSuggestTimer = window.setTimeout(async () => {
    try {
      const suggestions = await staticApi.getAreaSuggestions(query)
      const newOpts = suggestions.map(s => ({ label: s.text, value: s.id }))

      const currentSelected = areaOptions.value.filter(opt => formModel.value.areas?.includes(opt.value))

      const merged = [...currentSelected]
      newOpts.forEach(n => {
          if (!merged.find(m => m.value === n.value)) {
              merged.push(n)
          }
      })
      areaOptions.value = merged
    } catch (e) {
      console.error('Failed to fetch area suggestions', e)
    } finally {
      isAreaLoading.value = false
    }
  }, 300)
}

const roleOptions = computed(() => {
  return professionalRoles.value.map(cat => ({
    key: cat.id,
    label: cat.name,
    children: cat.roles.map(r => ({ key: r.id, label: r.name }))
  }))
})

const industryOptions = computed(() => {
  return industries.value.map(ind => ({
    value: ind.id,
    label: ind.name,
  }))
})

// Full form model (from store)
const { draftFilters: formModel } = storeToRefs(searchStore)

// Vacancy search field options (areas to search within)
const SEARCH_FIELD_OPTIONS = [
  { value: 'name', label: 'Название вакансии' },
  { value: 'company_name', label: 'Название компании' },
  { value: 'description', label: 'Описание вакансии' }
]

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
  if (!query || query.length < 2) {
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

    // Build clean filters: only include fields with actual values
    const filters: Record<string, any> = {}

    // Handle Search Period -> period (days)
    if (formModel.value.searchPeriod) {
      filters.period = formModel.value.searchPeriod
    }

    // Advanced text search fields
    const textParts = []
    if (formModel.value.position?.trim()) {
      textParts.push(`"${formModel.value.position.trim()}"`)
    }
    if (formModel.value.text?.trim()) {
      textParts.push(formModel.value.text.trim())
    }
    if (textParts.length > 0) {
      filters.text = textParts.join(' ')
    }

    if (formModel.value.excluded_text?.trim()) {
      filters.excluded_text = formModel.value.excluded_text.trim()
    }

    // Areas: numeric array
    if (Array.isArray(raw.areas) && raw.areas.length > 0) {
      filters.areas = raw.areas.map(Number)
    }

    // Salary — HH vacancies API expects single `salary` + `currency`
    if (raw.salary) {
      filters.salary = raw.salary
      if (raw.currency) {
        filters.currency = raw.currency
      }
    }

    if (Array.isArray(raw.search_field) && raw.search_field.length > 0) filters.search_field = raw.search_field
    if (Array.isArray(raw.experience) && raw.experience.length > 0) filters.experience = raw.experience
    if (Array.isArray(raw.educationLevels) && raw.educationLevels.length > 0) filters.education = raw.educationLevels
    if (Array.isArray(raw.professionalRole) && raw.professionalRole.length > 0) filters.professional_role = raw.professionalRole.map(Number).filter((v: number) => !isNaN(v))
    if (Array.isArray(raw.industry) && raw.industry.length > 0) filters.industry = raw.industry
    if (Array.isArray(raw.employmentForm) && raw.employmentForm.length > 0) filters.employment_form = raw.employmentForm
    if (Array.isArray(raw.workScheduleByDays) && raw.workScheduleByDays.length > 0) filters.work_schedule_by_days = raw.workScheduleByDays
    if (Array.isArray(raw.workingHours) && raw.workingHours.length > 0) filters.working_hours = raw.workingHours
    if (Array.isArray(raw.workFormat) && raw.workFormat.length > 0) filters.work_format = raw.workFormat
    if (Array.isArray(raw.driverLicenseTypes) && raw.driverLicenseTypes.length > 0) filters.driver_license_types = raw.driverLicenseTypes

    // Labels
    if (Array.isArray(raw.vacancyLabels) && raw.vacancyLabels.length > 0) {
      filters.label = raw.vacancyLabels
    }

    // Employer IDs
    if (Array.isArray(selectedEmployerIds.value) && selectedEmployerIds.value.length > 0) {
      const eIds = selectedEmployerIds.value.filter(id => id && /^\d+$/.test(id))
      if (eIds.length > 0) filters.employer_id = eIds
    }

    // Date fields
    if (raw.dateFrom) filters.date_from = raw.dateFrom
    if (raw.dateTo) filters.date_to = raw.dateTo

    // Ordering
    if (raw.orderBy) filters.order_by = raw.orderBy

    // Pagination
    filters.page = 0
    filters.per_page = 20

    if (!selectedTeamId.value) {
      console.error('Team not selected')
    }

    console.log('Vacancy search filters:', filters)
    const sessionId = await searchStore.submitSearch(filters as any, selectedTeamId.value || undefined, vacancyLabels)
    if (sessionId) {
      message.success('Поиск успешно запущен')
    }
  } catch (e: any) {
    console.error('Search initiation failed:', e)
    const errorText = e.message || 'Неизвестная ошибка'
    message.error(`Ошибка при запуске поиска: ${errorText}`)
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
              <n-collapse-item name="ai-search">
                <template #header>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <n-icon :component="SparklesIcon" size="20" color="#F74C00" />
                    <span>Заполнить с помощью ИИ</span>
                  </div>
                </template>
                <n-grid :cols="1" y-gap="12">
                  <n-form-itemGi label="Опишите, кто вам нужен (Позитивный промпт)">
                    <n-input
                      v-model:value="positivePrompt"
                      type="textarea"
                      placeholder="Например: Бухгалтер-кассир"
                    />
                  </n-form-itemGi>
                  <n-form-itemGi label="Опишите, кто вам НЕ нужен (Негативный промпт)">
                    <n-input
                      v-model:value="negativePrompt"
                      type="textarea"
                      placeholder="Например: без удаленки, не джуниор"
                    />
                  </n-form-itemGi>
                </n-grid>
                <n-button type="info" secondary block style="margin-top: 12px;" @click="handleEnrich" :loading="searchStore.isEnriching" :disabled="!positivePrompt && !negativePrompt">
                  Заполнить с помощью ИИ
                </n-button>
              </n-collapse-item>
            </n-collapse>
          </div>
        </template>
        Функция в разработке. Пожалуйста, предварительно проверяйте заполненную форму перед запуском поиска.
      </n-tooltip>

      <n-divider style="margin: 12px 0;" />

      <!-- Manual Form Section -->
      <n-form :model="formModel" @submit.prevent="handleSearch">
        <n-text depth="3" style="margin-bottom: 8px; display: block;">Ручные фильтры поиска вакансий</n-text>

        <n-space vertical>
          <!-- Position Field and Search Period -->
          <n-grid :cols="4" x-gap="12">
            <n-form-itemGi :span="2">
              <template #label>
                <div style="display: flex; align-items: center; gap: 4px;">
                  Период публикации вакансии
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-icon :component="InfoIcon" color="#50b5d6" style="cursor: pointer;" />
                    </template>
                    Количество дней (от 1 до 365), за которое необходимо выполнить поиск вакансий от текущей даты
                  </n-tooltip>
                </div>
              </template>
              <n-input-number
                v-model:value="formModel.searchPeriod"
                placeholder="Дней"
                clearable
                :min="1"
                :max="365"
              />
            </n-form-itemGi>
            <n-form-itemGi :span="2" label="Метки вакансий">
              <n-select v-model:value="formModel.vacancyLabels" :options="VACANCY_LABEL" multiple clearable />
            </n-form-itemGi>
          </n-grid>

          <!-- Keywords / Text Queries -->
          <n-form-item label="Ключевые слова и параметры текстового поиска">
            <n-grid :cols="3" x-gap="12">
              <n-form-itemGi :show-feedback="false">
                <template #label>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    Ключевые слова
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-icon :component="LogicTreeIcon" color="#50b5d6" style="cursor: pointer;" @click="showQueryBuilder = true" />
                      </template>
                      Конструктор сложных логических запросов
                    </n-tooltip>
                  </div>
                </template>
                <div style="display: flex; width: 100%;">
                  <n-auto-complete
                    v-model:value="formModel.text"
                    placeholder="Например: Бухгалтер-кассир"
                    :options="keywordOptions"
                    clearable
                    @update:value="handleKeywordSearch"
                  />
                </div>
              </n-form-itemGi>
              <n-form-itemGi label="Где искать?" :show-feedback="false">
                <n-select v-model:value="formModel.search_field" :options="SEARCH_FIELD_OPTIONS" multiple clearable placeholder="Во всех полях" />
              </n-form-itemGi>
              <n-form-itemGi label="Исключить слова" :show-feedback="false">
                <n-input
                  v-model:value="formModel.excluded_text"
                  placeholder="Слова через запятую"
                  clearable
                />
              </n-form-itemGi>
            </n-grid>
          </n-form-item>

          <!-- Geography -->
          <n-grid :cols="2" x-gap="12">
            <n-form-itemGi label="Регион">
              <n-select
                v-model:value="formModel.areas"
                multiple
                filterable
                remote
                clearable
                placeholder="Введите регион для поиска..."
                :options="areaOptions"
                :loading="isAreaLoading"
                @search="handleAreaSearch"
                :fallback-option="(value) => ({ label: 'Регион ' + value, value })"
              />
            </n-form-itemGi>
            <n-form-itemGi label="Работодатели (поиск по названию компании)">
              <n-select
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
            <n-form-itemGi label="Зарплата">
              <n-input-number v-model:value="formModel.salary" clearable />
            </n-form-itemGi>
            <n-form-itemGi label="Валюта">
              <n-select v-model:value="formModel.currency" :options="CURRENCY_OPTIONS" />
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
          <!-- <n-grid :cols="2" x-gap="12">
            <n-form-itemGi label="Подработка / Рабочие часы">
              <n-select v-model:value="formModel.workingHours" :options="VACANCY_WORKING_HOURS" multiple clearable />
            </n-form-itemGi>
          </n-grid> -->

          <!-- Expander for Additional Filters -->
          <n-collapse>
            <n-collapse-item title="Дополнительные фильтры" name="1">
              
              <!-- <n-form-item label="Профессиональная роль">
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
              </n-form-item> -->

              <!-- Company & Industry -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Компания</n-text>
              <n-form-item label="Отрасль компании">
                <n-select
                  v-model:value="formModel.industry"
                  :options="industryOptions"
                  multiple
                  clearable
                  placeholder="Выберите отрасли"
                />
              </n-form-item>

              <!-- Education -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Образование</n-text>
              <n-form-item label="Уровень образования">
                <n-select v-model:value="formModel.educationLevels" :options="EDUCATION_LEVEL" multiple clearable />
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

  <HHQueryBuilderModal :show="showQueryBuilder" @update:show="val => showQueryBuilder = val" :initial-query="formModel.text" @submit="handleQuerySubmit" />
</template>
