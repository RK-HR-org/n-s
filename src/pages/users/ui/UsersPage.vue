<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { 
  NPageHeader, NCard, NDataTable, NButton, NSpace, NTag, NInput, NForm, NFormItem, 
  NSelect, NModal, useMessage, NPopconfirm, NCheckbox, NDivider, NText
} from 'naive-ui'
import { 
  userApi, type UserResponse, type UserCreateRequest, type UserUpdateRequest, type UserTeamAssignment,
  roleApi, type RoleResponse,
  teamApi, type TeamResponse
} from '@/shared/api'

const message = useMessage()

// ── Users ────────────────────────────────────────────────────────────────────
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

// ── Roles ─────────────────────────────────────────────────────────────────────
const roles = ref<RoleResponse[]>([])
const rolesLoading = ref(false)

const fetchRoles = async () => {
    try {
        rolesLoading.value = true
        roles.value = await roleApi.getRoles()
    } catch (e: any) {
        message.error(`Ошибка загрузки ролей: ${e.message}`)
    } finally {
        rolesLoading.value = false
    }
}

const roleOptions = computed(() =>
    roles.value.map(r => ({ label: r.name, value: r.id }))
)

// ── Teams ─────────────────────────────────────────────────────────────────────
const teams = ref<TeamResponse[]>([])
const teamsLoading = ref(false)

const fetchTeams = async () => {
    try {
        teamsLoading.value = true
        teams.value = await teamApi.getTeams()
    } catch (e: any) {
        message.error(`Ошибка загрузки команд: ${e.message}`)
    } finally {
        teamsLoading.value = false
    }
}

onMounted(() => {
    fetchUsers()
    fetchRoles()
    fetchTeams()
})

// ── Table columns ──────────────────────────────────────────────────────────────
const columns = [
  { title: 'Email', key: 'email' },
  { title: 'Имя', key: 'first_name', render: (row: UserResponse) => row.first_name || '—' },
  { title: 'Фамилия', key: 'last_name', render: (row: UserResponse) => row.last_name || '—' },
  { 
    title: 'Роль', 
    key: 'role.name',
    render(row: UserResponse) { return row.role?.name || 'Нет роли' }
  },
  {
    title: 'Команды',
    key: 'teams',
    render(row: UserResponse) {
        if (!row.teams?.length) return '—'
        return h(NSpace, { size: 4 }, {
            default: () => row.teams.map(t =>
                h(NTag, { size: 'small', bordered: false }, { default: () => t.name })
            )
        })
    }
  },
  {
    title: 'Статус',
    key: 'status',
    render(row: UserResponse) {
        const typeMap: Record<string, 'success' | 'default' | 'error'> = {
            active: 'success',
            inactive: 'default',
            blocked: 'error',
        }
        const labelMap: Record<string, string> = {
            active: 'Активен',
            inactive: 'Неактивен',
            blocked: 'Заблокирован',
        }
        return h(
            NTag,
            { type: typeMap[row.status] ?? 'default', bordered: false },
            { default: () => labelMap[row.status] ?? row.status }
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

// ── Form state ─────────────────────────────────────────────────────────────────
const showModal = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const currentUserId = ref<string | null>(null)

interface FormModel {
    email: string
    password: string
    first_name: string
    last_name: string
    role_id: string
    status: string
    /** team_assignments — приоритетный способ (приоритет над team_ids) */
    team_assignments: UserTeamAssignment[]
}

const defaultForm = (): FormModel => ({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '',
    status: 'active',
    team_assignments: [],
})

const formModel = ref<FormModel>(defaultForm())

const statusOptions = [
    { label: 'Активен', value: 'active' },
    { label: 'Неактивен', value: 'inactive' },
    { label: 'Заблокирован', value: 'blocked' },
]

// ── Team assignment helpers ────────────────────────────────────────────────────
const teamOptions = computed(() =>
    teams.value.map(t => ({ label: t.name, value: t.id }))
)

/** IDs команд, выбранных в team_assignments */
const selectedTeamIds = computed(() =>
    formModel.value.team_assignments.map(a => a.team_id)
)

const onTeamsChange = (ids: string[]) => {
    // добавляем новые
    for (const id of ids) {
        if (!selectedTeamIds.value.includes(id)) {
            formModel.value.team_assignments.push({ team_id: id, is_manager: false })
        }
    }
    // удаляем снятые
    formModel.value.team_assignments = formModel.value.team_assignments.filter(
        a => ids.includes(a.team_id)
    )
}

const setManager = (teamId: string, isManager: boolean) => {
    const assignment = formModel.value.team_assignments.find(a => a.team_id === teamId)
    if (assignment) assignment.is_manager = isManager
}

const getAssignment = (teamId: string): UserTeamAssignment | undefined =>
    formModel.value.team_assignments.find(a => a.team_id === teamId)

const teamNameById = (id: string) =>
    teams.value.find(t => t.id === id)?.name ?? id

// ── CRUD handlers ──────────────────────────────────────────────────────────────
const resetForm = () => {
    formModel.value = defaultForm()
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
    showModal.value = true
}

const openEditModal = (user: UserResponse) => {
    resetForm()
    isEditing.value = true
    currentUserId.value = user.id
    formModel.value = {
        email: user.email,
        password: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role_id: user.role?.id || '',
        status: user.status || 'active',
        team_assignments: (user.teams ?? []).map(t => ({
            team_id: t.id,
            is_manager: (t as any).is_manager ?? false,
        })),
    }
    showModal.value = true
}

const handleSubmit = async () => {
    try {
        isSubmitting.value = true
        if (isEditing.value && currentUserId.value) {
            const updatePayload: UserUpdateRequest = {
                email: formModel.value.email,
                first_name: formModel.value.first_name || undefined,
                last_name: formModel.value.last_name || undefined,
                role_id: formModel.value.role_id,
                status: formModel.value.status,
                team_ids: formModel.value.team_assignments.map(a => a.team_id),
                team_assignments: formModel.value.team_assignments,
            }
            await userApi.updateUser(currentUserId.value, updatePayload)
            message.success('Пользователь обновлен')
        } else {
            const createPayload: UserCreateRequest = {
                email: formModel.value.email,
                password: formModel.value.password,
                first_name: formModel.value.first_name || undefined,
                last_name: formModel.value.last_name || undefined,
                role_id: formModel.value.role_id,
                team_ids: formModel.value.team_assignments.map(a => a.team_id),
                team_assignments: formModel.value.team_assignments,
            }
            await userApi.createUser(createPayload)
            message.success('Пользователь создан')
        }
        showModal.value = false
        fetchUsers()
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

    <!-- ── Create / Edit Modal ──────────────────────────────────────────── -->
    <n-modal
      v-model:show="showModal"
      :title="isEditing ? 'Редактировать пользователя' : 'Создать пользователя'"
      preset="card"
      style="width: 560px"
    >
      <n-form :model="formModel" @submit.prevent="handleSubmit">

        <!-- Email -->
        <n-form-item label="Email" path="email" required>
          <n-input v-model:value="formModel.email" placeholder="user@example.com" />
        </n-form-item>

        <!-- Password (только при создании) -->
        <n-form-item v-if="!isEditing" label="Пароль" path="password" required>
          <n-input
            type="password"
            v-model:value="formModel.password"
            placeholder="Не менее 8 символов"
            show-password-on="click"
          />
        </n-form-item>

        <!-- Имя / Фамилия -->
        <n-space item-style="width: calc(50% - 6px);">
          <n-form-item label="Имя" path="first_name">
            <n-input v-model:value="formModel.first_name" placeholder="Иван" />
          </n-form-item>
          <n-form-item label="Фамилия" path="last_name">
            <n-input v-model:value="formModel.last_name" placeholder="Иванов" />
          </n-form-item>
        </n-space>

        <!-- Роль -->
        <n-form-item label="Роль" path="role_id" required>
          <n-select
            v-model:value="formModel.role_id"
            :options="roleOptions"
            :loading="rolesLoading"
            placeholder="Выберите роль"
          />
        </n-form-item>

        <!-- Статус (только при редактировании) -->
        <n-form-item v-if="isEditing" label="Статус" path="status">
          <n-select v-model:value="formModel.status" :options="statusOptions" />
        </n-form-item>

        <!-- Назначение в команды -->
        <n-divider style="margin: 12px 0;" />

        <!-- Выпадающий список команд (мультиселект) -->
        <n-form-item label="Команды" path="team_assignments">
          <n-select
            :value="selectedTeamIds"
            @update:value="onTeamsChange"
            :options="teamOptions"
            :loading="teamsLoading"
            multiple
            clearable
            placeholder="Выберите команды"
          />
        </n-form-item>

        <!-- Флаги «Менеджер» для каждой выбранной команды -->
        <template v-if="selectedTeamIds.length">
          <n-form-item
            v-for="teamId in selectedTeamIds"
            :key="teamId"
            :label="teamNameById(teamId)"
            label-placement="left"
            style="margin-bottom: 4px;"
          >
            <n-checkbox
              :checked="getAssignment(teamId)?.is_manager ?? false"
              @update:checked="v => setManager(teamId, v)"
            >
              <n-text depth="3" style="font-size: 12px;">Менеджер команды</n-text>
            </n-checkbox>
          </n-form-item>
        </template>

        <!-- Кнопки -->
        <n-space justify="end" style="margin-top: 16px;">
          <n-button @click="showModal = false">Отмена</n-button>
          <n-button type="primary" attr-type="submit" :loading="isSubmitting">
            Сохранить
          </n-button>
        </n-space>

      </n-form>
    </n-modal>
  </div>
</template>
