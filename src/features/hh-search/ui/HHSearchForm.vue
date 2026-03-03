<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NForm, NFormItem, NInput, NSelect, NButton, NSpace, NDivider, NGrid, NFormItemGi, NInputNumber, NCard, NText, NTreeSelect, NDatePicker, NCollapse, NCollapseItem, NDynamicInput, NIcon
} from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useDictionaryStore } from '@/entities/dictionary'
import {
  EDUCATION_LEVEL, EXPERIENCE, EMPLOYMENT, SCHEDULE, GENDER, RESUME_SEARCH_ORDER, CURRENCY_OPTIONS,
  RESUME_SEARCH_RELOCATION, BUSINESS_TRIP_READINESS, DRIVER_LICENSE_TYPES, JOB_SEARCH_STATUSES_APPLICANT, RESUME_SEARCH_LABEL
} from '@/shared/constants/hhDictionaries'
import SparklesIcon from '@/shared/ui/icons/SparklesIcon.vue'
import { useSearchStore } from '../model/useSearchStore'
import { useUserStore } from '@/entities/user'

const userStore = useUserStore()

const teamOptions = computed(() => {
  return userStore.user?.teams?.map(team => {
    const teamId = team.id || team
    return {
      label: `Команда ${String(teamId).slice(0, 8)}...`,
      value: teamId
    }
  }) || []
})

const selectedTeamId = ref(userStore.user?.teams?.[0]?.id || userStore.user?.teams?.[0] || null)

// AI Prompt enrichment
const positivePrompt = ref('')
const negativePrompt = ref('')
const searchStore = useSearchStore()

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

// Full form model
const formModel = ref({
  // Text search
  textQueries: [{ text: '', logic: 'all', field: 'everywhere', period: 'all_time' }], 
  
  // Demography
  ageFrom: null as number | null,
  ageTo: null as number | null,
  gender: null as string | null,
  labels: null as string[] | null,

  // Geography & Relocation
  areas: null as string[] | null,
  relocation: null as string | null,
  metro: null as string | null, // Input for now
  district: null as string | null,
  citizenship: null as string[] | null,
  workTicket: null as string[] | null,
  businessTripReadiness: null as string[] | null,

  // Dates
  period: null as number | null,
  dateFrom: null as number | null, // Timestamp for datepicker
  dateTo: null as number | null,

  // Education/Experience
  educationLevels: null as string[] | null,
  educationalInstitution: null as string | null,
  experience: null as string[] | null,
  filterExpIndustry: null as string[] | null,
  filterExpPeriod: null as string | null,

  // Employment/Schedule/Skills
  employment: null as string[] | null,
  schedule: null as string[] | null,
  skills: null as string[] | null, // tags
  languages: null as string | null, // simplified Input for language filter
  driverLicenseTypes: null as string[] | null,

  // Salary
  salaryFrom: null as number | null,
  salaryTo: null as number | null,
  currency: 'RUR',

  // Professional Role & Status
  professionalRole: null as string[] | null,
  jobSearchStatus: null as string[] | null,

  // Pagination / Sorting
  orderBy: 'relevance'
})

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

const onCreateTextQuery = () => {
  return {
    text: '',
    logic: 'all',
    field: 'everywhere',
    period: 'all_time'
  }
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
      
      <!-- Team Selector -->
      <n-form-item label="Команда для поиска (Обязательно для API)">
        <n-select v-model:value="selectedTeamId" :options="teamOptions" placeholder="Выберите команду из вашего профиля" clearable />
      </n-form-item>

      <n-divider style="margin: 0;" />

      <!-- AI Enrichment Section -->
      <n-collapse>
        <n-collapse-item name="ai-search">
          <template #header>
            <div style="display: flex; align-items: center; gap: 8px;">
              <n-icon :component="SparklesIcon" size="20" color="#F74C00" />
              <span>Умный поиск (AI)</span>
            </div>
          </template>
          <n-grid :cols="1" y-gap="12">
            <n-form-itemGi label="Опишите, кто вам нужен (Позитивный промпт)">
              <n-input
                v-model:value="positivePrompt"
                type="textarea"
                placeholder="Например: ищем Senior Frontend разработчика, опыт Vue 3 и Node.js от 5 лет, знание FSD"
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
          <n-button type="info" secondary block style="margin-top: 12px;" @click="handleEnrich" :loading="searchStore.isEnriching">
            Автозаполнение фильтров с помощью AI
          </n-button>
        </n-collapse-item>
      </n-collapse>

      <n-divider style="margin: 12px 0;" />

      <!-- Manual Form Section -->
      <n-form :model="formModel" @submit.prevent="handleSearch">
        <n-text depth="3" style="margin-bottom: 8px; display: block;">Ручные фильтры поиска</n-text>

        <n-space vertical>
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
                  <n-input v-model:value="value.text" placeholder="Введите ключевые слова..." />
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

          <!-- Geography & Roles (from Dict Store) -->
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
            <n-form-itemGi label="Метки">
              <n-select v-model:value="formModel.labels" :options="RESUME_SEARCH_LABEL" multiple clearable placeholder="Например, только с фото" />
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

              <!-- Relocation & Travel -->
              <n-text depth="3" style="margin-bottom: 8px; display: block;">Местоположение и поездки</n-text>
              <n-grid :cols="2" x-gap="12">
                <n-form-itemGi label="Переезд">
                  <n-select v-model:value="formModel.relocation" :options="RESUME_SEARCH_RELOCATION" clearable />
                </n-form-itemGi>
                <n-form-itemGi label="Готовность к командировкам">
                  <n-select v-model:value="formModel.businessTripReadiness" :options="BUSINESS_TRIP_READINESS" multiple clearable />
                </n-form-itemGi>
              </n-grid>
              <n-grid :cols="2" x-gap="12">
                <n-form-itemGi label="Станции метро (ID)">
                  <n-input v-model:value="formModel.metro" placeholder="ID через запятую..." />
                </n-form-itemGi>
                <n-form-itemGi label="Район">
                  <n-input v-model:value="formModel.district" placeholder="Название или ID..." />
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
              
              <n-form-item label="Ключевые навыки">
                <n-select v-model:value="formModel.skills" multiple filterable tag clearable placeholder="Введите навык и нажмите Enter" />
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
</template>
