<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NDataTable, NButton, NSpace, NText, NPopconfirm, useMessage, type DataTableColumns } from 'naive-ui';
import { useTeamStore, teamApi, type TeamResponse } from '@/entities/team';
import { TeamModal, TeamMembersModal, TeamPermissionsModal } from '@/features/team-management';

const store = useTeamStore();
const message = useMessage();

const showModal = ref(false);
const showMembersModal = ref(false);
const showPermissionsModal = ref(false);
const editingTeam = ref<TeamResponse | undefined>(undefined);
const selectedTeam = ref<TeamResponse | undefined>(undefined);

onMounted(() => {
    store.fetchTeams();
});

const handleAddTeam = () => {
    editingTeam.value = undefined;
    showModal.value = true;
};

const handleEditTeam = (team: TeamResponse) => {
    editingTeam.value = team;
    showModal.value = true;
};

const handleDeleteTeam = async (teamId: string) => {
    try {
        await teamApi.deleteTeam(teamId);
        message.success('Команда удалена');
        store.fetchTeams();
    } catch (error: any) {
        message.error(error.message || 'Ошибка удаления');
    }
};

const handleOpenMembers = (team: TeamResponse) => {
    selectedTeam.value = team;
    showMembersModal.value = true;
};

const handleOpenPermissions = (team: TeamResponse) => {
    selectedTeam.value = team;
    showPermissionsModal.value = true;
};

const columns: DataTableColumns<TeamResponse> = [
    {
        title: 'Название',
        key: 'name',
    },
    {
        title: 'Описание',
        key: 'description',
    },
    {
        title: 'Создана',
        key: 'created_at',
        render(row) {
            return new Date(row.created_at).toLocaleDateString('ru-RU', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
    },
    {
        title: 'Действия',
        key: 'actions',
        align: 'right',
        render(row) {
            return h(
                NSpace,
                { justify: 'end' },
                {
                    default: () => [
                        h(NButton, {
                            size: 'small',
                            type: 'info',
                            onClick: () => handleOpenMembers(row)
                        }, { default: () => 'Участники' }),
                        h(NButton, {
                            size: 'small',
                            type: 'warning',
                            onClick: () => handleOpenPermissions(row)
                        }, { default: () => 'Права' }),
                        h(NButton, {
                            size: 'small',
                            onClick: () => handleEditTeam(row)
                        }, { default: () => 'Редактировать' }),
                        h(NPopconfirm, {
                            onPositiveClick: () => handleDeleteTeam(row.id),
                            negativeText: 'Отмена',
                            positiveText: 'Удалить'
                        }, {
                            trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => 'Удалить' }),
                            default: () => 'Удалить команду?'
                        })
                    ]
                }
            );
        }
    }
];
</script>

<template>
  <n-space vertical size="large">
    <n-space justify="space-between" align="center">
      <n-text style="font-size: 24px; font-weight: bold;">Управление командами</n-text>
      <n-button type="primary" @click="handleAddTeam">
        Добавить команду
      </n-button>
    </n-space>
    
    <n-data-table
      :columns="columns"
      :data="store.teams"
      :loading="store.isLoading"
      :bordered="false"
      size="large"
    />
    
    <TeamModal
      v-model:show="showModal"
      :team="editingTeam"
      @success="store.fetchTeams"
    />
    
    <TeamMembersModal
      v-model:show="showMembersModal"
      :team="selectedTeam"
    />
    
    <TeamPermissionsModal
      v-model:show="showPermissionsModal"
      :team="selectedTeam"
    />
  </n-space>
</template>
