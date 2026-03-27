<script setup lang="ts">
import { NModal, NCard, NDescriptions, NDescriptionsItem, NTag, NSpace, NAvatar, NText, NButton, NDivider, NH3 } from 'naive-ui'

const props = defineProps<{
    show: boolean
    vacancy: any | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
}>()

const formatSalary = (salary: any) => {
  if (!salary) return 'Зарплата не указана'
  let from = salary?.from
  let to = salary?.to
  const currency = salary?.currency
  
  if (salary.gross === true) {
      if (from) from = Math.round(from * 0.87)
      if (to) to = Math.round(to * 0.87)
  }

  if (!from && !to) return 'Зарплата не указана'
  const parts = []
  if (from) parts.push(`от ${from.toLocaleString('ru-RU')}`)
  if (to) parts.push(`до ${to.toLocaleString('ru-RU')}`)
  if (currency) parts.push(currency)
  return parts.join(' ')
}

const highlightHtml = (htmlText: string) => {
    if (!htmlText) return ''
    return htmlText.replace(/<highlighttext>/g, '<mark style="background-color: #f59e0b; color: #000; padding: 0 4px; border-radius: 3px;">')
                   .replace(/<\/highlighttext>/g, '</mark>')
}
</script>

<template>
    <n-modal 
        :show="show" 
        @update:show="val => emit('update:show', val)"
    >
        <n-card
            style="width: 700px; max-width: 95vw;"
            title="Карточка вакансии"
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
            <template v-if="vacancy">
                <div style="display: flex; gap: 24px; margin-bottom: 24px;">
                    <n-avatar
                        v-if="vacancy.employer?.logo_urls?.original || vacancy.employer?.logo_urls?.['240'] || vacancy.employer?.logo_urls?.['90']"
                        :src="vacancy.employer?.logo_urls?.original || vacancy.employer?.logo_urls?.['240'] || vacancy.employer?.logo_urls?.['90']"
                        :size="120"
                        style="flex-shrink: 0;"
                    />
                    <n-avatar
                        v-else
                        :size="120"
                        style="flex-shrink: 0; background-color: #f1f5f9; color: #94a3b8;"
                    >
                        Нет лого
                    </n-avatar>
                    
                    <n-space vertical justify="center" style="flex-grow: 1;">
                        <n-text style="font-size: 24px; font-weight: bold; line-height: 1.2; display:block;">
                            {{ vacancy.name || vacancy.title || 'Без названия' }}
                        </n-text>

                        <n-text type="info" style="font-size: 18px; font-weight: 500; margin-top: 4px; display:block;">
                            {{ vacancy.employer?.name || 'Компания не указана' }}
                        </n-text>

                        <n-space style="margin-top: 8px;">
                            <n-tag type="info" bordered v-if="vacancy.area?.name || vacancy.address?.city">
                                 {{ vacancy.area?.name || vacancy.address?.city }}
                            </n-tag>
                            <n-tag type="default" bordered v-if="vacancy.experience?.name">
                                 Опыт: {{ vacancy.experience.name }}
                            </n-tag>
                            <n-tag type="default" bordered v-if="vacancy.employment?.name">
                                 Занятость: {{ vacancy.employment.name }}
                            </n-tag>
                        </n-space>

                        <n-text style="font-size: 16px; font-weight: bold; margin-top: 12px; display:block; color: #18a058;">
                             {{ formatSalary(vacancy.salary) }}
                        </n-text>
                    </n-space>
                </div>

                <n-descriptions bordered :column="1" size="small" label-placement="left" v-if="vacancy.schedule?.name || (vacancy.professional_roles && vacancy.professional_roles.length > 0)">
                    <n-descriptions-item label="График работы" v-if="vacancy.schedule?.name">
                        {{ vacancy.schedule.name }}
                    </n-descriptions-item>
                    <n-descriptions-item label="Проф. роли" v-if="vacancy.professional_roles && vacancy.professional_roles.length > 0">
                        {{ vacancy.professional_roles.map((r: any) => r.name).join(', ') }}
                    </n-descriptions-item>
                </n-descriptions>

                <div v-if="vacancy.snippet?.requirement || vacancy.snippet?.responsibility" style="margin-top: 24px;">
                    <n-h3 style="margin-bottom: 12px; font-size: 18px; font-weight: 500;">Описание в предпросмотре</n-h3>
                    <n-card size="small" embedded style="border-radius: 8px;">
                        <div v-if="vacancy.snippet?.responsibility" style="margin-bottom: 16px;">
                            <n-text strong style="display:block; margin-bottom: 4px; font-size: 14px;">Обязанности:</n-text>
                            <div style="font-size: 14px; line-height: 1.5;" v-html="highlightHtml(vacancy.snippet.responsibility)" />
                        </div>
                        <div v-if="vacancy.snippet?.requirement">
                            <n-text strong style="display:block; margin-bottom: 4px; font-size: 14px;">Требования:</n-text>
                            <div style="font-size: 14px; line-height: 1.5;" v-html="highlightHtml(vacancy.snippet.requirement)" />
                        </div>
                    </n-card>
                </div>
                
                <n-space justify="end" style="margin-top: 24px;">
                    <n-button @click="emit('update:show', false)">Закрыть</n-button>
                    <n-button 
                        type="primary" 
                        tag="a" 
                        :href="vacancy.alternate_url || vacancy.url" 
                        target="_blank"
                    >
                        Открыть вакансию на HeadHunter
                    </n-button>
                </n-space>
            </template>
        </n-card>
    </n-modal>
</template>
