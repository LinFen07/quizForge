<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">题目管理</h1>
      <div class="header-actions">
        <button v-if="selectedIds.length > 0" class="danger" @click="handleBatchDelete">
          批量删除 ({{ selectedIds.length }})
        </button>
        <button v-if="selectedIds.length > 0" class="secondary" @click="showBatchUpdate = true">
          批量编辑 ({{ selectedIds.length }})
        </button>
        <button class="primary" @click="openCreate()">新建题目</button>
      </div>
    </div>

    <div class="card filters">
      <input v-model="keyword" placeholder="搜索题目..." @input="debouncedFetch" />
      <select v-model="filters.type" @change="fetchList">
        <option value="">全部题型</option>
        <option value="concept">概念题</option>
        <option value="coding">手写题</option>
        <option value="scene">场景题</option>
        <option value="algorithm">算法题</option>
      </select>
      <select v-model.number="filters.difficulty" @change="fetchList">
        <option :value="0">全部难度</option>
        <option v-for="d in 5" :key="d" :value="d">{{ '★'.repeat(d) }}</option>
      </select>
      <select v-model.number="filters.companyId" @change="fetchList">
        <option :value="0">全部公司</option>
        <option v-for="c in allCompanies" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <select v-model="filters.sort" @change="fetchList">
        <option value="createdAt">创建时间</option>
        <option value="updatedAt">更新时间</option>
        <option value="difficulty">难度</option>
        <option value="title">标题</option>
      </select>
      <select v-model="filters.order" @change="fetchList">
        <option value="desc">降序</option>
        <option value="asc">升序</option>
      </select>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="question-list">
      <div class="list-header">
        <label class="select-all">
          <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
          全选
        </label>
        <span v-if="selectedIds.length > 0" class="selected-count">已选 {{ selectedIds.length }} 项</span>
      </div>

      <div v-for="q in questions" :key="q.id" class="card question-card" :class="{ selected: selectedIds.includes(q.id) }">
        <div class="q-select" @click.stop>
          <input type="checkbox" :checked="selectedIds.includes(q.id)" @change="toggleSelect(q.id)" />
        </div>
        <div class="q-content" @click="router.push(`/questions/${q.id}`)">
          <div class="q-header">
            <span class="q-type">{{ q.type }}</span>
            <span class="q-diff">{{ '★'.repeat(q.difficulty) }}</span>
            <span v-if="q.deletedAt" class="q-deleted">已删除</span>
          </div>
          <div class="q-title">{{ q.title }}</div>
          <div class="q-meta">
            <span v-if="q.knowledgePoint">{{ q.knowledgePoint.name }}</span>
            <span v-for="tag in q.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
            <span v-for="c in q.companies" :key="c.id" class="company">{{ c.name }}</span>
            <span class="practice-count">练习 {{ q.practiceCount }} 次</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="questions.length === 0 && !loading" class="empty">暂无题目，点击上方按钮新建</div>

    <div class="pagination" v-if="total > 0">
      <button :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
      <button :disabled="page >= totalPages" @click="page++; fetchList()">下一页</button>
      <select v-model.number="pageSize" @change="page = 1; fetchList()">
        <option :value="20">20 条/页</option>
        <option :value="50">50 条/页</option>
        <option :value="100">100 条/页</option>
      </select>
    </div>

    <Modal
      :visible="showModal"
      :title="editingQuestion ? '编辑题目' : '新建题目'"
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
        <label>公司</label>
        <div class="tag-select">
          <label v-for="c in allCompanies" :key="c.id" class="tag-option">
            <input type="checkbox" :value="c.id" v-model="formData.companyIds" />
            <span class="tag-name">{{ c.name }}</span>
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

    <Modal
      :visible="showBatchUpdate"
      title="批量编辑"
      :loading="batchUpdating"
      @close="showBatchUpdate = false"
      @confirm="handleBatchUpdate"
    >
      <p class="batch-info">将更新 {{ selectedIds.length }} 个题目</p>
      <div class="form-group">
        <label>修改难度</label>
        <select v-model.number="batchData.difficulty">
          <option :value="undefined">不修改</option>
          <option v-for="d in 5" :key="d" :value="d">{{ '★'.repeat(d) }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>修改知识点</label>
        <select v-model.number="batchData.knowledgePointId">
          <option :value="undefined">不修改</option>
          <option :value="0">移除知识点</option>
          <option v-for="kp in flatKnowledgePoints" :key="kp.id" :value="kp.id">
            {{ kp.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>替换标签（全量替换）</label>
        <div class="tag-select">
          <label v-for="tag in allTags" :key="tag.id" class="tag-option">
            <input type="checkbox" :value="tag.id" v-model="batchData.tagIds" />
            <span class="tag-name">{{ tag.name }}</span>
          </label>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { questionsApi, knowledgePointsApi, tagsApi, companiesApi } from '@/api';
import { useQuestionStore } from '@/stores/question';
import type { KnowledgePoint, Tag } from '@interview-quiz/shared';
import Modal from '@/components/Modal.vue';

const router = useRouter();
const store = useQuestionStore();
const questions = computed(() => store.questions);
const total = computed(() => store.total);
const loading = computed(() => store.loading);
const page = computed(() => store.page);
const pageSize = computed(() => store.pageSize);
const filters = computed(() => store.filters);

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const keyword = ref('');
const showModal = ref(false);
const submitting = ref(false);
const editingQuestion = ref<any>(null);

const selectedIds = ref<number[]>([]);
const isAllSelected = computed(() => {
  if (questions.value.length === 0) return false;
  return questions.value.every((q) => selectedIds.value.includes(q.id));
});

const showBatchUpdate = ref(false);
const batchUpdating = ref(false);
const batchData = reactive({
  difficulty: undefined as number | undefined,
  knowledgePointId: undefined as number | undefined,
  tagIds: [] as number[],
  companyIds: [] as number[],
});

const allKnowledgePoints = ref<KnowledgePoint[]>([]);
const allTags = ref<Tag[]>([]);
const allCompanies = ref<any[]>([]);

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

let timer: ReturnType<typeof setTimeout>;
function debouncedFetch() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    store.filters.keyword = keyword.value;
    store.fetchQuestions();
  }, 300);
}

function fetchList() {
  selectedIds.value = [];
  store.fetchQuestions();
}

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = questions.value.map((q) => q.id);
  }
}

function openCreate() {
  editingQuestion.value = null;
  Object.assign(formData, {
    title: '',
    type: 'concept',
    difficulty: 3,
    knowledgePointId: null,
    tagIds: [],
    companyIds: [],
    referenceAnswer: '',
    source: '',
  });
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingQuestion.value = null;
}

async function handleSubmit() {
  if (!formData.title.trim()) return;

  submitting.value = true;
  try {
    if (editingQuestion.value) {
      await questionsApi.update(editingQuestion.value.id, { ...formData });
    } else {
      await questionsApi.create({ ...formData });
    }
    await store.fetchQuestions();
    closeModal();
  } finally {
    submitting.value = false;
  }
}

async function handleBatchDelete() {
  if (!confirm(`确定删除选中的 ${selectedIds.value.length} 个题目吗？`)) return;

  try {
    await questionsApi.batchDelete(selectedIds.value);
    selectedIds.value = [];
    await store.fetchQuestions();
  } catch (err: any) {
    alert(err.message || '删除失败');
  }
}

async function handleBatchUpdate() {
  batchUpdating.value = true;
  try {
    await questionsApi.batchUpdate({
      ids: selectedIds.value,
      ...batchData,
    });
    showBatchUpdate.value = false;
    selectedIds.value = [];
    await store.fetchQuestions();
  } finally {
    batchUpdating.value = false;
  }
}

onMounted(async () => {
  store.fetchQuestions();
  const [kp, tag, company] = await Promise.all([
    knowledgePointsApi.tree(),
    tagsApi.list(),
    companiesApi.list(),
  ]);
  allKnowledgePoints.value = kp;
  allTags.value = tag;
  allCompanies.value = company;
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

.filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0.75rem;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.selected-count {
  font-size: 0.875rem;
  color: #3b82f6;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-card {
  display: flex;
  gap: 0.75rem;
  transition: all 0.2s;
}

.question-card.selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.q-select {
  display: flex;
  align-items: flex-start;
  padding-top: 0.5rem;
}

.q-content {
  flex: 1;
  cursor: pointer;
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
  font-size: 0.875rem;
}

.q-deleted {
  font-size: 0.75rem;
  background: #fee2e2;
  color: #dc2626;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.q-title {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.q-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  flex-wrap: wrap;
}

.tag {
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.company {
  background: #fef3c7;
  color: #92400e;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.practice-count {
  margin-left: auto;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.loading, .empty {
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

.batch-info {
  background: #eff6ff;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #1e40af;
}
</style>