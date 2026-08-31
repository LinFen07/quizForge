<template>
  <div v-if="question" class="question-detail">
    <div class="page-header">
      <h1 class="page-title">题目详情</h1>
      <div>
        <button class="secondary" @click="router.back()">返回</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { questionsApi } from '@/api';
import type { Question } from '@interview-quiz/shared';

const route = useRoute();
const router = useRouter();
const question = ref<Question | null>(null);

onMounted(async () => {
  const id = Number(route.params.id);
  question.value = await questionsApi.get(id);
});
</script>

<style scoped>
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
</style>
