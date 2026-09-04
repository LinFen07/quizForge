<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="modal-overlay"
        @click.self="onClose"
      >
        <div class="modal">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button
              class="close-btn"
              @click="onClose"
            >
              &times;
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div class="modal-footer">
            <button
              class="secondary"
              @click="onClose"
            >
              取消
            </button>
            <button
              class="primary"
              :disabled="loading"
              @click="onConfirm"
            >
              {{ loading ? '提交中...' : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    confirmText?: string;
    loading?: boolean;
  }>(),
  {
    confirmText: '确定',
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

function onClose() {
  emit('close');
}

function onConfirm() {
  emit('confirm');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 15, 15, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #ffffff;
  border-radius: 4px;
  width: 90%;
  max-width: 480px;
  box-shadow:
    0 2px 8px rgba(15, 15, 15, 0.04),
    0 8px 24px rgba(15, 15, 15, 0.08);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9e9e7;
}

.modal-header h3 {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: #37352f;
  margin: 0;
}

.close-btn {
  background: none;
  font-size: 20px;
  color: #787774;
  padding: 0;
  line-height: 1;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: rgba(55, 53, 47, 0.06);
  color: #37352f;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e9e9e7;
}

.modal-footer button {
  min-width: 72px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
