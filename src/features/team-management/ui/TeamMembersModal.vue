<script setup lang="ts">
import { ref, watch, h } from 'vue';
import { NModal, NDataTable, NButton, NSpace, useMessage, type DataTableColumns, NText } from 'naive-ui';
import { teamApi, type TeamResponse, type TeamMemberInfo } from '@/entities/team';

const props = defineProps<{
    show: boolean;
    team?: TeamResponse;
}>();

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void;
}>();

const message = useMessage();
const isLoading = ref(false);
const members = ref<TeamMemberInfo[]>([]);

const fetchMembers = async () => {
    if (!props.team) return;
    isLoading.value = true;
    try {
        const response = await teamApi.getTeamMembers(props.team.id);
        members.value = response.members;
    } catch (error: any) {
        message.error(error.message || 'Ошибка загрузки участников');
    } finally {
        isLoading.value = false;
    }
};

watch(() => props.show, (newVal) => {
    if (newVal && props.team) {
        fetchMembers();
    } else {
        members.value = [];
    }
});

const handleClose = () => {
    emit('update:show', false);
};

const columns: DataTableColumns<TeamMemberInfo> = [
    {
        title: 'Имя',
        key: 'name',
        render(row) {
            const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ');
            return fullName || 'Не указано';
        }
    },
    {
        title: 'Email',
        key: 'email',
    },
    {
        title: 'Роль в команде',
        key: 'role',
        render(row) {
            return row.is_manager ? h(NText, { type: 'success', strong: true }, { default: () => 'Менеджер' }) : 'Участник';
        }
    },
    {
        title: 'Присоединился',
        key: 'joined_at',
        render(row) {
            return new Date(row.joined_at).toLocaleDateString('ru-RU');
        }
    }
];
</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    preset="card"
    :title="team ? `Участники: ${team.name}` : 'Участники'"
    style="width: 700px"
    size="huge"
    :bordered="false"
  >
    <n-data-table
      :columns="columns"
      :data="members"
      :loading="isLoading"
      :bordered="false"
      size="medium"
    />
    <n-space justify="end" style="margin-top: 24px;">
      <n-button @click="handleClose">Закрыть</n-button>
    </n-space>
  </n-modal>
</template>
