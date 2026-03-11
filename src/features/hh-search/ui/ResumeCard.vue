<script setup lang="ts">
import { NCard, NText, NTag, NSpace, NButton, NAvatar, NDivider, NIcon } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  resume: any
}>()

const getSalary = computed(() => {
  const salary = props.resume?.salary
  if (!salary || !salary.amount) return 'З/П не указана'
  return `${salary.amount.toLocaleString('ru-RU')} ${salary.currency || 'RUR'}`
})

const formatAge = (age: number) => {
  if (!age) return ''
  const cases = [2, 0, 1, 1, 1, 2]
  const titles = ['год', 'года', 'лет']
  const index = (age % 100 > 4 && age % 100 < 20) ? 2 : cases[(age % 10 < 5) ? age % 10 : 5]
  return `${age} ${titles[index]}`
}

const getExperienceStr = computed(() => {
  const exp = props.resume?.total_experience
  if (!exp || !exp.months) return 'Без опыта'
  const years = Math.floor(exp.months / 12)
  const months = exp.months % 12
  
  let result = []
  if (years) result.push(formatAge(years))
  if (months) result.push(`${months} мес.`)
    
  return result.join(' ')
})

const lastExperience = computed(() => {
  const exps = props.resume?.experience || []
  if (exps.length === 0) return null
  return exps[0]
})
</script>

<template>
  <n-card hoverable style="border-radius: 12px; margin-bottom: 16px;">
    <n-space vertical size="small">
      <!-- Header: Title and Salary -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <n-text style="font-size: 18px; font-weight: 600; color: var(--n-text-color)">
          {{ resume?.title || 'Без названия' }}
        </n-text>
        <n-text style="font-size: 16px; font-weight: 500; color: var(--n-info-color)">
          {{ getSalary }}
        </n-text>
      </div>

      <!-- Demography: Age, City, Relocation -->
      <n-space size="small" align="center">
        <n-text depth="3" v-if="resume?.age">{{ formatAge(resume.age) }}</n-text>
        <n-divider vertical v-if="resume?.age && resume?.area?.name" />
        <n-text depth="3" v-if="resume?.area?.name">{{ resume.area.name }}</n-text>
        <n-divider vertical v-if="resume?.area?.name && resume?.gender?.name" />
        <n-text depth="3" v-if="resume?.gender?.name">{{ resume.gender.name }}</n-text>
      </n-space>

      <n-divider style="margin: 8px 0" />

      <!-- Experience & Last Job -->
      <n-space vertical size="small">
        <div style="display: flex; align-items: baseline; gap: 8px;">
          <n-text strong>Опыт работы:</n-text>
          <n-text>{{ getExperienceStr }}</n-text>
        </div>
        
        <div v-if="lastExperience" style="margin-left: 12px; border-left: 2px solid var(--n-border-color); padding-left: 12px;">
          <n-text depth="2" style="font-size: 13px;">Последнее место работы</n-text>
          <div>
            <n-text strong>{{ lastExperience.company }}</n-text>
          </div>
          <div>
            <n-text depth="1">{{ lastExperience.position }}</n-text>
          </div>
        </div>
      </n-space>

      <!-- Skills Tags -->
      <div v-if="resume?.skill_set?.length" style="margin-top: 8px;">
        <n-space size="small">
          <n-tag v-for="skill in resume.skill_set" :key="skill" size="small" type="info" round>
            {{ skill }}
          </n-tag>
        </n-space>
      </div>

      <!-- Footer: Update Time & Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
        <n-text depth="3" style="font-size: 12px;">
          Обновлено: {{ resume?.updated_at ? new Date(resume.updated_at).toLocaleDateString() : 'Неизвестно' }}
        </n-text>
        <n-space size="small">
          <n-button size="small" secondary type="primary" tag="a" :href="resume?.alternate_url || resume?.url" target="_blank">
            Открыть на HH.ru
          </n-button>
          <!-- <n-button size="small" secondary>
            В избранное
          </n-button> -->
        </n-space>
      </div>
    </n-space>
  </n-card>
</template>
