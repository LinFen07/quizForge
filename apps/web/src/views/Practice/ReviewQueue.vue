<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">复习队列</h1>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="questions.length === 0" class="empty">暂无需要复习的题目</div>

    <div v-else class="review-list">
      <div v-for="q in questions" :key="q.id" class="card review-card">
        <div class="q-header">
          <span :class="['last-result', q.lastResult]">{{ q.lastResult || '未练习' }}</span>
          <span class="q-type">{{ q.type }}</span>
          <span class="q-diff">{{ '★'.repeat(q.difficulty) }}</span>
        </div>
        <div class="q-title">{{ q.title }}</div>
        <div class="q-meta">
          <span v-if="q.knowledgePoint">{{ q.knowledgePoint.name }}</span>
          <span v-if="q.lastPracticedAt">上次: {{ new Date(q.lastPracticedAt).toLocaleDateString() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { practiceApi } from '@/api';
import type { Question } from '@interview-quiz/shared';

interface ReviewQuestion extends Question {
  lastResult: string | null;
  lastPracticedAt: string | null;
}

const questions = ref<ReviewQuestion[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    questions.value = await practiceApi.getReviewQueue() as ReviewQuestion[];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.review-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-card {
  cursor: pointer;
}

.q-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.last-result {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.last-result.correct { background: #dcfce7; color: #166534; }
.last-result.wrong { background: #fee2e2; color: #991b1b; }
.last-result.fuzzy { background: #fef3c7; color: #92400e; }

.q-type {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
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
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}
</style>
