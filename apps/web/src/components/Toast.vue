<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="visible"
        :class="['toast', type]"
      >
        <div class="toast-content">
          <span class="toast-icon">{{ icon }}</span>
          <span class="toast-message">{{ message }}</span>
        </div>
        <button
          class="toast-close"
          @click="close"
        >
          &times;
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const props = defineProps<{
  message: string;
  type?: 'success' | 'error' | 'warning';
  duration?: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const visible = ref(true);

const icon = computed(() => {
  switch (props.type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    default:
      return 'ℹ';
  }
});

function close() {
  visible.value = false;
  emit('close');
}

watch(
  () => props.message,
  () => {
    visible.value = true;
    setTimeout(() => {
      close();
    }, props.duration || 3000);
  },
  { immediate: true },
);
</script>

<style scoped>
.toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #fff;
  font-size: 0.875rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toast-icon {
  font-size: 1rem;
  font-weight: bold;
}

.toast-message {
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #fff;
}

.toast.success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.toast.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.toast.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
</style>
