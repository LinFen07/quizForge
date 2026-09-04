<template>
  <div :class="['input-wrapper', { error, disabled }]">
    <label
      v-if="label"
      class="input-label"
    >{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur', $event)"
    >
    <span
      v-if="error"
      class="error-text"
    >{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string | number;
    type?: string;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
  }>(),
  {
    type: 'text',
    placeholder: '',
    label: '',
    error: '',
    disabled: false,
  },
);

defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
}>();
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: #fff;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.input-wrapper.error .input {
  border-color: #ef4444;
}

.input-wrapper.error .input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-text {
  font-size: 0.75rem;
  color: #ef4444;
}
</style>
