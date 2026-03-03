<script setup lang="ts">
import { ref } from 'vue'
import { NLayout, NLayoutContent, NText, NH2, NSpace, NGrid, NGridItem, NCard } from 'naive-ui'
import { HHSearchForm, ResumeList, useSearchStore } from '@/features/hh-search'

const searchStore = useSearchStore()
const currentPage = ref(1)

const handlePageUpdate = (page: number) => {
  currentPage.value = page
  if (searchStore.currentSessionId) {
    // Pagination offset calculation: (page - 1) * perPage
    const perPage = 20
    searchStore.loadSessionItems(searchStore.currentSessionId, perPage, (page - 1) * perPage)
  }
}
</script>

<template>
  <n-layout>
    <n-layout-content style="padding: 24px;">
      <n-space vertical size="large">
        <n-h2>Поиск резюме</n-h2>
        
        <n-grid :cols="4" x-gap="24">
          <!-- Left side: Search Form -->
          <n-grid-item :span="2">
            <HHSearchForm />
          </n-grid-item>

          <!-- Right side: Results -->
          <n-grid-item :span="2">
            <template v-if="!searchStore.currentSessionId && !searchStore.isLoading">
              <n-card bordered :content-style="{ padding: '16px', minHeight: '500px' }">
                <n-text depth="3">Заполните критерии поиска и нажмите "Найти", чтобы увидеть результаты.</n-text>
              </n-card>
            </template>
            <template v-else>
              <ResumeList 
                :resumes="searchStore.searchResults"
                :is-loading="searchStore.isLoading"
                :total="searchStore.totalResults"
                :page="currentPage"
                :per-page="20"
                @update:page="handlePageUpdate"
              />
            </template>
          </n-grid-item>
        </n-grid>
      </n-space>
    </n-layout-content>
  </n-layout>
</template>
