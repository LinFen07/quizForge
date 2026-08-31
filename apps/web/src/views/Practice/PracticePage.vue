<template>
  <div class="practice-page">
    <div class="page-header">
      <h1 class="page-title">刷题模式</h1>
      <div class="header-actions">
        <button v-if="!session" class="primary" @click="startSession">开始刷题</button>
        <template v-else>
          <div class="session-stats">
            <span>本次: {{ session.totalQuestions }} 题</span>
            <span class="correct">✓ {{ session.correctCount }}</span>
            <span class="wrong">✗ {{ session.wrongCount }}</span>
            <span class="fuzzy">? {{ session.fuzzyCount }}</span>
          </div>
          <button class="danger" @click="endSession">结束刷题</button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="currentQuestion" class="card question-card">
      <div class="q-info">
        <span v-if="currentQuestion.knowledgePoint" class="kp">{{ currentQuestion.knowledgePoint.name }}</span>
        <span class="diff">{{ '★'.repeat(currentQuestion.difficulty) }}</span>
        <span class="q-type">{{ currentQuestion.type }}</span>
        <span class="timer">{{ formatTime(elapsedTime) }}</span>
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

    <div v-else class="empty">
      <p v-if="!session">点击「开始刷题」开始练习</p>
      <p v-else>没有更多题目了</p>
    </div>

    <div v-if="session" class="card session-summary">
      <h3>本次刷题统计</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="value">{{ session.totalQuestions }}</div>
          <div class="label">总题数</div>
        </div>
        <div class="summary-item correct">
          <div class="value">{{ session.correctCount }}</div>
          <div class="label">答对</div>
        </div>
        <div class="summary-item wrong">
          <div class="value">{{ session.wrongCount }}</div>
          <div class="label">答错</div>
        </div>
        <div class="summary-item fuzzy">
          <div class="value">{{ session.fuzzyCount }}</div>
          <div class="label">模糊</div>
        </div>
      </div>
      <div class="accuracy" v-if="session.totalQuestions > 0">
        正确率: {{ Math.round((session.correctCount / session.totalQuestions) * 100) }}%
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { usePracticeStore } from '@/stores/practice';
import type { PracticeResult } from '@interview-quiz/shared';

const store = usePracticeStore();
const { currentQuestion, loading, showAnswer, toggleAnswer, session } = store;

const myAnswer = ref('');
const startTime = ref(Date.now());
const elapsedTime = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
  startTime.value = Date.now();
  elapsedTime.value = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedTime.value = Date.now() - startTime.value;
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  return elapsedTime.value;
}

async function startSession() {
  await store.startSession();
  fetchNext();
}

async function endSession() {
  stopTimer();
  await store.endSession();
}

function fetchNext() {
  store.fetchRandomQuestion();
  myAnswer.value = '';
  startTimer();
}

async function submit(result: PracticeResult) {
  const durationMs = stopTimer();
  await store.submitAnswer(result, myAnswer.value || undefined);
  fetchNext();
}

onMounted(() => {
  if (session) {
    fetchNext();
  }
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.session-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.session-stats .correct { color: #22c55e; }
.session-stats .wrong { color: #ef4444; }
.session-stats .fuzzy { color: #f59e0b; }

.danger {
  background: #dc2626;
  color: #fff;
}

.danger:hover {
  background: #b91c1c;
}

.question-card {
  max-width: 700px;
}

.q-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
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

.timer {
  margin-left: auto;
  font-family: monospace;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
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

.session-summary {
  margin-top: 1.5rem;
  max-width: 700px;
}

.session-summary h3 {
  margin-bottom: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.summary-item {
  text-align: center;
}

.summary-item .value {
  font-size: 1.5rem;
  font-weight: bold;
}

.summary-item.correct .value { color: #22c55e; }
.summary-item.wrong .value { color: #ef4444; }
.summary-item.fuzzy .value { color: #f59e0b; }

.summary-item .label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.accuracy {
  text-align: center;
  margin-top: 1rem;
  font-size: 1.125rem;
  font-weight: 500;
}
</style>