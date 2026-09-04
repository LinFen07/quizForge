<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">
        复习队列
      </h1>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <div
      v-else-if="questions.length === 0"
      class="empty-state"
    >
      <div class="empty-content">
        <h3>暂无需要复习的题目</h3>
        <p>完成刷题后，系统会自动添加需要复习的题目</p>
      </div>
    </div>

    <div
      v-else
      class="review-list"
    >
      <div
        v-for="q in questions"
        :key="q.id"
        class="review-card"
        @click="router.push(`/questions/${q.id}`)"
      >
        <div class="q-meta">
          <span
            v-if="q.lastResult"
            :class="['meta-item', 'result', q.lastResult]"
          >
            {{ resultLabels[q.lastResult] || q.lastResult }}
          </span>
          <span class="meta-item type">{{ typeLabels[q.type] || q.type }}</span>
          <span class="meta-item diff">{{ '★'.repeat(q.difficulty) }}</span>
          <span
            v-if="q.knowledgePoint"
            class="meta-item kp"
          >
            {{ q.knowledgePoint.name }}
          </span>
        </div>
        <h3 class="q-title">
          {{ q.title }}
        </h3>
        <div
          v-if="q.lastPracticedAt"
          class="q-time"
        >
          上次练习: {{ new Date(q.lastPracticedAt).toLocaleDateString() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { practiceApi } from '@/api';
import type { Question } from '@interview-quiz/shared';

const router = useRouter();

interface ReviewQuestion extends Question {
  lastResult: string | null;
  lastPracticedAt: string | null;
}

const typeLabels: Record<string, string> = {
  concept: '概念题',
  coding: '手写题',
  scene: '场景题',
  algorithm: '算法题',
};

const resultLabels: Record<string, string> = {
  correct: '正确',
  wrong: '错误',
  fuzzy: '模糊',
};

const questions = ref<ReviewQuestion[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    questions.value = (await practiceApi.getReviewQueue()) as ReviewQuestion[];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.review-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-card {
  padding: 16px 20px;
  cursor: pointer;
  transition: border-color 150ms ease;
}

.review-card:hover {
  border-color: #2383e2;
}

.q-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
}

.meta-item.result {
  font-weight: 500;
}

.meta-item.result.correct {
  background: #e6f5f0;
  color: #0f7b6c;
}

.meta-item.result.wrong {
  background: #fde8e8;
  color: #eb5757;
}

.meta-item.result.fuzzy {
  background: #fef3e0;
  color: #d9730d;
}

.meta-item.type {
  background: #f0f0ff;
  color: #5849d4;
}

.meta-item.diff {
  color: #d9730d;
  background: #fef3e0;
}

.meta-item.kp {
  background: #e8f4f8;
  color: #0f7b6c;
}

.q-title {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: #37352f;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.q-time {
  font-size: 13px;
  color: #787774;
}

.loading {
  text-align: center;
  padding: 64px;
  color: #787774;
}

.empty-state {
  padding: 80px 0;
}

.empty-content {
  text-align: center;
}

.empty-content h3 {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #37352f;
  margin: 0 0 8px 0;
}

.empty-content p {
  color: #787774;
  margin: 0;
}
</style>
