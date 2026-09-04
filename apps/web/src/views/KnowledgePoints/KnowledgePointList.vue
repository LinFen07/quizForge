<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">
        知识点管理
      </h1>
      <button
        class="primary"
        @click="openCreate()"
      >
        新建知识点
      </button>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <div
      v-else
      class="tree"
    >
      <div
        v-for="point in tree"
        :key="point.id"
        class="tree-node"
      >
        <div class="node-content">
          <span
            class="node-name"
            @click="toggleExpand(point.id)"
          >
            {{ point.name }}
            <span
              class="expand-icon"
              :class="{ expanded: expandedId === point.id }"
            >▸</span>
          </span>
          <span class="node-count">{{ point.questionCount }} 题</span>
          <div class="node-actions">
            <button
              class="icon-btn"
              title="添加子节点"
              @click.stop="openCreate(point.id)"
            >
              +
            </button>
            <button
              class="icon-btn"
              title="编辑"
              @click.stop="openEdit(point)"
            >
              ✏️
            </button>
            <button
              class="icon-btn delete"
              title="删除"
              @click.stop="handleDelete(point)"
            >
              🗑️
            </button>
          </div>
        </div>

        <div
          v-if="expandedId === point.id"
          class="questions-panel"
        >
          <div
            v-if="loadingQuestions"
            class="loading"
          >
            加载中...
          </div>
          <div
            v-else-if="questions.length === 0"
            class="empty"
          >
            暂无题目
          </div>
          <div
            v-else
            class="question-list"
          >
            <div
              v-for="q in questions"
              :key="q.id"
              class="question-item"
              @click="router.push(`/questions/${q.id}`)"
            >
              <div class="q-header">
                <span class="q-type">{{ q.type }}</span>
                <span class="q-diff">{{ '★'.repeat(q.difficulty) }}</span>
              </div>
              <div class="q-title">
                {{ q.title }}
              </div>
              <div class="q-meta">
                <span v-if="q.source">来源: {{ q.source }}</span>
                <span
                  v-for="tag in q.tags"
                  :key="tag.id"
                  class="tag"
                >{{ tag.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="point.children?.length"
          class="children"
        >
          <div
            v-for="child in point.children"
            :key="child.id"
            class="tree-node child"
          >
            <div class="node-content">
              <span
                class="node-name"
                @click="toggleExpand(child.id)"
              >
                {{ child.name }}
                <span
                  class="expand-icon"
                  :class="{ expanded: expandedId === child.id }"
                >▸</span>
              </span>
              <span class="node-count">{{ child.questionCount }} 题</span>
              <div class="node-actions">
                <button
                  class="icon-btn"
                  title="编辑"
                  @click.stop="openEdit(child)"
                >
                  ✏️
                </button>
                <button
                  class="icon-btn delete"
                  title="删除"
                  @click.stop="handleDelete(child)"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div
              v-if="expandedId === child.id"
              class="questions-panel"
            >
              <div
                v-if="loadingQuestions"
                class="loading"
              >
                加载中...
              </div>
              <div
                v-else-if="questions.length === 0"
                class="empty"
              >
                暂无题目
              </div>
              <div
                v-else
                class="question-list"
              >
                <div
                  v-for="q in questions"
                  :key="q.id"
                  class="question-item"
                  @click="router.push(`/questions/${q.id}`)"
                >
                  <div class="q-header">
                    <span class="q-type">{{ q.type }}</span>
                    <span class="q-diff">{{ '★'.repeat(q.difficulty) }}</span>
                  </div>
                  <div class="q-title">
                    {{ q.title }}
                  </div>
                  <div class="q-meta">
                    <span v-if="q.source">来源: {{ q.source }}</span>
                    <span
                      v-for="tag in q.tags"
                      :key="tag.id"
                      class="tag"
                    >{{ tag.name }}</span>
                  </div>
                </div>
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
        <input
          v-model="formData.name"
          placeholder="输入知识点名称"
        >
      </div>
      <div class="form-group">
        <label>父级知识点</label>
        <select v-model.number="formData.parentId">
          <option :value="null">
            顶级
          </option>
          <option
            v-for="point in flatPoints"
            :key="point.id"
            :value="point.id"
          >
            {{ point.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>排序权重</label>
        <input
          v-model.number="formData.sortOrder"
          type="number"
          min="0"
        >
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { knowledgePointsApi, questionsApi } from '@/api';
import type { KnowledgePoint, Question } from '@interview-quiz/shared';
import Modal from '@/components/Modal.vue';

const router = useRouter();
const tree = ref<KnowledgePoint[]>([]);
const loading = ref(false);
const showModal = ref(false);
const submitting = ref(false);
const editingPoint = ref<KnowledgePoint | null>(null);

const expandedId = ref<number | null>(null);
const questions = ref<Question[]>([]);
const loadingQuestions = ref(false);

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

async function toggleExpand(id: number) {
  if (expandedId.value === id) {
    expandedId.value = null;
    questions.value = [];
    return;
  }

  expandedId.value = id;
  loadingQuestions.value = true;
  try {
    const result = await questionsApi.list({ knowledgePointId: id, pageSize: 100 });
    questions.value = result.items || [];
  } finally {
    loadingQuestions.value = false;
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
  gap: 8px;
}

.tree-node {
  background: #ffffff;
  border: 1px solid #e9e9e7;
  border-radius: 4px;
  padding: 12px 16px;
}

.tree-node.child {
  margin-left: 24px;
  margin-top: 8px;
  background: #f7f6f3;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-name {
  font-weight: 500;
  flex: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #37352f;
}

.node-name:hover {
  color: #2383e2;
}

.expand-icon {
  font-size: 10px;
  transition: transform 150ms ease;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.node-count {
  font-size: 12px;
  color: #787774;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 150ms ease;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.icon-btn {
  background: none;
  padding: 4px 8px;
  font-size: 14px;
  border-radius: 4px;
}

.icon-btn:hover {
  background: #f7f6f3;
}

.icon-btn.delete:hover {
  background: #fde8e8;
  color: #eb5757;
}

.children {
  margin-top: 8px;
}

.questions-panel {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e9e9e7;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-item {
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e9e9e7;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 150ms ease;
}

.question-item:hover {
  border-color: #2383e2;
}

.q-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.q-type {
  font-size: 12px;
  background: #f7f6f3;
  color: #787774;
  padding: 2px 8px;
  border-radius: 4px;
}

.q-diff {
  color: #d9730d;
  font-size: 14px;
}

.q-title {
  font-size: 14px;
  color: #37352f;
  margin-bottom: 6px;
}

.q-meta {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: #787774;
  flex-wrap: wrap;
}

.tag {
  background: #f7f6f3;
  padding: 2px 8px;
  border-radius: 4px;
}

.loading {
  text-align: center;
  padding: 24px;
  color: #787774;
}

.empty {
  text-align: center;
  padding: 24px;
  color: #787774;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #787774;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-group input,
.form-group select {
  width: 100%;
}
</style>
