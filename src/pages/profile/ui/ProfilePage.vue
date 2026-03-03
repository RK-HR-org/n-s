<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NDescriptions, NDescriptionsItem, NAvatar, NTag, NSpace, NIcon, NText, NDivider, NPopconfirm, NButton } from 'naive-ui'
import { useUserStore } from '@/entities/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const user = computed(() => userStore.user)

const getInitials = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return 'U'
    const first = firstName ? firstName.charAt(0) : ''
    const last = lastName ? lastName.charAt(0) : ''
    return `${first}${last}`.toUpperCase()
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const getRoleColor = (roleName: string) => {
    switch (roleName?.toLowerCase()) {
        case 'admin':
            return 'error'
        case 'user':
        default:
            return 'info'
    }
}

const handleLogout = () => {
    userStore.logout()
    router.push('/')
}
</script>

<template>
    <div class="profile-container">
        <n-card
            v-if="user"
            class="profile-card"
            title="Личный кабинет"
        >
            <div class="profile-header">
                <n-avatar
                    round
                    :size="80"
                    color="#4338ca"
                    class="profile-avatar"
                >
                    <span style="color: white; font-size: 28px; font-weight: 500;">
                        {{ getInitials(user.first_name, user.last_name) }}
                    </span>
                </n-avatar>
                <div class="profile-title">
                    <n-text style="font-size: 24px; font-weight: 600;">
                        {{ user.first_name || '' }} {{ user.last_name || '' }}
                    </n-text>
                    <n-text depth="3" style="font-size: 14px;">
                        {{ user.email }}
                    </n-text>
                </div>
            </div>

            <n-divider />

            <n-descriptions
                label-placement="left"
                bordered
                :column="1"
                class="profile-details"
            >
                <n-descriptions-item label="ID пользователя">
                    {{ user.id }}
                </n-descriptions-item>
                
                <n-descriptions-item label="Статус">
                    <n-tag
                        :type="user.status === 'active' ? 'success' : 'warning'"
                        size="small"
                        round
                    >
                        {{ user.status === 'active' ? 'Активный' : 'Неактивный' }}
                    </n-tag>
                </n-descriptions-item>

                <n-descriptions-item label="Роль">
                    <n-tag
                        :type="getRoleColor(user.role?.name)"
                        size="small"
                        round
                    >
                        {{ user.role?.name || 'Нет роли' }}
                    </n-tag>
                </n-descriptions-item>

                <n-descriptions-item label="Команды">
                    <span v-if="!user.teams || user.teams.length === 0" style="color: grey; font-style: italic;">
                        Нет привязанных команд
                    </span>
                    <n-space v-else>
                        <n-tag v-for="(team, index) in user.teams" :key="index" round size="small">
                            {{ team.name || 'Команда ' + (index + 1) }}
                        </n-tag>
                    </n-space>
                </n-descriptions-item>

                <n-descriptions-item label="Дата регистрации">
                    {{ formatDate(user.created_at) }}
                </n-descriptions-item>
            </n-descriptions>

            <template #action>
                <div style="display: flex; justify-content: flex-end;">
                  <n-popconfirm
                      @positive-click="handleLogout"
                      positive-text="Выйти"
                      negative-text="Отмена"
                  >
                      <template #trigger>
                          <n-button type="error" ghost round>
                              Выйти из аккаунта
                          </n-button>
                      </template>
                      Вы уверены, что хотите выйти из личного кабинета?
                  </n-popconfirm>
                </div>
            </template>
        </n-card>
        
        <n-card v-else class="profile-card">
            <template #header>
                <n-text strong>Ошибка загрузки профиля</n-text>
            </template>
            <n-text depth="3">
                Данные пользователя недоступны. Возможно, вы не авторизованы.
            </n-text>
            <template #footer>
                <n-button @click="router.push('/')" type="primary" round>
                    На главную
                </n-button>
            </template>
        </n-card>
    </div>
</template>

<style scoped>
.profile-container {
    max-width: 800px;
    margin: 40px auto;
    padding: 0 20px;
}

.profile-card {
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    background: rgba(24, 22, 37, 0.8);
    backdrop-filter: blur(20px);
}

.dark-theme .profile-card {
    background: rgba(40, 40, 48, 0.8);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.profile-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 24px;
}

.profile-avatar {
    border: 4px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark-theme .profile-avatar {
    border-color: #333;
}

.profile-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.profile-details {
    padding: 0 10px;
}

:deep(.n-descriptions-table-wrapper) {
    border-radius: 12px;
    overflow: hidden;
}
</style>
