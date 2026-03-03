<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { NDataTable, NAvatar, NText, NSpace, NTag, NButton } from 'naive-ui'

const props = defineProps<{
  resumes: any[]
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

const formatAge = (age: number) => {
  if (!age) return ''
  const cases = [2, 0, 1, 1, 1, 2]
  const titles = ['год', 'года', 'лет']
  const index = (age % 100 > 4 && age % 100 < 20) ? 2 : cases[(age % 10 < 5) ? age % 10 : 5]
  return `${age} ${titles[index]}`
}

const getExperienceStr = (monthsStr?: number) => {
  if (!monthsStr) return 'Без опыта'
  const years = Math.floor(monthsStr / 12)
  const months = monthsStr % 12
  
  let result = []
  if (years) result.push(formatAge(years))
  if (months) result.push(`${months} мес.`)
    
  return result.join(' ')
}

const tableSorter = ref<any>(null)

const createColumns = () => {
  return [
    {
      title: 'Фото',
      key: 'photo',
      render(row: any) {
        return h(NAvatar, {
          src: row.photo?.small || undefined,
          round: true,
          size: 'large'
        })
      }
    },
    {
      title: 'Кандидат',
      key: 'candidate',
      render(row: any) {
        return h(NSpace, { vertical: true, size: 'small' }, {
          default: () => [
            h(NText, { strong: true }, { default: () => row.last_name ? `${row.last_name} ${row.first_name}` : 'Имя скрыто' }),
            h(NText, { depth: 3, size: 'small' }, { default: () => row.age ? formatAge(row.age) : 'Возраст не указан' })
          ]
        })
      }
    },
    {
      title: 'Желаемая должность',
      key: 'title',
      render(row: any) {
        return h(NText, { type: 'info', strong: true }, { default: () => row.title || 'Без названия' })
      }
    },
    {
      title: 'Зарплата',
      key: 'salary',
      sorter: true,
      render(row: any) {
        if (!row.salary || !row.salary.amount) return h(NText, { depth: 3 }, { default: () => 'Не указана' })
        return h(NText, null, { default: () => row.salary.amount.toLocaleString('ru-RU') })
      }
    },
    {
      title: 'Опыт работы',
      key: 'experience',
      sorter: true,
      render(row: any) {
        return getExperienceStr(row.total_experience?.months)
      }
    },
    {
      title: 'Последнее место',
      key: 'last_job',
      render(row: any) {
        const last = row.experience?.[0]
        if (!last) return '—'
        return h(NSpace, { vertical: true, size: 0 }, {
            default: () => [
                h(NText, { strong: true }, { default: () => last.company }),
                h(NText, { depth: 2, size: 'small' }, { default: () => last.position })
            ]
        })
      }
    },
    {
      title: 'Город',
      key: 'area',
      render(row: any) {
        return row.area?.name || '—'
      }
    },
    {
      title: 'Действия',
      key: 'actions',
      render(row: any) {
         return h(NSpace, { size: 'small' }, {
           default: () => [
             h(
               NButton,
               {
                 size: 'small',
                 type: 'info',
                 secondary: true,
                 onClick: () => emit('preview', row)
               },
               { default: () => 'Предпросмотр' }
             ),
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

const sortedResumes = computed(() => {
    if (!props.resumes) return []
    let data = [...props.resumes]
    
    if (tableSorter.value && tableSorter.value.order) {
        const { columnKey, order } = tableSorter.value
        
        data.sort((a, b) => {
            let valA = 0
            let valB = 0
            
            if (columnKey === 'salary') {
                valA = a.salary?.amount || 0
                valB = b.salary?.amount || 0
            } else if (columnKey === 'experience') {
                valA = a.total_experience?.months || 0
                valB = b.total_experience?.months || 0
            }
            
            return order === 'ascend' ? valA - valB : valB - valA
        })
    }
    
    return data
})
</script>

<template>
  <div class="resume-table">
    <n-data-table
      :columns="columns"
      :data="sortedResumes"
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
