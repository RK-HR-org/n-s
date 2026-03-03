<script setup lang="ts">
import { NLayoutFooter, NText, NSpace } from 'naive-ui'
</script>

<template>
  <n-layout-footer bordered style="padding: 24px;">
    <n-space justify="center">
      <n-text depth="3">
        © {{ new Date().getFullYear() }} PK HR IT
      </n-text>
    </n-space>
  </n-layout-footer>
</template>
