<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
  NPageHeader, NCard, NDataTable, NButton, NSpace, NTag, NInput, NForm, NFormItem, 
  NSelect, NModal, useMessage, NPopconfirm
} from 'naive-ui'
import { userApi, type UserResponse, type UserCreateRequest, type UserUpdateRequest } from '@/shared/api'

const message = useMessage()

// Data fetching
const users = ref<UserResponse[]>([])
const isLoading = ref(false)

const fetchUsers = async () => {
    try {
        isLoading.value = true
        const response = await userApi.getUsers()
        users.value = response
    } catch (e: any) {
        message.error(`Ошибка загрузки пользователей: ${e.message}`)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchUsers()
})

const columns = [
  { title: 'ID', key: 'id', ellipsis: { tooltip: true } },
  { title: 'Email', key: 'email' },
  { title: 'Имя', key: 'first_name' },
  { title: 'Фамилия', key: 'last_name' },
  { 
    title: 'Роль', 
    key: 'role.name',
    render(row: UserResponse) {
        return row.role?.name || 'Нет роли'
    }
  },
  {
    title: 'Статус',
    key: 'status',
    render(row: UserResponse) {
        return h(
            NTag,
            { type: row.status === 'active' ? 'success' : 'default', bordered: false },
            { default: () => row.status === 'active' ? 'Активен' : row.status }
        )
    }
  },
  {
      title: 'Действия',
      key: 'actions',
      render(row: UserResponse) {
          return h(
              NSpace,
              null,
              { default: () => [
                  h(
                      NButton,
                      { size: 'small', onClick: () => openEditModal(row) },
                      { default: () => 'Редактировать' }
                  ),
                  h(
                      NPopconfirm,
                      { onPositiveClick: () => handleDelete(row) },
                      {
                          default: () => 'Вы уверены, что хотите удалить этого пользователя?',
                          trigger: () => h(
                              NButton,
                              { size: 'small', type: 'error' },
                              { default: () => 'Удалить' }
                          )
                      }
                  )
              ]}
          )
      }
  }
]

// Form handling
const showModal = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const currentUserId = ref<string | null>(null)

const formModel = ref<{
    email: string;
    password?: string;
    first_name: string;
    last_name: string;
    role_id: string;
    status: string;
    team_ids: string[];
}>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '',
    status: 'active',
    team_ids: []
})

// TODO: In a real app we would load roles and teams from the API
const mockRoleOptions = [
    { label: 'Admin', value: '550e8400-e29b-41d4-a716-446655440000' },
    { label: 'Manager', value: '497f6eca-6276-4993-bfeb-53cbbbba6f08' },
    { label: 'User', value: '3b09087c-6500-4b2e-a5ac-6ba52f75a6be' }
]

const statusOptions = [
    { label: 'Активен', value: 'active' },
    { label: 'Неактивен', value: 'inactive' }
]

const resetForm = () => {
    formModel.value = {
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role_id: '',
        status: 'active',
        team_ids: []
    }
    currentUserId.value = null
    isEditing.value = false
}

const handleDelete = async (user: UserResponse) => {
    try {
        await userApi.deleteUser(user.id)
        message.success('Пользователь удален')
        fetchUsers()
    } catch (e: any) {
        message.error(`Ошибка при удалении пользователя: ${e.message}`)
    }
}

const openCreateModal = () => {
    resetForm()
    isEditing.value = false
    showModal.value = true
}

const openEditModal = (user: UserResponse) => {
    resetForm()
    isEditing.value = true
    currentUserId.value = user.id
    formModel.value = {
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role_id: user.role?.id || '',
        status: user.status || 'active',
        team_ids: [] // We might extract this from user.team_assignments if available
    }
    showModal.value = true
}

const handleSubmit = async () => {
    try {
        isSubmitting.value = true
        if (isEditing.value && currentUserId.value) {
            const updatePayload: UserUpdateRequest = {
                email: formModel.value.email,
                first_name: formModel.value.first_name,
                last_name: formModel.value.last_name,
                role_id: formModel.value.role_id,
                status: formModel.value.status,
                team_ids: formModel.value.team_ids,
            }
            await userApi.updateUser(currentUserId.value, updatePayload)
            message.success('Пользователь обновлен')
        } else {
            const createPayload: UserCreateRequest = {
                email: formModel.value.email,
                password: formModel.value.password,
                first_name: formModel.value.first_name,
                last_name: formModel.value.last_name,
                role_id: formModel.value.role_id,
                team_ids: formModel.value.team_ids,
            }
            await userApi.createUser(createPayload)
            message.success('Пользователь создан')
        }
        showModal.value = false
        fetchUsers() // Refresh list
    } catch (e: any) {
        message.error(`Ошибка сохранения: ${e.message}`)
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
  <div style="padding: 24px;">
    <n-page-header title="Управление пользователями" style="margin-bottom: 24px;">
      <template #extra>
        <n-button type="primary" @click="openCreateModal">
          Добавить пользователя
        </n-button>
      </template>
    </n-page-header>

    <n-card bordered :content-style="{ padding: '16px' }">
      <n-data-table
        :columns="columns"
        :data="users"
        :loading="isLoading"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
      />
    </n-card>

    <n-modal v-model:show="showModal" :title="isEditing ? 'Редактировать пользователя' : 'Создать пользователя'" preset="card" style="width: 500px">
      <n-form :model="formModel" @submit.prevent="handleSubmit">
        <n-form-item label="Email" path="email">
          <n-input v-model:value="formModel.email" placeholder="example@mail.com" />
        </n-form-item>

        <n-form-item v-if="!isEditing" label="Пароль" path="password">
          <n-input type="password" v-model:value="formModel.password" placeholder="Введите пароль" show-password-on="click" />
        </n-form-item>

        <n-space item-style="width: calc(50% - 6px);">
            <n-form-item label="Имя" path="first_name">
               <n-input v-model:value="formModel.first_name" placeholder="Иван" />
            </n-form-item>
            <n-form-item label="Фамилия" path="last_name">
               <n-input v-model:value="formModel.last_name" placeholder="Иванов" />
            </n-form-item>
        </n-space>

        <n-form-item label="Роль" path="role_id">
          <!-- TODO: Load roles dynamically instead of using mockOptions if required -->
          <n-select v-model:value="formModel.role_id" :options="mockRoleOptions" placeholder="Выберите роль" />
        </n-form-item>
        
        <n-form-item v-if="isEditing" label="Статус" path="status">
          <n-select v-model:value="formModel.status" :options="statusOptions" />
        </n-form-item>

        <n-space justify="end" style="margin-top: 24px;">
          <n-button @click="showModal = false">Отмена</n-button>
          <n-button type="primary" attr-type="submit" :loading="isSubmitting">
            Сохранить
          </n-button>
        </n-space>
      </n-form>
    </n-modal>
  </div>
</template>
