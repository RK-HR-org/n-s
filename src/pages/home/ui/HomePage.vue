<script setup lang="ts">
import { NCard, NText, NButton, NSpace, useMessage } from 'naive-ui'
import { LoginForm } from '@/features/auth-by-email'
import { useUserStore } from '@/entities/user'

const message = useMessage()
const userStore = useUserStore()

const handleExplore = () => {
  message.success('Exploring the API options...')
}
</script>

<template>
  <n-card title="Welcome to the API Explorer" style="max-width: 800px; margin: 0 auto; margin-top: 40px;">
    <n-space vertical size="large">
      <template v-if="!userStore.isAuthenticated">
        <n-text>
          Пожалуйста, авторизуйтесь для доступа к полному функционалу.
        </n-text>
        <LoginForm />
      </template>

      <template v-else>
        <n-text>
          Добро пожаловать, {{ userStore.user?.first_name }}! Вы успешно авторизованы.
        </n-text>
        
        <n-text>
          You can start integrating the ReDoc API specifications and building the domain entities and features inside the `src` folder.
        </n-text>

        <n-button type="primary" size="large" @click="handleExplore">
          Get Started
        </n-button>
        
        <n-button @click="userStore.logout">
          Выйти
        </n-button>
      </template>
    </n-space>
  </n-card>
</template>
