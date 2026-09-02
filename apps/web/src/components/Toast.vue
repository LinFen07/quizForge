<template>
  <Teleport to="body">
    <div
      v-if="visible"
      :class="['toast', type]"
    >
      {{ message }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  message: string;
  type?: 'success' | 'error' | 'warning';
  duration?: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const visible = ref(true);

watch(
  () => props.message,
  () => {
    visible.value = true;
    setTimeout(() => {
      visible.value = false;
      emit('close');
    }, props.duration || 3000);
  },
  { immediate: true },
);
</script>
