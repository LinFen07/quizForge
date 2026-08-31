<template>
  <div class="practice-page">
    <div class="page-header">
      <h1 class="page-title">刷题模式</h1>
      <button class="secondary" @click="fetchNext">换一题</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="currentQuestion" class="card question-card">
      <div class="q-info">
        <span v-if="currentQuestion.knowledgePoint" class="kp">{{ currentQuestion.knowledgePoint.name }}</span>
        <span class="diff">{{ '★'.repeat(currentQuestion.difficulty) }}</span>
        <span class="q-type">{{ currentQuestion.type }}</span>
      </div>

      <div class="q-title">{{ currentQuestion.title }}</div>

      <div class="answer-area">
        <button v-if="!showAnswer" class="secondary" @click="toggleAnswer">显示答案</button>
        <div v-if="showAnswer" class="reference-answer">
          <h4>参考解答</h4>
          <div class="answer-content">{{ currentQuestion.referenceAnswer || '暂无' }}</div>
        </div>
      </div>

      <div class="my-answer">
        <textarea v-model="myAnswer" placeholder="我的解答（可选）..." rows="4"></textarea>
      </div>

      <div class="actions">
        <button class="correct" @click="submit('correct')">答对了</button>
        <button class="fuzzy" @click="submit('fuzzy')">模糊</button>
        <button class="wrong" @click="submit('wrong')">答错了</button>
      </div>
    </div>

    <div v-else class="empty">没有题目了，请先添加题目</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePracticeStore } from '@/stores/practice';
import type { PracticeResult } from '@interview-quiz/shared';

const store = usePracticeStore();
const { currentQuestion, loading, showAnswer, toggleAnswer } = store;
const myAnswer = ref('');
const startTime = ref(Date.now());

function fetchNext() {
  store.fetchRandomQuestion();
  myAnswer.value = '';
  startTime.value = Date.now();
}

async function submit(result: PracticeResult) {
  await store.submitAnswer(result, myAnswer.value || undefined);
  fetchNext();
}

onMounted(() => fetchNext());
</script>

<style scoped>
.question-card {
  max-width: 700px;
}

.q-info {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.kp {
  background: #dbeafe;
  color: #1e40af;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.diff {
  color: #f59e0b;
}

.q-type {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.q-title {
  font-size: 1.125rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.answer-area {
  margin-bottom: 1rem;
}

.reference-answer {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 1rem;
}

.reference-answer h4 {
  margin-bottom: 0.5rem;
  color: #166534;
}

.answer-content {
  white-space: pre-wrap;
  line-height: 1.6;
}

.my-answer textarea {
  width: 100%;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.correct {
  background: #22c55e;
  color: #fff;
  padding: 0.75rem 1.5rem;
}

.fuzzy {
  background: #f59e0b;
  color: #fff;
  padding: 0.75rem 1.5rem;
}

.wrong {
  background: #ef4444;
  color: #fff;
  padding: 0.75rem 1.5rem;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}
</style>
