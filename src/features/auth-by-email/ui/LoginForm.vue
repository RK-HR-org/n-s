<script setup lang="ts">
import { ref } from 'vue';
import { useMessage, NForm, NFormItem, NInput, NButton, NSpace, NAlert } from 'naive-ui';
import { useUserStore } from '@/entities/user';
import type { LoginRequest } from '@/shared/api';

const userStore = useUserStore();
const message = useMessage();

const formRef = ref<InstanceType<typeof NForm> | null>(null);
const loading = ref(false);
const errorMsg = ref('');

const formValue = ref<LoginRequest>({
  email: '',
  password: ''
});

const rules = {
  email: {
    required: true,
    message: 'Введите email',
    trigger: 'blur'
  },
  password: {
    required: true,
    message: 'Введите пароль',
    trigger: 'blur'
  }
};

const handleLogin = async (e: Event) => {
  e.preventDefault();
  
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true;
      errorMsg.value = '';
      try {
        await userStore.login(formValue.value);
        message.success('Успешный вход!');
      } catch (err: any) {
        errorMsg.value = err.message || 'Ошибка авторизации';
        message.error(errorMsg.value);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<template>
  <div style="max-width: 400px; margin: 0 auto;">
    <n-alert v-if="errorMsg" type="error" style="margin-bottom: 24px;">
      {{ errorMsg }}
    </n-alert>
    
    <n-form
      ref="formRef"
      :model="formValue"
      :rules="rules"
      size="large"
      @submit="handleLogin"
    >
      <n-form-item path="email" label="Email">
        <n-input v-model:value="formValue.email" placeholder="example@email.com" />
      </n-form-item>
      
      <n-form-item path="password" label="Пароль">
        <n-input 
          v-model:value="formValue.password" 
          type="password" 
          show-password-on="click" 
          placeholder="Ваш пароль" 
        />
      </n-form-item>
      
      <n-space justify="end" style="margin-top: 24px;">
        <n-button 
          attr-type="submit" 
          type="primary" 
          :loading="loading" 
          block
        >
          Войти
        </n-button>
      </n-space>
    </n-form>
  </div>
</template>
