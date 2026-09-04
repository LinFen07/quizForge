<template>
  <div class="practice-page">
    <div class="page-header">
      <h1 class="page-title">
        刷题模式
      </h1>
      <div class="header-actions">
        <template v-if="!session">
          <button
            class="primary"
            @click="showStartDialog = true"
          >
            开始刷题
          </button>
        </template>
        <template v-else>
          <div class="session-progress">
            <span class="progress-text">{{ sessionStats?.answered || 0 }} / {{ sessionStats?.total || 0 }}</span>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: progressPercent + '%' }"
              />
            </div>
          </div>
          <div class="session-stats">
            <span class="stat correct">{{ sessionStats?.correct || 0 }}</span>
            <span class="stat wrong">{{ sessionStats?.wrong || 0 }}</span>
            <span class="stat fuzzy">{{ sessionStats?.fuzzy || 0 }}</span>
          </div>
          <button
            v-if="currentQuestion"
            class="secondary"
            @click="handleSkip"
          >
            跳过
          </button>
          <button
            class="danger"
            @click="endSession"
          >
            结束
          </button>
        </template>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <div
      v-else-if="currentQuestion"
      class="question-container"
    >
      <div class="question-card">
        <div class="q-meta">
          <span
            v-if="currentQuestion.knowledgePoint"
            class="meta-item kp"
          >
            {{ currentQuestion.knowledgePoint.name }}
          </span>
          <span class="meta-item type">{{
            typeLabels[currentQuestion.type] || currentQuestion.type
          }}</span>
          <span class="meta-item diff">{{ '★'.repeat(currentQuestion.difficulty) }}</span>
          <span
            v-for="tag in currentQuestion.tags"
            :key="tag.id"
            class="meta-item tag"
          >
            {{ tag.name }}
          </span>
          <span class="timer">{{ formatTime(elapsedTime) }}</span>
        </div>

        <h2 class="q-title">
          {{ currentQuestion.title }}
        </h2>

        <div
          v-if="currentQuestion.source"
          class="q-source"
        >
          来源: {{ currentQuestion.source }}
        </div>
      </div>

      <div class="action-card">
        <div class="answer-section">
          <button
            v-if="!showAnswer"
            class="secondary full-width"
            @click="store.toggleAnswer"
          >
            显示答案
          </button>
          <div
            v-if="showAnswer"
            class="reference-answer"
          >
            <div class="answer-label">
              参考解答
            </div>
            <MarkdownRenderer
              v-if="currentQuestion.referenceAnswer"
              :content="currentQuestion.referenceAnswer"
            />
            <div
              v-else
              class="no-answer"
            >
              暂无参考解答
            </div>
          </div>
        </div>

        <div class="my-answer-section">
          <textarea
            v-model="myAnswer"
            placeholder="写下你的解答思路（可选）..."
            rows="4"
          />
        </div>

        <div class="submit-actions">
          <button
            class="result-btn correct"
            @click="submit('correct')"
          >
            <span class="result-icon">✓</span>
            <span>答对了</span>
          </button>
          <button
            class="result-btn fuzzy"
            @click="submit('fuzzy')"
          >
            <span class="result-icon">~</span>
            <span>有点模糊</span>
          </button>
          <button
            class="result-btn wrong"
            @click="submit('wrong')"
          >
            <span class="result-icon">✗</span>
            <span>答错了</span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-else
      class="empty-state"
    >
      <div
        v-if="!session"
        class="empty-content"
      >
        <div class="empty-icon">
          📝
        </div>
        <h3>准备开始刷题</h3>
        <p>点击「开始刷题」选择筛选条件</p>
        <button
          class="primary"
          @click="showStartDialog = true"
        >
          开始刷题
        </button>
      </div>
      <div
        v-else-if="sessionStats?.pending === 0"
        class="empty-content"
      >
        <div class="empty-icon">
          🎉
        </div>
        <h3>本次刷题完成！</h3>
        <p>正确率: {{ sessionStats?.accuracy || 0 }}%</p>
        <button
          class="secondary"
          @click="showStartDialog = true"
        >
          再来一轮
        </button>
      </div>
      <div
        v-else
        class="empty-content"
      >
        <p>没有更多题目了</p>
      </div>
    </div>

    <div
      v-if="session && sessionStats && sessionStats.total > 0"
      class="stats-card"
    >
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">
            {{ sessionStats.total }}
          </div>
          <div class="stat-label">
            总题数
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ sessionStats.pending }}
          </div>
          <div class="stat-label">
            待答
          </div>
        </div>
        <div class="stat-item correct">
          <div class="stat-value">
            {{ sessionStats.correct }}
          </div>
          <div class="stat-label">
            正确
          </div>
        </div>
        <div class="stat-item wrong">
          <div class="stat-value">
            {{ sessionStats.wrong }}
          </div>
          <div class="stat-label">
            错误
          </div>
        </div>
        <div class="stat-item fuzzy">
          <div class="stat-value">
            {{ sessionStats.fuzzy }}
          </div>
          <div class="stat-label">
            模糊
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ sessionStats.accuracy }}%
          </div>
          <div class="stat-label">
            正确率
          </div>
        </div>
      </div>
    </div>

    <Modal
      :visible="showStartDialog"
      title="开始刷题"
      @close="showStartDialog = false"
      @confirm="handleStartSession"
    >
      <div class="form-group">
        <label>出题数量</label>
        <select v-model.number="startParams.count">
          <option :value="5">
            5 题
          </option>
          <option :value="10">
            10 题
          </option>
          <option :value="20">
            20 题
          </option>
          <option :value="50">
            50 题
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>题型筛选</label>
        <select v-model="startParams.type">
          <option value="">
            全部题型
          </option>
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
        <label>难度筛选</label>
        <select v-model.number="startParams.difficulty">
          <option :value="0">
            全部难度
          </option>
          <option
            v-for="d in 5"
            :key="d"
            :value="d"
          >
            {{ '★'.repeat(d) }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>知识点筛选</label>
        <select v-model.number="startParams.knowledgePointId">
          <option :value="0">
            全部知识点
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
        <label>标签筛选</label>
        <div class="tag-select">
          <label
            v-for="tag in filterStore.tags"
            :key="tag.id"
            class="tag-option"
          >
            <input
              v-model="startParams.tagIds"
              type="checkbox"
              :value="tag.id"
            >
            <span class="tag-name">{{ tag.name }}</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>公司筛选</label>
        <div class="tag-select">
          <label
            v-for="c in filterStore.companies"
            :key="c.id"
            class="tag-option"
          >
            <input
              v-model="startParams.companyIds"
              type="checkbox"
              :value="c.id"
            >
            <span class="tag-name">{{ c.name }}</span>
          </label>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePracticeStore } from '@/stores/practice';
import { useFilterStore } from '@/stores/filter';
import type { PracticeResult } from '@interview-quiz/shared';
import Modal from '@/components/Modal.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

const store = usePracticeStore();
const filterStore = useFilterStore();
const { currentQuestion, loading, showAnswer, session, sessionStats } = storeToRefs(store);

const typeLabels: Record<string, string> = {
  concept: '概念题',
  coding: '手写题',
  scene: '场景题',
  algorithm: '算法题',
};

const myAnswer = ref('');
const startTime = ref(Date.now());
const elapsedTime = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const showStartDialog = ref(false);
const startParams = reactive({
  count: 10,
  type: '',
  difficulty: 0,
  knowledgePointId: 0,
  tagIds: [] as number[],
  companyIds: [] as number[],
});

const progressPercent = computed(() => {
  if (!sessionStats.value || !sessionStats.value.total) return 0;
  return Math.round(
    ((sessionStats.value.total - sessionStats.value.pending) / sessionStats.value.total) * 100,
  );
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
  if (startParams.knowledgePointId) params.knowledgePointId = startParams.knowledgePointId;
  if (startParams.tagIds.length) params.tagIds = startParams.tagIds;
  if (startParams.companyIds.length) params.companyIds = startParams.companyIds;
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

onMounted(async () => {
  await filterStore.fetchAll();
  if (session.value) {
    startTimer();
  }
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.practice-page {
  max-width: 800px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.session-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  font-size: 13px;
  font-weight: 500;
  color: #787774;
  white-space: nowrap;
}

.progress-bar {
  width: 120px;
  height: 4px;
  background: #e9e9e7;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2383e2;
  border-radius: 2px;
  transition: width 300ms ease;
}

.session-stats {
  display: flex;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

.stat {
  padding: 2px 8px;
  border-radius: 4px;
}

.stat.correct {
  color: #0f7b6c;
  background: #e6f5f0;
}

.stat.wrong {
  color: #eb5757;
  background: #fde8e8;
}

.stat.fuzzy {
  color: #d9730d;
  background: #fef3e0;
}

.danger {
  background: #eb5757;
  color: #ffffff;
}

.danger:hover {
  background: #dc3545;
}

.question-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  padding: 24px;
}

.q-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  background: #f7f6f3;
  color: #787774;
}

.meta-item.kp {
  background: #e8f4f8;
  color: #0f7b6c;
}

.meta-item.type {
  background: #f0f0ff;
  color: #5849d4;
}

.meta-item.diff {
  color: #d9730d;
  background: #fef3e0;
}

.meta-item.tag {
  background: #f7f6f3;
}

.timer {
  margin-left: auto;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  font-size: 14px;
  font-weight: 500;
  color: #787774;
  background: #f7f6f3;
  padding: 4px 12px;
  border-radius: 4px;
}

.q-title {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #37352f;
  line-height: 1.6;
  margin: 0;
}

.q-source {
  margin-top: 12px;
  font-size: 13px;
  color: #787774;
}

.action-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.answer-section {
  min-height: 40px;
}

.full-width {
  width: 100%;
}

.reference-answer {
  background: #f7f6f3;
  border: 1px solid #e9e9e7;
  border-radius: 4px;
  padding: 16px;
}

.answer-label {
  font-size: 12px;
  font-weight: 500;
  color: #787774;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}

.no-answer {
  color: #787774;
  font-style: italic;
}

.my-answer-section textarea {
  width: 100%;
  min-height: 100px;
  resize: vertical;
}

.submit-actions {
  display: flex;
  gap: 12px;
}

.result-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 4px;
  font-weight: 500;
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.result-btn:hover {
  transform: translateY(-1px);
}

.result-btn:active {
  transform: translateY(0);
}

.result-btn.correct {
  background: #0f7b6c;
  color: #ffffff;
}

.result-btn.correct:hover {
  background: #0d6958;
}

.result-btn.fuzzy {
  background: #d9730d;
  color: #ffffff;
}

.result-btn.fuzzy:hover {
  background: #b85c0a;
}

.result-btn.wrong {
  background: #eb5757;
  color: #ffffff;
}

.result-btn.wrong:hover {
  background: #d63b3b;
}

.result-icon {
  font-size: 16px;
  font-weight: 600;
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

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
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
  margin: 0 0 24px 0;
}

.stats-card {
  padding: 20px;
  margin-top: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-item .stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #37352f;
}

.stat-item.correct .stat-value {
  color: #0f7b6c;
}
.stat-item.wrong .stat-value {
  color: #eb5757;
}
.stat-item.fuzzy .stat-value {
  color: #d9730d;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #787774;
  margin-top: 4px;
}

.form-group {
  margin-bottom: 16px;
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

.tag-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
  color: #37352f;
}

.tag-option input {
  width: auto;
}
</style>
