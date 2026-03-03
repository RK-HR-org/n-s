<script setup lang="ts">
import { NLayout, NLayoutContent } from 'naive-ui';
import { TeamsTableWidget } from '@/widgets/teams-table';
</script>

<template>
  <n-layout>
    <n-layout-content style="padding: 24px;">
      <TeamsTableWidget />
    </n-layout-content>
  </n-layout>
</template>
