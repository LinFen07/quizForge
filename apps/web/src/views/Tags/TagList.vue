<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">标签管理</h1>
      <button class="primary" @click="openCreate()">新建标签</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="tag-grid">
      <div v-for="tag in tags" :key="tag.id" class="card tag-card">
        <div class="tag-color" :style="{ background: tag.color || '#6b7280' }"></div>
        <span class="tag-name">{{ tag.name }}</span>
        <span v-if="tag._count" class="tag-count">{{ tag._count.questions }} 题</span>
        <div class="tag-actions">
          <button class="icon-btn" @click.stop="openEdit(tag)" title="编辑">✏️</button>
          <button class="icon-btn delete" @click.stop="handleDelete(tag)" title="删除">🗑️</button>
        </div>
      </div>
    </div>

    <Modal
      :visible="showModal"
      :title="editingTag ? '编辑标签' : '新建标签'"
      :loading="submitting"
      @close="closeModal"
      @confirm="handleSubmit"
    >
      <div class="form-group">
        <label>名称</label>
        <input v-model="formData.name" placeholder="输入标签名称" />
      </div>
      <div class="form-group">
        <label>颜色</label>
        <div class="color-picker">
          <input type="color" v-model="formData.color" />
          <span class="color-value">{{ formData.color }}</span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { tagsApi } from '@/api';
import type { Tag } from '@interview-quiz/shared';
import Modal from '@/components/Modal.vue';

const tags = ref<(Tag & { _count?: { questions: number } })[]>([]);
const loading = ref(false);
const showModal = ref(false);
const submitting = ref(false);
const editingTag = ref<Tag | null>(null);

const formData = ref<{
  name: string;
  color: string;
}>({
  name: '',
  color: '#3b82f6',
});

async function fetchTags() {
  loading.value = true;
  try {
    tags.value = await tagsApi.list(true);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingTag.value = null;
  formData.value = {
    name: '',
    color: '#3b82f6',
  };
  showModal.value = true;
}

function openEdit(tag: Tag) {
  editingTag.value = tag;
  formData.value = {
    name: tag.name,
    color: tag.color || '#6b7280',
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingTag.value = null;
}

async function handleSubmit() {
  if (!formData.value.name.trim()) return;

  submitting.value = true;
  try {
    if (editingTag.value) {
      await tagsApi.update(editingTag.value.id, formData.value);
    } else {
      await tagsApi.create(formData.value);
    }
    await fetchTags();
    closeModal();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(tag: Tag) {
  if (!confirm(`确定删除标签「${tag.name}」吗？`)) return;

  try {
    await tagsApi.remove(tag.id);
    await fetchTags();
  } catch (err: any) {
    alert(err.message || '删除失败');
  }
}

onMounted(fetchTags);
</script>

<style scoped>
.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
}

.tag-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: box-shadow 0.2s;
}

.tag-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-name {
  font-weight: 500;
  flex: 1;
}

.tag-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.tag-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.tag-card:hover .tag-actions {
  opacity: 1;
}

.icon-btn {
  background: none;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 4px;
}

.icon-btn:hover {
  background: #f3f4f6;
}

.icon-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-group input {
  width: 100%;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker input[type="color"] {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.color-value {
  font-family: monospace;
  font-size: 0.875rem;
  color: #6b7280;
}
</style>