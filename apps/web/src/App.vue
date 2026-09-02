<template>
  <router-view />
  <Toast
    v-for="(toast, idx) in toasts"
    :key="idx"
    :message="toast.message"
    :type="toast.type"
    @close="toasts.splice(idx, 1)"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import Toast from '@/components/Toast.vue';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning';
  visible: boolean;
}

const toasts = ref<ToastState[]>([]);

function handleToast(e: CustomEvent<ToastState>) {
  const toast = { ...e.detail, visible: true };
  toasts.value.push(toast);
  setTimeout(() => {
    const idx = toasts.value.indexOf(toast);
    if (idx > -1) toasts.value.splice(idx, 1);
  }, 3000);
}

onMounted(() => {
  window.addEventListener('toast', handleToast as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('toast', handleToast as EventListener);
});
</script>
