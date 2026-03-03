<script setup lang="ts">
import { NSwitch, NIcon } from 'naive-ui'
import { useThemeStore } from '@/entities/theme'

const themeStore = useThemeStore()
</script>

<template>
  <n-switch v-model:value="themeStore.isDark" size="large">
    <template #checked>
      Dark
    </template>
    <template #unchecked>
      Light
    </template>
  </n-switch>
</template>
