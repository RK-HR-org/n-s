<script setup lang="ts">
import { NCard, NText, NButton, NSpace, useMessage, NAlert, NH3, NList, NListItem } from 'naive-ui'
import { LoginForm } from '@/features/auth-by-email'
import { useUserStore } from '@/entities/user'
import { useRouter } from 'vue-router'

const message = useMessage()
const userStore = useUserStore()
const router = useRouter()

</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 160px); padding: 24px;">
    <n-card 
      v-if="!userStore.isAuthenticated"
      style="max-width: 440px; width: 100%; border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.08);" 
      :bordered="false"
    >
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 28px; font-weight: 600; margin: 0 0 8px 0; color: var(--n-text-color);">Добро пожаловать</h1>
        <n-text depth="3">Войдите в систему для продолжения</n-text>
      </div>
      <LoginForm />
    </n-card>

    <div v-else style="max-width: 800px; width: 100%; display: flex; flex-direction: column; gap: 24px;">
      <n-card style="border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.08);" :bordered="false">
        <div style="text-align: center; padding: 16px 0;">
          <div style="font-size: 48px; margin-bottom: 16px;">👋</div>
          <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">Добро пожаловать, {{ userStore.user?.first_name }}!</h2>
          <n-text depth="3" style="display: block; margin-bottom: 24px;">Рады видеть вас в системе!</n-text>

          <n-alert title="Приложение в разработке" type="info" style="margin-bottom: 24px; text-align: left; border-radius: 8px;">
            В данный момент платформа находится на стадии активной разработки. Некоторые функции могут работать не в полном объеме или находиться в процессе доработки. 
            Команда разработки будет очень признательна за любую обратную связь и сообщения о найденных ошибках. <br>Связаться с разработчиком можно по ссылке <a href="https://xlnk.ms/open/profile/36ef1529-d614-51da-8587-9b9b2d047c52" target="_blank" rel="noopener noreferrer" style="color: var(--n-text-color);">Опарин Сергей в Express</a>
          </n-alert>

          <div style="text-align: left; margin-bottom: 32px;">
            <n-h3 style="margin-top: 0; margin-bottom: 16px;">Краткая инструкция:</n-h3>
            <n-list bordered style="border-radius: 8px;">
              <n-list-item>
                <strong>Поиск резюме и вакансий:</strong> Перейдите в соответствующие разделы в боковом меню. Заполните форму нужными параметрами (ключевые слова, регион и т.д.) и нажмите "Найти". Будет создана новая поисковая сессия.
              </n-list-item>
              <n-list-item>
                <strong>История поиска:</strong> В разделе "История поиска" отображаются все ваши предыдущие сессии. Там же можно отслеживать статус выполнения ваших запросов.
              </n-list-item>
              <n-list-item>
                <strong>Просмотр и скачивание Excel:</strong> Открыв конкретную поисковую сессию, вы увидите таблицу с найденными результатами. Для скачивания данных воспользуйтесь кнопкой "Экспорт в Excel", чтобы сохранить таблицу на ваше устройство.
              </n-list-item>
            </n-list>
          </div>

          <n-space justify="center" size="large">
            <n-button size="large" @click="userStore.logout" style="border-radius: 8px; min-width: 200px;">
              Выйти из аккаунта
            </n-button>
          </n-space>
        </div>
      </n-card>
    </div>
  </div>
</template>
