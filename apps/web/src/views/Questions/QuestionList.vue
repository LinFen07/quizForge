<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">题目管理</h1>
      <button class="primary" @click="openCreate()">新建题目</button>
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
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="question-list">
      <div v-for="q in questions" :key="q.id" class="card question-card" @click="router.push(`/questions/${q.id}`)">
        <div class="q-header">
          <span class="q-type">{{ q.type }}</span>
          <span class="q-diff">{{ '★'.repeat(q.difficulty) }}</span>
        </div>
        <div class="q-title">{{ q.title }}</div>
        <div class="q-meta">
          <span v-if="q.knowledgePoint">{{ q.knowledgePoint.name }}</span>
          <span v-for="tag in q.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
          <span class="practice-count">练习 {{ q.practiceCount }} 次</span>
        </div>
      </div>
    </div>

    <div v-if="questions.length === 0 && !loading" class="empty">暂无题目，点击上方按钮新建</div>

    <div class="pagination" v-if="total > 0">
      <button :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
      <span>第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="page++; fetchList()">下一页</button>
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
import { useRouter } from 'vue-router';
import { questionsApi, knowledgePointsApi, tagsApi } from '@/api';
import { useQuestionStore } from '@/stores/question';
import type { KnowledgePoint, Tag } from '@interview-quiz/shared';
import Modal from '@/components/Modal.vue';

const router = useRouter();
const store = useQuestionStore();
const { questions, total, loading, page, pageSize, filters } = store;

const keyword = ref('');
const showModal = ref(false);
const submitting = ref(false);
const editingQuestion = ref<any>(null);

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

let timer: ReturnType<typeof setTimeout>;
function debouncedFetch() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    filters.keyword = keyword.value;
    store.fetchQuestions();
  }, 300);
}

function fetchList() {
  store.fetchQuestions();
}

function openCreate() {
  editingQuestion.value = null;
  Object.assign(formData, {
    title: '',
    type: 'concept',
    difficulty: 3,
    knowledgePointId: null,
    tagIds: [],
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

onMounted(async () => {
  store.fetchQuestions();
  const [kp, tag] = await Promise.all([
    knowledgePointsApi.tree(),
    tagsApi.list(),
  ]);
  allKnowledgePoints.value = kp;
  allTags.value = tag;
});
</script>

<style scoped>
.filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.question-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
  font-size: 0.875rem;
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
</style>