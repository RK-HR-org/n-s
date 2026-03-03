<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from 'naive-ui';
import { teamApi, type TeamCreateUpdate, type TeamResponse } from '@/entities/team';

const props = defineProps<{
    show: boolean;
    team?: TeamResponse;
}>();

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void;
    (e: 'success'): void;
}>();

const message = useMessage();
const isLoading = ref(false);

const formData = ref<TeamCreateUpdate>({
    name: '',
    description: null
});

watch(() => props.show, (newVal) => {
    if (newVal) {
        if (props.team) {
            formData.value = {
                name: props.team.name,
                description: props.team.description
            };
        } else {
            formData.value = {
                name: '',
                description: null
            };
        }
    }
});

const handleClose = () => {
    emit('update:show', false);
};

const handleSubmit = async () => {
    if (!formData.value.name.trim()) {
        message.error('Название команды обязательно');
        return;
    }
    
    isLoading.value = true;
    try {
        if (props.team) {
            await teamApi.updateTeam(props.team.id, formData.value);
            message.success('Команда успешно обновлена');
        } else {
            await teamApi.createTeam(formData.value);
            message.success('Команда успешно создана');
        }
        emit('success');
        handleClose();
    } catch (error: any) {
        message.error(error.message || 'Ошибка при сохранении команды');
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    preset="card"
    :title="team ? 'Редактировать команду' : 'Добавить команду'"
    style="width: 500px"
    size="huge"
    :bordered="false"
  >
    <n-form @submit.prevent="handleSubmit">
      <n-form-item label="Название" required>
        <n-input v-model:value="formData.name" placeholder="Введите название команды" />
      </n-form-item>
      <n-form-item label="Описание">
        <n-input v-model:value="formData.description" type="textarea" placeholder="Введите описание (необязательно)" />
      </n-form-item>
      
      <n-space justify="end">
        <n-button @click="handleClose" :disabled="isLoading">Отмена</n-button>
        <n-button type="primary" attr-type="submit" :loading="isLoading">
          Сохранить
        </n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>
