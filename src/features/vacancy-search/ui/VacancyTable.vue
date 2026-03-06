<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { NDataTable, NSpace, NText, NTag, NButton } from 'naive-ui'

const props = defineProps<{
  vacancies: any[]
  isLoading: boolean
  total: number
  page: number
  perPage: number
}>()

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:sorter', sorter: any): void
  (e: 'preview', row: any): void
}>()

const formatSalary = (salary: any) => {
  if (!salary) return 'Не указана'
  const from = salary?.from
  const to = salary?.to
  const currency = salary?.currency
  if (!from && !to) return 'Не указана'
  const parts = []
  if (from) parts.push(`от ${from.toLocaleString('ru-RU')}`)
  if (to) parts.push(`до ${to.toLocaleString('ru-RU')}`)
  if (currency) parts.push(currency)
  return parts.join(' ')
}

const tableSorter = ref<any>(null)

const createColumns = () => {
  return [
    {
      title: 'Название вакансии',
      key: 'title',
      resizable: true,
      minWidth: 200,
      render(row: any) {
        return h(NText, { type: 'info', strong: true }, { default: () => row.name || row.title || 'Без названия' })
      }
    },
    {
      title: 'Компания',
      key: 'employer',
      resizable: true,
      minWidth: 150,
      render(row: any) {
        return h(NText, { strong: true }, { default: () => row.employer?.name || 'Не указана' })
      }
    },
    {
      title: 'Зарплата',
      key: 'salary',
      sorter: true,
      resizable: true,
      minWidth: 150,
      render(row: any) {
        if (!row.salary) return h(NText, { depth: 3 }, { default: () => 'Не указана' })
        return h(NText, null, { default: () => formatSalary(row.salary) })
      }
    },
    {
      title: 'Регион',
      key: 'area',
      resizable: true,
      minWidth: 120,
      render(row: any) {
        return row.area?.name || row.address?.city || '—'
      }
    },
    {
      title: 'Опыт работы / Занятость',
      key: 'experience_employment',
      resizable: true,
      minWidth: 150,
      render(row: any) {
        const parts: any[] = []
        if (row.experience?.name) {
            parts.push(h(NTag, { size: 'small', round: true }, { default: () => row.experience.name }))
        }
        
        let employmentName = row.employment?.name || row.employment_form?.name || ''
        if (employmentName === 'Полная' || employmentName === 'Частичная') {
            employmentName += ' занятость'
        } else if (employmentName === 'Проектная') {
            employmentName += ' работа'
        }
        if (employmentName) {
            parts.push(h(NTag, { size: 'small', round: true, type: 'info' }, { default: () => employmentName }))
        }

        const scheduleName = row.schedule?.name || row.work_schedule?.name || row.work_schedule_by_days?.map((s:any) => s.name).join(', ') || ''
        if (scheduleName) {
            parts.push(h(NTag, { size: 'small', round: true, type: 'warning' }, { default: () => scheduleName }))
        }

        return h(NSpace, { vertical: true, size: 4 }, {
          default: () => parts
        })
      }
    },
    {
      title: 'Действия',
      key: 'actions',
      resizable: true,
      minWidth: 120,
      render(row: any) {
         return h(NSpace, { size: 'small' }, {
           default: () => [
             h(
               NButton,
               {
                 size: 'small',
                 type: 'primary',
                 secondary: true,
                 tag: 'a',
                 href: row.alternate_url || row.url,
                 target: '_blank'
               },
               { default: () => 'HH.ru' }
             )
           ]
         })
      }
    }
  ]
}

const columns = createColumns()

const handleSorterChange = (sorter: any) => {
    tableSorter.value = sorter
    emit('update:sorter', sorter)
}

const sortedVacancies = computed(() => {
    if (!props.vacancies) return []
    let data = [...props.vacancies]
    
    if (tableSorter.value && tableSorter.value.order) {
        const { columnKey, order } = tableSorter.value
        
        data.sort((a, b) => {
            let valA = 0
            let valB = 0
            
            if (columnKey === 'salary') {
                valA = a.salary?.from || 0
                valB = b.salary?.from || 0
            }
            
            return order === 'ascend' ? valA - valB : valB - valA
        })
    }
    
    return data
})
</script>

<template>
  <div class="vacancy-table">
    <n-data-table
      :columns="columns"
      :data="sortedVacancies"
      :loading="isLoading"
      :pagination="{
        page: page,
        pageSize: perPage,
        itemCount: total,
        onChange: (p) => emit('update:page', p)
      }"
      remote
      @update:sorter="handleSorterChange"
      :bordered="false"
      size="small"
    />
  </div>
</template>
