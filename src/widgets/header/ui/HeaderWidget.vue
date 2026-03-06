<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NLayoutHeader, NText, NSpace, NAvatar, NButton, NIcon, NDrawer, NDrawerContent, NMenu, NTooltip, type MenuOption } from 'naive-ui'
import { ThemeToggle } from '@/features/theme-toggle'
import { useUserStore } from '@/entities/user'

import HomeIcon from '@/shared/ui/icons/HomeIcon.vue'
import SearchIcon from '@/shared/ui/icons/SearchIcon.vue'
import HistoryIcon from '@/shared/ui/icons/HistoryIcon.vue'
import UsersIcon from '@/shared/ui/icons/UsersIcon.vue'
import TeamIcon from '@/shared/ui/icons/TeamIcon.vue'
import PersonIcon from '@/shared/ui/icons/PersonIcon.vue'
import SettingsIcon from '@/shared/ui/icons/SettingsIcon.vue'

const userStore = useUserStore()
const route = useRoute()

const isDrawerActive = ref(false)
const isMenuClicked = ref(false)

const showTooltip = computed(() => {
  return route.name === 'home' && !isMenuClicked.value && !isDrawerActive.value
})

const handleMenuClick = () => {
  isDrawerActive.value = true
  isMenuClicked.value = true
}

function renderIcon(icon: import('vue').Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = [
    {
      label: () =>
        h(
          RouterLink,
          {
            to: { name: 'home' }
          },
          { default: () => 'Главная' }
        ),
      key: 'home',
      icon: renderIcon(HomeIcon)
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: { name: 'resume-search' }
          },
          { default: () => 'Поиск резюме' }
        ),
      key: 'resume-search',
      icon: renderIcon(SearchIcon)
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: { name: 'vacancy-search' }
          },
          { default: () => 'Поиск вакансий' }
        ),
      key: 'vacancy-search',
      icon: renderIcon(SearchIcon)
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: { name: 'search-history' }
          },
          { default: () => 'История поиска' }
        ),
      key: 'search-history',
      icon: renderIcon(HistoryIcon)
    }
  ]

  if (userStore.hasPermission('view_users_list')) {
    options.push({
      label: () =>
        h(
          RouterLink,
          {
            to: { name: 'users' }
          },
          { default: () => 'Пользователи' }
        ),
      key: 'users',
      icon: renderIcon(UsersIcon)
    })
  }

  if (userStore.hasPermission('view_teams_list')) {
    options.push({
      label: () =>
        h(
          RouterLink,
          {
            to: { name: 'teams' }
          },
          { default: () => 'Команды' }
        ),
      key: 'teams',
      icon: renderIcon(TeamIcon)
    })
  }

  options.push(
    {
      label: () =>
        h(
          RouterLink,
          {
            to: { name: 'profile' }
          },
          { default: () => 'Личный кабинет' }
        ),
      key: 'profile',
      icon: renderIcon(PersonIcon)
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: { name: 'management' }
          },
          { default: () => 'Управление' }
        ),
      key: 'management',
      icon: renderIcon(SettingsIcon)
    }
  )

  return options
})
</script>

<template>
  <n-layout-header bordered style="padding: 16px 24px;">
    <n-space align="center" justify="space-between">
      <n-space align="center" size="large">
        <!-- Application Logo -->
        <router-link to="/">
          <img src="/lat-logo.svg" alt="HR IT Logo" height="32" style="display: block;" />
        </router-link>

        <template v-if="userStore.isAuthenticated">
          <router-link to="/profile" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 8px;">
            <n-avatar round size="small" :src="userStore.user?.first_name ? undefined : ''">
               {{ userStore.user?.first_name?.charAt(0) || 'U' }}
            </n-avatar>
            <n-space vertical :size="0">
              <n-text>{{ userStore.user?.first_name }} {{ userStore.user?.last_name }}</n-text>
              <n-text depth="3" style="font-size: 12px;" v-if="userStore.user?.teams?.length">
                {{ String(userStore.user.teams[0].name || userStore.user.teams[0]) }}
              </n-text>
            </n-space>
          </router-link>
        </template>
        <n-text depth="3" v-else>Навигация</n-text>
        <ThemeToggle />
      </n-space>
      <n-space align="center">
        <n-tooltip placement="bottom-end" :show="showTooltip" trigger="manual">
          <template #trigger>
            <n-button text style="font-size: 24px;" @click="handleMenuClick">
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
              </n-icon>
            </n-button>
          </template>
          Перейти к поиску
        </n-tooltip>
      </n-space>
    </n-space>

    <n-drawer v-model:show="isDrawerActive" placement="right" :width="240">
      <n-drawer-content title="Навигация" closable :body-content-style="{ paddingLeft: 0 }">
        <n-menu :options="menuOptions" @update:value="isDrawerActive = false" />
      </n-drawer-content>
    </n-drawer>
  </n-layout-header>
</template>
