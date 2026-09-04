<template>
  <div
    v-if="question"
    class="question-detail"
  >
    <div class="page-header">
      <h1 class="page-title">
        题目详情
      </h1>
      <div class="header-actions">
        <button
          class="secondary"
          @click="router.back()"
        >
          返回
        </button>
        <button
          class="secondary"
          @click="openEdit()"
        >
          编辑
        </button>
        <button
          v-if="question.deletedAt"
          class="primary"
          @click="handleRestore"
        >
          恢复
        </button>
        <button
          v-else
          class="danger"
          @click="handleDelete"
        >
          删除
        </button>
      </div>
    </div>

    <div
      v-if="question.deletedAt"
      class="deleted-banner"
    >
      此题目已删除
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
        <span
          v-for="tag in question.tags"
          :key="tag.id"
          class="tag"
        >{{ tag.name }}</span>
        <span
          v-for="c in question.companies"
          :key="c.id"
          class="company"
        >{{ c.name }}</span>
      </div>
    </div>

    <div class="card answer-section">
      <h3>参考解答</h3>
      <div class="answer-content">
        <MarkdownRenderer
          v-if="question.referenceAnswer"
          :content="question.referenceAnswer"
        />
        <span
          v-else
          class="no-answer"
        >暂无解答</span>
      </div>
    </div>

    <div
      v-if="question.practiceRecords?.length"
      class="card"
    >
      <h3>历史刷题记录</h3>
      <div
        v-for="r in question.practiceRecords"
        :key="r.id"
        class="record-item"
      >
        <span :class="['result', r.result]">{{ r.result }}</span>
        <span class="time">{{ new Date(r.practicedAt).toLocaleString() }}</span>
      </div>
    </div>

    <div
      v-if="auditLogs.length > 0"
      class="card"
    >
      <h3>操作记录</h3>
      <div
        v-for="log in auditLogs"
        :key="log.id"
        class="audit-item"
      >
        <span :class="['audit-action', log.action]">{{ log.action }}</span>
        <span class="audit-time">{{ new Date(log.createdAt).toLocaleString() }}</span>
        <span
          v-if="log.changes"
          class="audit-changes"
        >{{ formatChanges(log.changes) }}</span>
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
        <textarea
          v-model="formData.title"
          rows="3"
          placeholder="输入题目内容"
        />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>题型</label>
          <select v-model="formData.type">
            <option value="concept">
              概念题
            </option>
            <option value="coding">
              手写题
            </option>
            <option value="scene">
              场景题
            </option>
            <option value="algorithm">
              算法题
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>难度</label>
          <select v-model.number="formData.difficulty">
            <option
              v-for="d in 5"
              :key="d"
              :value="d"
            >
              {{ '★'.repeat(d) }}
            </option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>知识点</label>
        <select v-model.number="formData.knowledgePointId">
          <option :value="null">
            无
          </option>
          <option
            v-for="kp in filterStore.flatKnowledgePoints"
            :key="kp.id"
            :value="kp.id"
          >
            {{ kp.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>标签</label>
        <div class="tag-select">
          <label
            v-for="tag in filterStore.tags"
            :key="tag.id"
            class="tag-option"
          >
            <input
              v-model="formData.tagIds"
              type="checkbox"
              :value="tag.id"
            >
            <span class="tag-name">{{ tag.name }}</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>公司</label>
        <div class="tag-select">
          <label
            v-for="c in filterStore.companies"
            :key="c.id"
            class="tag-option"
          >
            <input
              v-model="formData.companyIds"
              type="checkbox"
              :value="c.id"
            >
            <span class="tag-name">{{ c.name }}</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>参考解答</label>
        <div class="answer-editor">
          <textarea
            v-model="formData.referenceAnswer"
            rows="4"
            placeholder="Markdown 格式"
          />
          <div
            v-if="formData.referenceAnswer"
            class="answer-preview"
          >
            <label>预览</label>
            <MarkdownRenderer :content="formData.referenceAnswer" />
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>来源</label>
        <input
          v-model="formData.source"
          placeholder="如：字节 2024 二面"
        >
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { questionsApi } from '@/api';
import { useFilterStore } from '@/stores/filter';
import Modal from '@/components/Modal.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

const route = useRoute();
const router = useRouter();
const filterStore = useFilterStore();
const question = ref<any>(null);
const auditLogs = ref<any[]>([]);

const showModal = ref(false);
const submitting = ref(false);

const formData = reactive({
  title: '',
  type: 'concept',
  difficulty: 3,
  knowledgePointId: null as number | null,
  tagIds: [] as number[],
  companyIds: [] as number[],
  referenceAnswer: '',
  source: '',
});

async function fetchQuestion() {
  const id = Number(route.params.id);
  question.value = await questionsApi.get(id);
  auditLogs.value = await questionsApi.getAuditLogs(id);
}

function openEdit() {
  if (!question.value) return;
  Object.assign(formData, {
    title: question.value.title,
    type: question.value.type,
    difficulty: question.value.difficulty,
    knowledgePointId: question.value.knowledgePointId,
    tagIds: question.value.tags?.map((t: any) => t.id) || [],
    companyIds: question.value.companies?.map((c: any) => c.id) || [],
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

async function handleRestore() {
  if (!question.value) return;

  try {
    await questionsApi.restore(question.value.id);
    await fetchQuestion();
  } catch (err: any) {
    alert(err.message || '恢复失败');
  }
}

function formatChanges(changes: string) {
  try {
    const obj = JSON.parse(changes);
    return Object.keys(obj).join(', ');
  } catch {
    return '';
  }
}

onMounted(async () => {
  await fetchQuestion();
  await filterStore.fetchAll();
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

.deleted-banner {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}

.q-header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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

.company {
  background: #fef3c7;
  color: #92400e;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.answer-section {
  margin-top: 1rem;
}

.answer-content {
  margin-top: 0.5rem;
  line-height: 1.6;
}

.no-answer {
  color: #787774;
  font-style: italic;
}

.answer-editor textarea {
  width: 100%;
  min-height: 100px;
}

.answer-preview {
  margin-top: 12px;
  padding: 12px;
  background: #f7f6f3;
  border-radius: 4px;
  border: 1px solid #e9e9e7;
}

.answer-preview label {
  font-size: 12px;
  color: #787774;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
  display: block;
}

.record-item {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.result.correct {
  color: #22c55e;
}
.result.wrong {
  color: #ef4444;
}
.result.fuzzy {
  color: #f59e0b;
}

.time {
  color: #9ca3af;
  font-size: 0.875rem;
}

.audit-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.audit-action {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.audit-action.create {
  background: #dcfce7;
  color: #166534;
}
.audit-action.update {
  background: #dbeafe;
  color: #1e40af;
}
.audit-action.delete {
  background: #fee2e2;
  color: #991b1b;
}
.audit-action.restore {
  background: #fef3c7;
  color: #92400e;
}

.audit-time {
  color: #9ca3af;
}

.audit-changes {
  color: #6b7280;
}

.form-group {
  margin-bottom: 1rem;
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
