<script setup lang="ts">
import { NSpace, NCard, NText, NGrid, NGridItem, NIcon } from 'naive-ui'

import HomeIcon from '@/shared/ui/icons/HomeIcon.vue'
import MagicIcon from '@/shared/ui/icons/MagicIcon.vue'
import MoonStarsIcon from '@/shared/ui/icons/MoonStarsIcon.vue'
import PersonIcon from '@/shared/ui/icons/PersonIcon.vue'
import Sparkles from '@/shared/ui/icons/Sparkles.vue'
import SparklesIcon from '@/shared/ui/icons/SparklesIcon.vue'
import SunnyIcon from '@/shared/ui/icons/SunnyIcon.vue'
import UsersIcon from '@/shared/ui/icons/UsersIcon.vue'
import UsersIcon2 from '@/shared/ui/icons/UsersIcon2.vue'
import SettingsIcon from '@/shared/ui/icons/SettingsIcon.vue'
import HistoryIcon from '@/shared/ui/icons/HistoryIcon.vue'
import TeamIcon from '@/shared/ui/icons/TeamIcon.vue'
import SearchIcon from '@/shared/ui/icons/SearchIcon.vue'

const icons = [
  { name: 'HomeIcon', component: HomeIcon },
  { name: 'MagicIcon', component: MagicIcon },
  { name: 'MoonStarsIcon', component: MoonStarsIcon },
  { name: 'PersonIcon', component: PersonIcon },
  { name: 'SettingsIcon', component: SettingsIcon },
  { name: 'Sparkles', component: Sparkles },
  { name: 'SparklesIcon', component: SparklesIcon },
  { name: 'SunnyIcon', component: SunnyIcon },
  { name: 'UsersIcon', component: UsersIcon },
  { name: 'UsersIcon2', component: UsersIcon2 },
  { name: 'HistoryIcon', component: HistoryIcon },
  { name: 'TeamIcon', component: TeamIcon },
  { name: 'SearchIcon', component: SearchIcon },
]
</script>

<template>
  <div style="padding: 24px;">
    <n-space vertical size="large">
      <n-text depth="1" style="font-size: 24px; font-weight: 500;">Управление</n-text>
      <n-text depth="3">Предпросмотр компонентов UI. В дальнейшем здесь будут настройки кастомизации.</n-text>
      
      <n-grid x-gap="16" y-gap="16" cols="2 s:3 m:4 l:6" responsive="screen">
        <n-grid-item v-for="icon in icons" :key="icon.name">
          <n-card hoverable style="text-align: center; cursor: pointer; height: 100%;">
            <n-space vertical align="center" justify="center" style="min-height: 80px;">
              <n-icon size="32">
                <component :is="icon.component" />
              </n-icon>
              <n-text style="font-family: monospace; font-size: 14px; word-break: break-all;">
                {{ icon.name }}
              </n-text>
            </n-space>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-space>
  </div>
</template>
