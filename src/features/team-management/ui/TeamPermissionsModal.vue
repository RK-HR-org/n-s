<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NSpace, NButton, NCheckbox, NSpin, useMessage, NDivider } from 'naive-ui';
import { teamApi, type TeamResponse, type PermissionType, type TeamPermissionResponse } from '@/entities/team';

const props = defineProps<{
    show: boolean;
    team?: TeamResponse;
}>();

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void;
}>();

const message = useMessage();
const isLoading = ref(false);
const teamPermissions = ref<TeamPermissionResponse[]>([]);

const permissionDict: Record<PermissionType, string> = {
    add_users: 'Добавление пользователей',
    edit_users: 'Редактирование пользователей',
    delete_users: 'Удаление пользователей',
    view_users_list: 'Просмотр списка пользователей',
    view_user_details: 'Просмотр деталей пользователя',
    view_teams_list: 'Просмотр списка команд',
    view_team_details: 'Просмотр деталей команды',
    execute_hh_search: 'Выполнение поиска HH',
    manage_team_permissions: 'Управление правами команды',
    manage_team_quotas: 'Управление квотами команды',
};

const allPermissions: { value: PermissionType; label: string }[] = Object.entries(permissionDict).map(([k, v]) => ({
    value: k as PermissionType,
    label: v
}));

const fetchPermissions = async () => {
    if (!props.team) return;
    isLoading.value = true;
    try {
        const response = await teamApi.getTeamPermissions(props.team.id);
        teamPermissions.value = response.permissions;
    } catch (error: any) {
        message.error(error.message || 'Ошибка загрузки прав команды');
    } finally {
        isLoading.value = false;
    }
};

watch(() => props.show, (newVal) => {
    if (newVal && props.team) {
        fetchPermissions();
    } else {
        teamPermissions.value = [];
    }
});

const handleClose = () => {
    emit('update:show', false);
};

const isPermissionChecked = (permValue: PermissionType) => {
    return teamPermissions.value.some((p: TeamPermissionResponse) => p.permission_type === permValue);
};

const togglePermission = async (permValue: PermissionType, checked: boolean) => {
    if (!props.team) return;
    const teamId = props.team.id;
    
    try {
        if (checked) {
            const newPerm = await teamApi.addTeamPermission(teamId, permValue);
            teamPermissions.value.push(newPerm);
            message.success(`Право "${permissionDict[permValue]}" добавлено`);
        } else {
            await teamApi.removeTeamPermission(teamId, permValue);
            teamPermissions.value = teamPermissions.value.filter((p: TeamPermissionResponse) => p.permission_type !== permValue);
            message.success(`Право "${permissionDict[permValue]}" удалено`);
        }
    } catch (error: any) {
        message.error(error.message || 'Ошибка изменения прав');
        // Revert UI context on error by re-fetching
        fetchPermissions();
    }
};

</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    preset="card"
    :title="team ? `Права доступа: ${team.name}` : 'Права доступа'"
    style="width: 500px"
    size="huge"
    :bordered="false"
  >
    <n-spin :show="isLoading">
      <n-space vertical size="large">
        <template v-for="perm in allPermissions" :key="perm.value">
          <n-checkbox
            :checked="isPermissionChecked(perm.value)"
            @update:checked="(checked) => togglePermission(perm.value, checked)"
          >
            {{ perm.label }}
          </n-checkbox>
        </template>
      </n-space>
    </n-spin>

    <n-divider />
    <n-space justify="end">
      <n-button @click="handleClose">Закрыть</n-button>
    </n-space>
  </n-modal>
</template>
