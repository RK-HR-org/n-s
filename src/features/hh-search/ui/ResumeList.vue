<script setup lang="ts">
import { NPagination, NEmpty, NSpace, NSkeleton, NCard, NText, NAlert } from 'naive-ui'
import ResumeCard from './ResumeCard.vue'

const props = defineProps<{
  resumes: any[]
  isLoading: boolean
  total: number
  page: number
  perPage: number
}>()

const emit = defineEmits<{
  (e: 'update:page', page: number): void
}>()
</script>

<template>
  <div class="resume-list">
    <!-- Loading State -->
    <template v-if="isLoading">
      <n-space vertical size="large">
        <n-card v-for="i in 3" :key="i" style="border-radius: 12px;">
          <n-skeleton text :repeat="2" />
          <n-skeleton text style="width: 60%" />
          <n-skeleton text style="width: 80%" />
        </n-card>
      </n-space>
    </template>

    <!-- Empty State -->
    <template v-else-if="!isLoading && resumes.length === 0">
      <n-card style="border-radius: 12px; display: flex; justify-content: center; padding: 40px 0;">
        <n-empty description="Резюме по вашему запросу не найдены" />
      </n-card>
    </template>

    <!-- Results -->
    <template v-else>
      <div style="margin-bottom: 24px;">
        <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
          <n-text strong style="font-size: 18px;">Найдено резюме: {{ total.toLocaleString('ru-RU') }}</n-text>
        </n-space>
        
        <n-alert v-if="total > 100" type="warning" show-icon style="margin-bottom: 16px;">
          Найдено более 100 результатов. Возможно, ваши фильтры слишком общие. Рекомендуется уточнить запрос для более точной выдачи.
        </n-alert>
      </div>

      <div style="margin-bottom: 16px;">
        <ResumeCard 
          v-for="resume in resumes" 
          :key="resume.id" 
          :resume="resume" 
        />
      </div>

      <!-- Pagination -->
      <div style="display: flex; justify-content: center; margin-top: 24px;">
        <n-pagination 
          :page="page"
          :page-size="perPage"
          :item-count="total"
          @update:page="(p) => emit('update:page', p)"
        />
      </div>
    </template>
  </div>
</template>
