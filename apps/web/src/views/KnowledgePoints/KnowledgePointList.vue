<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">知识点管理</h1>
      <button class="primary" @click="openCreate()">新建知识点</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="tree">
      <div v-for="point in tree" :key="point.id" class="tree-node">
        <div class="node-content">
          <span class="node-name">{{ point.name }}</span>
          <span class="node-count">{{ point.questionCount }} 题</span>
          <div class="node-actions">
            <button class="icon-btn" @click.stop="openCreate(point.id)" title="添加子节点">+</button>
            <button class="icon-btn" @click.stop="openEdit(point)" title="编辑">✏️</button>
            <button class="icon-btn delete" @click.stop="handleDelete(point)" title="删除">🗑️</button>
          </div>
        </div>
        <div v-if="point.children?.length" class="children">
          <div v-for="child in point.children" :key="child.id" class="tree-node child">
            <div class="node-content">
              <span class="node-name">{{ child.name }}</span>
              <span class="node-count">{{ child.questionCount }} 题</span>
              <div class="node-actions">
                <button class="icon-btn" @click.stop="openEdit(child)" title="编辑">✏️</button>
                <button class="icon-btn delete" @click.stop="handleDelete(child)" title="删除">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal
      :visible="showModal"
      :title="editingPoint ? '编辑知识点' : '新建知识点'"
      :loading="submitting"
      @close="closeModal"
      @confirm="handleSubmit"
    >
      <div class="form-group">
        <label>名称</label>
        <input v-model="formData.name" placeholder="输入知识点名称" />
      </div>
      <div class="form-group">
        <label>父级知识点</label>
        <select v-model.number="formData.parentId">
          <option :value="null">顶级</option>
          <option v-for="point in flatPoints" :key="point.id" :value="point.id">
            {{ point.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>排序权重</label>
        <input v-model.number="formData.sortOrder" type="number" min="0" />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { knowledgePointsApi } from '@/api';
import type { KnowledgePoint } from '@interview-quiz/shared';
import Modal from '@/components/Modal.vue';

const tree = ref<KnowledgePoint[]>([]);
const loading = ref(false);
const showModal = ref(false);
const submitting = ref(false);
const editingPoint = ref<KnowledgePoint | null>(null);

const formData = ref<{
  name: string;
  parentId: number | null;
  sortOrder: number;
}>({
  name: '',
  parentId: null,
  sortOrder: 0,
});

const flatPoints = computed(() => {
  const result: KnowledgePoint[] = [];
  function flatten(items: KnowledgePoint[]) {
    for (const item of items) {
      result.push(item);
      if (item.children?.length) {
        flatten(item.children);
      }
    }
  }
  flatten(tree.value);
  return result;
});

async function fetchTree() {
  loading.value = true;
  try {
    tree.value = await knowledgePointsApi.tree();
  } finally {
    loading.value = false;
  }
}

function openCreate(parentId?: number) {
  editingPoint.value = null;
  formData.value = {
    name: '',
    parentId: parentId ?? null,
    sortOrder: 0,
  };
  showModal.value = true;
}

function openEdit(point: KnowledgePoint) {
  editingPoint.value = point;
  formData.value = {
    name: point.name,
    parentId: point.parentId,
    sortOrder: point.sortOrder,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingPoint.value = null;
}

async function handleSubmit() {
  if (!formData.value.name.trim()) return;

  submitting.value = true;
  try {
    if (editingPoint.value) {
      await knowledgePointsApi.update(editingPoint.value.id, formData.value);
    } else {
      await knowledgePointsApi.create(formData.value);
    }
    await fetchTree();
    closeModal();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(point: KnowledgePoint) {
  if (!confirm(`确定删除「${point.name}」吗？`)) return;

  try {
    await knowledgePointsApi.remove(point.id);
    await fetchTree();
  } catch (err: any) {
    alert(err.message || '删除失败');
  }
}

onMounted(fetchTree);
</script>

<style scoped>
.tree {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tree-node {
  background: #fff;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.tree-node.child {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  background: #f9fafb;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.node-name {
  font-weight: 500;
  flex: 1;
}

.node-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.node-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .node-actions {
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

.children {
  margin-top: 0.5rem;
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

.form-group input,
.form-group select {
  width: 100%;
}
</style>