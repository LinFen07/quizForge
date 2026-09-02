<template>
  <button
    :class="['btn', variant, size, { loading, disabled }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      class="spinner"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
  },
);

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn.md {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn.lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn.primary {
  background: #3b82f6;
  color: #fff;
}

.btn.primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn.secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn.secondary:hover:not(:disabled) {
  background: #d1d5db;
}

.btn.danger {
  background: #ef4444;
  color: #fff;
}

.btn.danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn.ghost {
  background: transparent;
  color: #374151;
}

.btn.ghost:hover:not(:disabled) {
  background: #f3f4f6;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
