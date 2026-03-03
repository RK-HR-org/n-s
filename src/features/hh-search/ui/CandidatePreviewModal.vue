<script setup lang="ts">
import { NModal, NCard, NDescriptions, NDescriptionsItem, NTag, NSpace, NAvatar, NText, NButton, NDivider } from 'naive-ui'

const props = defineProps<{
    show: boolean
    candidate: any | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
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

const formatExperiencePeriod = (startStr?: string, endStr?: string) => {
  if (!startStr) return 'Неизвестно'
  
  const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
  const start = new Date(startStr)
  // capitalize first letter of month since toLocaleDateString might be lowercase
  let startFmt = start.toLocaleDateString('ru-RU', options)
  
  let result = startFmt
  
  if (endStr) {
    const end = new Date(endStr)
    result += ` — ${end.toLocaleDateString('ru-RU', options)}`
  } else {
    result += ' — по настоящее время'
  }
  
  return result
}

const getPeriodDuration = (startStr?: string, endStr?: string) => {
  if (!startStr) return ''
  const start = new Date(startStr)
  const end = endStr ? new Date(endStr) : new Date()
  
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  return getExperienceStr(months === 0 ? 1 : months)
}
</script>

<template>
    <n-modal 
        :show="show" 
        @update:show="val => emit('update:show', val)"
    >
        <n-card
            style="width: 700px; max-width: 95vw;"
            title="Карточка кандидата"
            :bordered="false"
            size="huge"
            role="dialog"
            aria-modal="true"
        >
            <template #header-extra>
                <n-button text style="font-size: 20px" @click="emit('update:show', false)">
                    ✕
                </n-button>
            </template>
            <template v-if="candidate">
                <div style="display: flex; gap: 24px; margin-bottom: 24px;">
                    <n-avatar
                        v-if="candidate.photo?.medium || candidate.photo?.small"
                        :src="candidate.photo?.medium || candidate.photo?.small"
                        :size="120"
                        round
                        style="flex-shrink: 0;"
                    />
                    <n-avatar
                        v-else
                        :size="120"
                        round
                        style="flex-shrink: 0;"
                    >
                        Нет фото
                    </n-avatar>
                    
                    <n-space vertical justify="center" style="flex-grow: 1;">
                        <n-text style="font-size: 24px; font-weight: bold; line-height: 1.2;">
                            {{ candidate.last_name ? `${candidate.first_name} ${candidate.last_name}` : 'Имя скрыто' }}
                        </n-text>
                        <n-space style="margin-top: 4px;">
                            <n-tag type="info" bordered v-if="candidate.age">
                                 {{ formatAge(candidate.age) }}
                            </n-tag>
                            <n-tag type="default" bordered v-if="candidate.area?.name">
                                 {{ candidate.area.name }}
                            </n-tag>
                        </n-space>
                        <n-text type="primary" style="font-size: 18px; font-weight: 500; margin-top: 8px;">
                            {{ candidate.title || 'Желаемая должность не указана' }}
                        </n-text>
                        <n-text style="font-size: 16px; font-weight: 500;">
                             {{ candidate.salary?.amount ? `${candidate.salary.amount.toLocaleString('ru-RU')} ${candidate.salary.currency}` : 'Зарплата не указана' }}
                        </n-text>
                    </n-space>
                </div>

                <n-descriptions bordered :column="1" size="small" label-placement="left">
                    <n-descriptions-item label="Опыт работы">
                        {{ getExperienceStr(candidate.total_experience?.months) }}
                    </n-descriptions-item>
                    
                    <n-descriptions-item label="История работы" v-if="candidate.experience && candidate.experience.length > 0">
                        <n-space vertical size="large" style="width: 100%;">
                            <div v-for="(exp, index) in candidate.experience" :key="index" style="display: flex; flex-direction: column; gap: 4px;">
                                <n-text strong style="font-size: 15px;">{{ exp.company }}</n-text>
                                <n-text type="primary" strong>{{ exp.position }}</n-text>
                                
                                <n-text depth="3" style="font-size: 13px;">
                                    {{ formatExperiencePeriod(exp.start, exp.end) }}
                                    &nbsp;·&nbsp;
                                    {{ getPeriodDuration(exp.start, exp.end) }}
                                </n-text>
                                
                                <div style="font-size: 13px; max-height: 200px; overflow-y: auto; margin-top: 4px; padding-right: 8px; white-space: pre-wrap; line-height: 1.5;" v-if="exp.description">
                                    {{ exp.description }}
                                </div>
                                
                                <n-divider style="margin: 16px 0 0 0;" v-if="index !== candidate.experience.length - 1" />
                            </div>
                        </n-space>
                    </n-descriptions-item>

                    <n-descriptions-item label="Образование" v-if="candidate.education?.level?.name">
                         {{ candidate.education.level.name }}
                    </n-descriptions-item>
                    
                    <n-descriptions-item label="Ключевые навыки" v-if="candidate.skill_set && candidate.skill_set.length > 0">
                        <n-space style="margin-top: 4px;" size="small">
                            <n-tag v-for="skill in candidate.skill_set" :key="skill" size="small" type="success" bordered round>
                                {{ skill }}
                            </n-tag>
                        </n-space>
                    </n-descriptions-item>
                </n-descriptions>

                <n-space justify="end" style="margin-top: 24px;">
                    <n-button @click="emit('update:show', false)">Закрыть</n-button>
                    <n-button 
                        type="primary" 
                        tag="a" 
                        :href="candidate.alternate_url || candidate.url" 
                        target="_blank"
                    >
                        Открыть резюме на HeadHunter
                    </n-button>
                </n-space>
            </template>
        </n-card>
    </n-modal>
</template>
