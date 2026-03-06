<script setup lang="ts">
import { NSwitch, NIcon } from 'naive-ui'
import { useThemeStore } from '@/entities/theme'
import MoonStarsIcon from '@/shared/ui/icons/MoonStarsIcon.vue'
import SunnyIcon from '@/shared/ui/icons/SunnyIcon.vue'

const themeStore = useThemeStore()
</script>

<template>
  <n-switch v-model:value="themeStore.isDark" size="large">
    <template #checked-icon>
      <n-icon :component="MoonStarsIcon" />
    </template>
    <template #unchecked-icon>
      <n-icon :component="SunnyIcon" />
    </template>
  </n-switch>
</template>
