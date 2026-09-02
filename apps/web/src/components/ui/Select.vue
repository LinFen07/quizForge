<template>
  <div :class="['select-wrapper', { error, disabled }]">
    <label
      v-if="label"
      class="select-label"
    >{{ label }}</label>
    <select
      :value="modelValue"
      :disabled="disabled"
      class="select"
      @change="
        $emit(
          'update:modelValue',
          Number(($event.target as HTMLSelectElement).value) ||
            ($event.target as HTMLSelectElement).value,
        )
      "
    >
      <option
        v-if="placeholder"
        value=""
        disabled
      >
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <span
      v-if="error"
      class="error-text"
    >{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
interface Option {
  label: string;
  value: string | number;
}

withDefaults(
  defineProps<{
    modelValue: string | number;
    options: Option[];
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: '',
    label: '',
    error: '',
    disabled: false,
  },
);

defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();
</script>

<style scoped>
.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.select-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.select-wrapper.error .select {
  border-color: #ef4444;
}

.error-text {
  font-size: 0.75rem;
  color: #ef4444;
}
</style>
