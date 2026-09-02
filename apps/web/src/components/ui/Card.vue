<template>
  <div
    :class="['card', { padding, hoverable }]"
    @click="$emit('click', $event)"
  >
    <div
      v-if="$slots.header"
      class="card-header"
    >
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="card-footer"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: boolean;
    hoverable?: boolean;
  }>(),
  {
    padding: true,
    hoverable: false,
  },
);

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s;
}

.card.hoverable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-body {
  padding: 1.25rem;
}

.card-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}
</style>
