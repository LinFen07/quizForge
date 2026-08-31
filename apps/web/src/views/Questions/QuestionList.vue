<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">题目管理</h1>
      <button class="primary" @click="showCreate = true">新建题目</button>
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
        </div>
      </div>
    </div>

    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
      <span>第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="page++; fetchList()">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuestionStore } from '@/stores/question';

const router = useRouter();
const store = useQuestionStore();
const { questions, total, loading, page, pageSize, filters } = store;

const keyword = ref('');
const showCreate = ref(false);

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

onMounted(() => store.fetchQuestions());
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
}

.tag {
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}
</style>
