<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, NGlobalStyle, NLayout, darkTheme, type GlobalThemeOverrides, ruRU, dateRuRU } from 'naive-ui'
import { RouterView } from 'vue-router'
import { HeaderWidget } from '@/widgets/header'
import { FooterWidget } from '@/widgets/footer'
import { useThemeStore } from '@/entities/theme'
import { useUserStore } from '@/entities/user'
import { computed, onMounted } from 'vue'

const themeStore = useThemeStore()
const activeTheme = computed(() => themeStore.isDark ? darkTheme : null)

// Rounded Aesthetics Theme Overrides
const themeOverrides: GlobalThemeOverrides = {
  common: {
    borderRadius: '12px',
    borderRadiusSmall: '8px',
  },
  Card: {
    borderRadius: '16px',
  },
  Button: {
    borderRadiusTiny: '8px',
    borderRadiusSmall: '10px',
    borderRadiusMedium: '12px',
    borderRadiusLarge: '14px',
  },
  Input: {
    borderRadius: '12px',
  },
  Select: {
    borderRadius: '12px',
  },
  Drawer: {
    borderRadius: '16px',
  }
}

const userStore = useUserStore()
onMounted(() => {
  userStore.fetchMe().catch(() => {})
})
</script>

<template>
  <n-config-provider :theme="activeTheme" :theme-overrides="themeOverrides" :locale="ruRU" :date-locale="dateRuRU">
    <n-global-style />
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <div class="app-layout">
            <HeaderWidget style="flex-shrink: 0;" />
            
            <!-- using :native-scrollbar="false" applies n-scrollbar under the hood -->
            <n-layout :native-scrollbar="false" embedded class="app-content">
              <div style="padding: 24px;">
                <RouterView />
              </div>
            </n-layout>
            
            <FooterWidget style="flex-shrink: 0;" />
          </div>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  overflow: hidden; /* Prevent body wide scrolling */
}

.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-content {
  flex: 1;
  /* padding removed here to be applied inside the scrollable area, otherwise the scrollbar itself gets padded */
}
</style>
