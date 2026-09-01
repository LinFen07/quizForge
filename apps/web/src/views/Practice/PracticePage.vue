<template>
  <div class="practice-page">
    <div class="page-header">
      <h1 class="page-title">刷题模式</h1>
      <div class="header-actions">
        <template v-if="!session">
          <button class="primary" @click="showStartDialog = true">开始刷题</button>
        </template>
        <template v-else>
          <div class="session-progress">
            <span class="progress-text">{{ sessionStats?.answered || 0 }} / {{ sessionStats?.total || 0 }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
          </div>
          <div class="session-stats">
            <span class="correct">✓ {{ sessionStats?.correct || 0 }}</span>
            <span class="wrong">✗ {{ sessionStats?.wrong || 0 }}</span>
            <span class="fuzzy">? {{ sessionStats?.fuzzy || 0 }}</span>
          </div>
          <button v-if="currentQuestion" class="secondary" @click="handleSkip">跳过</button>
          <button class="danger" @click="endSession">结束</button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="currentQuestion" class="card question-card">
      <div class="q-info">
        <span v-if="currentQuestion.knowledgePoint" class="kp">{{ currentQuestion.knowledgePoint.name }}</span>
        <span class="diff">{{ '★'.repeat(currentQuestion.difficulty) }}</span>
        <span class="q-type">{{ currentQuestion.type }}</span>
        <span v-for="tag in currentQuestion.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
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
      <p v-else-if="sessionStats?.pending === 0">🎉 本次刷题完成！</p>
      <p v-else>没有更多题目了</p>
    </div>

    <div v-if="session && sessionStats" class="card session-summary">
      <h3>本次统计</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="value">{{ sessionStats.total }}</div>
          <div class="label">总题数</div>
        </div>
        <div class="summary-item">
          <div class="value">{{ sessionStats.pending }}</div>
          <div class="label">待答</div>
        </div>
        <div class="summary-item correct">
          <div class="value">{{ sessionStats.correct }}</div>
          <div class="label">答对</div>
        </div>
        <div class="summary-item wrong">
          <div class="value">{{ sessionStats.wrong }}</div>
          <div class="label">答错</div>
        </div>
        <div class="summary-item fuzzy">
          <div class="value">{{ sessionStats.fuzzy }}</div>
          <div class="label">模糊</div>
        </div>
        <div class="summary-item">
          <div class="value">{{ sessionStats.accuracy }}%</div>
          <div class="label">正确率</div>
        </div>
      </div>
    </div>

    <Modal :visible="showStartDialog" title="开始刷题" @close="showStartDialog = false" @confirm="handleStartSession">
      <div class="form-group">
        <label>出题数量</label>
        <select v-model.number="startParams.count">
          <option :value="5">5 题</option>
          <option :value="10">10 题</option>
          <option :value="20">20 题</option>
          <option :value="50">50 题</option>
        </select>
      </div>
      <div class="form-group">
        <label>题型筛选</label>
        <select v-model="startParams.type">
          <option value="">全部题型</option>
          <option value="concept">概念题</option>
          <option value="coding">手写题</option>
          <option value="scene">场景题</option>
          <option value="algorithm">算法题</option>
        </select>
      </div>
      <div class="form-group">
        <label>难度筛选</label>
        <select v-model.number="startParams.difficulty">
          <option :value="0">全部难度</option>
          <option v-for="d in 5" :key="d" :value="d">{{ '★'.repeat(d) }}</option>
        </select>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { usePracticeStore } from '@/stores/practice';
import type { PracticeResult } from '@interview-quiz/shared';
import Modal from '@/components/Modal.vue';

const store = usePracticeStore();
const { currentQuestion, loading, showAnswer, toggleAnswer, session, sessionStats } = store;

const myAnswer = ref('');
const startTime = ref(Date.now());
const elapsedTime = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const showStartDialog = ref(false);
const startParams = reactive({
  count: 10,
  type: '',
  difficulty: 0,
});

const progressPercent = computed(() => {
  if (!sessionStats.value || !sessionStats.value.total) return 0;
  return Math.round(((sessionStats.value.total - sessionStats.value.pending) / sessionStats.value.total) * 100);
});

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

async function handleStartSession() {
  showStartDialog.value = false;
  const params: Record<string, any> = {};
  if (startParams.count) params.count = startParams.count;
  if (startParams.type) params.type = startParams.type;
  if (startParams.difficulty) params.difficulty = startParams.difficulty;
  await store.startSession(Object.keys(params).length > 0 ? params : undefined);
  startTimer();
}

async function endSession() {
  stopTimer();
  await store.endSession();
}

async function handleSkip() {
  stopTimer();
  myAnswer.value = '';
  await store.skipQuestion();
  if (currentQuestion.value) startTimer();
}

async function submit(result: PracticeResult) {
  const durationMs = stopTimer();
  await store.submitAnswer(result, myAnswer.value || undefined);
  myAnswer.value = '';

  await store.fetchNextQuestion();
  if (currentQuestion.value) {
    startTimer();
  }
}

onMounted(() => {
  if (session) {
    startTimer();
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

.session-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.progress-bar {
  width: 120px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
  transition: width 0.3s ease;
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
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
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

.tag {
  background: #f3f4f6;
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
  grid-template-columns: repeat(3, 1fr);
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
</style>
