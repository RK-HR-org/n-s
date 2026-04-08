<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NForm, NFormItem, NInput, NSelect, NButton, NSpace, NDivider, NGrid, NFormItemGi, NInputNumber, NCard, NText, NTreeSelect, NDatePicker, NCollapse, NCollapseItem, NDynamicInput, NIcon, NAutoComplete, NTooltip, useMessage
} from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useDictionaryStore } from '@/entities/dictionary'
import {
  EDUCATION_LEVEL, EXPERIENCE, EMPLOYMENT, SCHEDULE, GENDER, RESUME_SEARCH_ORDER, CURRENCY_OPTIONS,
  RESUME_SEARCH_RELOCATION, BUSINESS_TRIP_READINESS, DRIVER_LICENSE_TYPES, JOB_SEARCH_STATUSES_APPLICANT, RESUME_SEARCH_LABEL, FILTER_EXP_PERIOD
} from '@/shared/constants/hhDictionaries'
import SparklesIcon from '@/shared/ui/icons/SparklesIcon.vue'
import { useSearchStore } from '../model/useSearchStore'
import { useUserStore } from '@/entities/user'
import { staticApi } from '@/shared/api'

const userStore = useUserStore()
const message = useMessage()

const selectedTeamId = ref(userStore.user?.teams?.[0]?.id || userStore.user?.teams?.[0] || null)

// AI Prompt enrichment
const positivePrompt = ref('')
const negativePrompt = ref('')
const searchStore = useSearchStore()

import LogicTreeIcon from '@/shared/ui/icons/LogicTreeIcon.vue'
import { HHQueryBuilderModal } from '@/features/hh-query-builder'

const showQueryBuilder = ref(false)
const activeTextQueryRef = ref<any>(null)

const openQueryBuilder = (queryObj: any) => {
  activeTextQueryRef.value = queryObj
  showQueryBuilder.value = true
}

const handleQuerySubmit = (query: string) => {
  if (activeTextQueryRef.value) {
    activeTextQueryRef.value.text = query
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
      // Map enriched values back to formModel
      const mapped: any = { ...enriched }
      
      // Map text_queries to textQueries
      const newTextQueries: any[] = []

      if (mapped.text_queries) {
        mapped.text_queries.forEach((q: any) => {
          newTextQueries.push({
            text: q.text || '',
            logic: q.logic || 'all',
            field: q.field || 'everywhere',
            period: q.period || 'all_time'
          })
        })
        delete mapped.text_queries
      }

      if (mapped.keywords_include) {
        mapped.keywords_include.forEach((k: string) => {
          newTextQueries.push({ text: k, logic: 'all', field: 'everywhere', period: 'all_time' })
        })
        delete mapped.keywords_include
      }

      if (mapped.keywords_exclude) {
        mapped.keywords_exclude.forEach((k: string) => {
          newTextQueries.push({ text: k, logic: 'except', field: 'everywhere', period: 'all_time' })
        })
        delete mapped.keywords_exclude
      }

      if (mapped.skills) {
        mapped.skills.forEach((s: string) => {
          newTextQueries.push({ text: s, logic: 'all', field: 'skills', period: 'all_time' })
        })
        delete mapped.skills
      }

      if (newTextQueries.length > 0) {
        mapped.textQueries = newTextQueries
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

      // Map location/area handling
      if (mapped.location) {
        if (mapped.location.area_id) {
          mapped.areas = [mapped.location.area_id]
        } else if (mapped.location.area_name) {
          const foundId = findAreaIdByName(dictStore.areas, mapped.location.area_name)
          if (foundId) mapped.areas = [foundId]
        }
        delete mapped.location
      }

      // Keep salary formatting
      if (mapped.salary) {
        if (mapped.salary.salary_from) mapped.salaryFrom = mapped.salary.salary_from
        if (mapped.salary.salary_to) mapped.salaryTo = mapped.salary.salary_to
        if (mapped.salary.currency) mapped.currency = mapped.salary.currency
        // mapped.salary.only_with_salary is handled natively if there was a checkbox, but currently omitted in resumes
        delete mapped.salary
      }

      if (mapped.experience) {
        if (mapped.experience.hh_experience_id) {
          mapped.experience = [mapped.experience.hh_experience_id]
        } else {
          delete mapped.experience
        }
      }

      if (mapped.age) {
        if (mapped.age.age_from) mapped.ageFrom = mapped.age.age_from
        if (mapped.age.age_to) mapped.ageTo = mapped.age.age_to
        delete mapped.age
      }

      if (mapped.gender === null) delete mapped.gender
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

const industryOptions = computed(() => {
  return industries.value.map((i: any) => ({ 
    label: i.name, 
    key: i.id,
    children: i.industries && i.industries.length > 0
      ? i.industries.map((sub: any) => ({
          label: sub.name,
          key: sub.id
        }))
      : undefined
  }))
})

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

// Full form model (from store)
const { draftFilters: formModel } = storeToRefs(searchStore)

const TEXT_QUERY_FIELDS = [
  { value: 'everywhere', label: 'Везде' },
  { value: 'title', label: 'В названии резюме' },
  { value: 'education', label: 'В образовании' },
  { value: 'experience', label: 'В опыте работы' },
  { value: 'experience_company', label: 'В названии компании' },
  { value: 'experience_position', label: 'В должности' },
  { value: 'experience_description', label: 'В описании опыта' },
  { value: 'skills', label: 'В навыках' }
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

// Check if industry is selected
const isIndustrySelected = computed(() => {
  return formModel.value.filterExpIndustry && formModel.value.filterExpIndustry.length > 0
})

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
let positionSuggestTimer: number | undefined
let keywordSuggestTimer: number | undefined

const handlePositionSearch = async (query: string) => {
  if (!query || query.length < 3) {
    positionOptions.value = []
    return
  }
  if (positionSuggestTimer) window.clearTimeout(positionSuggestTimer)
  positionSuggestTimer = window.setTimeout(async () => {
  try {
    const suggestions = await staticApi.getPositionsSuggestions(query)
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
      const suggestions = await staticApi.getResumeKeywordSuggestions(query)
      keywordOptions.value = suggestions.map(s => ({ label: s, value: s }))
    } catch (e) {
      console.error('Failed to fetch keyword suggestions', e)
      keywordOptions.value = []
    }
  }, 250)
}

const handleSearch = async () => {
  try {
    console.log('Searching with model:', formModel.value)
    
    // Convert reactive form state to raw DTO
    // Note: in a real app you might need more complex mapping (e.g. area mapping)
    const filters = JSON.parse(JSON.stringify(formModel.value))
    
    // Default pagination settings if not set
    filters.page = 0
    filters.perPage = 20
    
    // Remove empty text queries
    filters.textQueries = filters.textQueries.filter((q: any) => q.text.trim() !== '')

    // Handle Search Period
    if (filters.searchPeriod) {
      filters.period = filters.searchPeriod
    }
    delete filters.searchPeriod

    // Handle position
    if (filters.position && filters.position.trim() !== '') {
      filters.textQueries.push({
        text: filters.position.trim(),
        logic: 'phrase',
        field: 'title',
        period: 'all_time'
      })
    }
    delete filters.position

    if (filters.textQueries.length === 0) {
       delete filters.textQueries
    }

    if (!selectedTeamId.value) {
        console.error('Team not selected')
        // In reality, we should show a UI notification here
    }

    await searchStore.submitSearch(filters, selectedTeamId.value || undefined)
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
        <n-text depth="3" style="margin-bottom: 8px; display: block;">Ручные фильтры поиска</n-text>

        <n-space vertical>
          <!-- Position Field and Search Period -->
          <n-grid :cols="4" x-gap="12">
            <n-form-itemGi :span="3" label="Должность (Искать в названии резюме по точной фразе за все время)">
              <n-auto-complete
                v-model:value="formModel.position"
                :options="positionOptions"
                placeholder="Например: Frontend-разработчик"
                clearable
                @update:value="handlePositionSearch"
              />
            </n-form-itemGi>
            <n-form-itemGi :span="1" label="Период обновления">
              <n-input-number
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
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <n-auto-complete
                      v-model:value="value.text"
                      placeholder="Введите ключевые слова..."
                      :options="keywordOptions"
                      clearable
                      @update:value="handleKeywordSearch"
                      style="flex: 1;"
                    />
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-button circle tertiary @click="openQueryBuilder(value)">
                          <template #icon><n-icon :component="LogicTreeIcon" color="#50b5d6" /></template>
                        </n-button>
                      </template>
                      Конструктор сложных логических запросов
                    </n-tooltip>
                  </div>
                  <n-grid :cols="3" x-gap="12">
                    <n-form-itemGi label="Где искать?" :show-feedback="false">
                      <n-select v-model:value="value.field" :options="TEXT_QUERY_FIELDS" />
                    </n-form-itemGi>
                    <n-form-itemGi label="Условие" :show-feedback="false">
                      <n-select v-model:value="value.logic" :options="TEXT_QUERY_LOGIC" />
                    </n-form-itemGi>
                    <n-form-itemGi label="Период" :show-feedback="false">
                      <n-select v-model:value="value.period" :options="TEXT_QUERY_PERIODS" :disabled="value.field === 'title'" />
                    </n-form-itemGi>
                  </n-grid>
                </n-space>
              </template>
            </n-dynamic-input>
          </n-form-item>

          <!-- Geography & Roles (from Dict Store) -->
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
            <n-form-itemGi label="Метки">
              <n-select
                v-model:value="formModel.labels" :options="RESUME_SEARCH_LABEL" multiple clearable placeholder="Например, только с фото" />
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
          <n-grid :cols="3" x-gap="12">
            <n-form-itemGi label="Опыт работы">
              <n-select v-model:value="formModel.experience" :options="EXPERIENCE" multiple clearable />
            </n-form-itemGi>
            <n-form-itemGi label="Тип занятости">
              <n-select v-model:value="formModel.employment" :options="EMPLOYMENT" multiple clearable />
            </n-form-itemGi>
            <n-form-itemGi label="График работы">
              <n-select v-model:value="formModel.schedule" :options="SCHEDULE" multiple clearable />
            </n-form-itemGi>
          </n-grid>
          <n-grid :cols="2" x-gap="12">
            <n-form-itemGi label="Опыт в отрасли">
              <n-tree-select v-model:value="formModel.filterExpIndustry" :options="industryOptions" multiple cascade checkable filterable clearable placeholder="Выберите отрасль..." />
            </n-form-itemGi>
            <n-form-itemGi label="Период работы в отрасли">
              <n-select v-model:value="formModel.filterExpPeriod" :options="FILTER_EXP_PERIOD" clearable :disabled="!isIndustrySelected" />
            </n-form-itemGi>
          </n-grid>

          <!-- Expander for Additional Filters -->
          <n-collapse>
            <n-collapse-item title="Дополнительные фильтры" name="1">
              
              <!-- Demographics -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Демография</n-text>
              <n-grid :cols="3" x-gap="12">
                <n-form-itemGi label="Возраст от">
                  <n-input-number v-model:value="formModel.ageFrom" clearable />
                </n-form-itemGi>
                <n-form-itemGi label="Возраст до">
                  <n-input-number v-model:value="formModel.ageTo" clearable />
                </n-form-itemGi>
                <n-form-itemGi label="Пол">
                  <n-select v-model:value="formModel.gender" :options="GENDER" clearable />
                </n-form-itemGi>
              </n-grid>
              
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

              <!-- Relocation & Travel -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Местоположение и поездки (в разработке)</n-text>
              <n-grid :cols="2" x-gap="12">
                <n-form-itemGi label="Переезд">
                  <n-select v-model:value="formModel.relocation" :options="RESUME_SEARCH_RELOCATION" clearable disabled />
                </n-form-itemGi>
                <n-form-itemGi label="Готовность к командировкам">
                  <n-select v-model:value="formModel.businessTripReadiness" :options="BUSINESS_TRIP_READINESS" multiple clearable disabled />
                </n-form-itemGi>
              </n-grid>
              <n-grid :cols="2" x-gap="12">
                <n-form-itemGi label="Станции метро (ID)">
                  <n-input v-model:value="formModel.metro" placeholder="ID через запятую..." disabled />
                </n-form-itemGi>
                <n-form-itemGi label="Район">
                  <n-input v-model:value="formModel.district" placeholder="Название или ID..." disabled />
                </n-form-itemGi>
              </n-grid>

              <!-- Education -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Образование</n-text>
              <n-form-item label="Уровень образования">
                <n-select v-model:value="formModel.educationLevels" :options="EDUCATION_LEVEL" multiple clearable />
              </n-form-item>

              <!-- Other Filters -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Другое</n-text>
              <n-grid :cols="2" x-gap="12">
                <n-form-itemGi label="Категории прав">
                  <n-select v-model:value="formModel.driverLicenseTypes" :options="DRIVER_LICENSE_TYPES" multiple clearable />
                </n-form-itemGi>
                <n-form-itemGi label="Статус поиска">
                  <n-select v-model:value="formModel.jobSearchStatus" :options="JOB_SEARCH_STATUSES_APPLICANT" multiple clearable />
                </n-form-itemGi>
              </n-grid>
              
              <n-form-item label="Ключевые навыки (в разработке)">
                <n-select v-model:value="formModel.skills" multiple filterable tag clearable placeholder="Введите навык и нажмите Enter" disabled />
              </n-form-item>

            </n-collapse-item>
          </n-collapse>

          <!-- Sorting -->
          <n-form-item label="Сортировка" style="margin-top: 12px;">
            <n-select v-model:value="formModel.orderBy" :options="RESUME_SEARCH_ORDER" />
          </n-form-item>

          <n-button type="primary" block attr-type="submit" size="large" :loading="searchStore.isLoading">
            Найти
          </n-button>
        </n-space>
      </n-form>
    </n-space>
  </n-card>

  <HHQueryBuilderModal :show="showQueryBuilder" @update:show="val => showQueryBuilder = val" :initial-query="activeTextQueryRef?.text" @submit="handleQuerySubmit" />
</template>
