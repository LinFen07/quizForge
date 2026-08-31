<template>
  <div v-if="question" class="question-detail">
    <div class="page-header">
      <h1 class="page-title">题目详情</h1>
      <div class="header-actions">
        <button class="secondary" @click="router.back()">返回</button>
        <button class="secondary" @click="openEdit()">编辑</button>
        <button class="danger" @click="handleDelete">删除</button>
      </div>
    </div>

    <div class="card">
      <div class="q-header">
        <span class="q-type">{{ question.type }}</span>
        <span class="q-diff">{{ '★'.repeat(question.difficulty) }}</span>
      </div>
      <h2>{{ question.title }}</h2>
      <div class="q-meta">
        <span v-if="question.knowledgePoint">知识点: {{ question.knowledgePoint.name }}</span>
        <span v-if="question.source">来源: {{ question.source }}</span>
      </div>
      <div class="q-tags">
        <span v-for="tag in question.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
      </div>
    </div>

    <div class="card answer-section">
      <h3>参考解答</h3>
      <div class="answer-content">{{ question.referenceAnswer || '暂无解答' }}</div>
    </div>

    <div v-if="question.practiceRecords?.length" class="card">
      <h3>历史刷题记录</h3>
      <div v-for="r in question.practiceRecords" :key="r.id" class="record-item">
        <span :class="['result', r.result]">{{ r.result }}</span>
        <span class="time">{{ new Date(r.practicedAt).toLocaleString() }}</span>
      </div>
    </div>

    <Modal
      :visible="showModal"
      :title="'编辑题目'"
      :loading="submitting"
      @close="closeModal"
      @confirm="handleSubmit"
    >
      <div class="form-group">
        <label>题干</label>
        <textarea v-model="formData.title" rows="3" placeholder="输入题目内容"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>题型</label>
          <select v-model="formData.type">
            <option value="concept">概念题</option>
            <option value="coding">手写题</option>
            <option value="scene">场景题</option>
            <option value="algorithm">算法题</option>
          </select>
        </div>
        <div class="form-group">
          <label>难度</label>
          <select v-model.number="formData.difficulty">
            <option v-for="d in 5" :key="d" :value="d">{{ '★'.repeat(d) }}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>知识点</label>
        <select v-model.number="formData.knowledgePointId">
          <option :value="null">无</option>
          <option v-for="kp in flatKnowledgePoints" :key="kp.id" :value="kp.id">
            {{ kp.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>标签</label>
        <div class="tag-select">
          <label v-for="tag in allTags" :key="tag.id" class="tag-option">
            <input type="checkbox" :value="tag.id" v-model="formData.tagIds" />
            <span class="tag-name">{{ tag.name }}</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>参考解答</label>
        <textarea v-model="formData.referenceAnswer" rows="4" placeholder="Markdown 格式"></textarea>
      </div>
      <div class="form-group">
        <label>来源</label>
        <input v-model="formData.source" placeholder="如：字节 2024 二面" />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { questionsApi, knowledgePointsApi, tagsApi } from '@/api';
import type { Question, KnowledgePoint, Tag } from '@interview-quiz/shared';
import Modal from '@/components/Modal.vue';

const route = useRoute();
const router = useRouter();
const question = ref<Question | null>(null);

const showModal = ref(false);
const submitting = ref(false);

const allKnowledgePoints = ref<KnowledgePoint[]>([]);
const allTags = ref<Tag[]>([]);

const formData = reactive({
  title: '',
  type: 'concept',
  difficulty: 3,
  knowledgePointId: null as number | null,
  tagIds: [] as number[],
  referenceAnswer: '',
  source: '',
});

const flatKnowledgePoints = computed(() => {
  const result: KnowledgePoint[] = [];
  function flatten(items: KnowledgePoint[]) {
    for (const item of items) {
      result.push(item);
      if (item.children?.length) {
        flatten(item.children);
      }
    }
  }
  flatten(allKnowledgePoints.value);
  return result;
});

async function fetchQuestion() {
  const id = Number(route.params.id);
  question.value = await questionsApi.get(id);
}

function openEdit() {
  if (!question.value) return;
  Object.assign(formData, {
    title: question.value.title,
    type: question.value.type,
    difficulty: question.value.difficulty,
    knowledgePointId: question.value.knowledgePointId,
    tagIds: question.value.tags?.map(t => t.id) || [],
    referenceAnswer: question.value.referenceAnswer || '',
    source: question.value.source || '',
  });
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function handleSubmit() {
  if (!formData.title.trim() || !question.value) return;

  submitting.value = true;
  try {
    await questionsApi.update(question.value.id, { ...formData });
    await fetchQuestion();
    closeModal();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete() {
  if (!question.value) return;
  if (!confirm(`确定删除题目「${question.value.title.slice(0, 30)}...」吗？`)) return;

  try {
    await questionsApi.remove(question.value.id);
    router.push('/questions');
  } catch (err: any) {
    alert(err.message || '删除失败');
  }
}

onMounted(async () => {
  await fetchQuestion();
  const [kp, tag] = await Promise.all([
    knowledgePointsApi.tree(),
    tagsApi.list(),
  ]);
  allKnowledgePoints.value = kp;
  allTags.value = tag;
});
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 0.5rem;
}

.danger {
  background: #dc2626;
  color: #fff;
}

.danger:hover {
  background: #b91c1c;
}

.q-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.q-type {
  font-size: 0.75rem;
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.q-diff {
  color: #f59e0b;
}

.q-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.75rem 0;
}

.q-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.answer-section {
  margin-top: 1rem;
}

.answer-content {
  margin-top: 0.5rem;
  white-space: pre-wrap;
  line-height: 1.6;
}

.record-item {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.result.correct { color: #22c55e; }
.result.wrong { color: #ef4444; }
.result.fuzzy { color: #f59e0b; }

.time {
  color: #9ca3af;
  font-size: 0.875rem;
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
.form-group select,
.form-group textarea {
  width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.tag-select {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.tag-option input {
  width: auto;
}
</style>