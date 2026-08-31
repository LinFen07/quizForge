<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">统计面板</h1>
    </div>

    <div class="stats-grid">
      <div class="card stat-card">
        <div class="stat-value">{{ overview.totalRecords || 0 }}</div>
        <div class="stat-label">总练习次数</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value accuracy">{{ overview.accuracy || 0 }}%</div>
        <div class="stat-label">正确率</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value correct">{{ overview.correct || 0 }}</div>
        <div class="stat-label">答对</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value wrong">{{ overview.wrong || 0 }}</div>
        <div class="stat-label">答错</div>
      </div>
    </div>

    <div class="card section">
      <h3>知识点掌握情况</h3>
      <div class="knowledge-list">
        <div v-for="k in knowledgeMastery" :key="k.id" class="kp-item">
          <span class="kp-name">{{ k.name }}</span>
          <span class="kp-count">{{ k.questionCount }} 题</span>
          <div class="kp-bar">
            <div class="kp-bar-fill" :style="{ width: k.accuracy + '%' }"></div>
          </div>
          <span class="kp-accuracy">{{ k.accuracy }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { statsApi } from '@/api';

const overview = ref<any>({});
const knowledgeMastery = ref<any[]>([]);

onMounted(async () => {
  overview.value = await statsApi.masteryOverview();
  knowledgeMastery.value = await statsApi.knowledgeMastery();
});
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
}

.stat-value.accuracy { color: #3b82f6; }
.stat-value.correct { color: #22c55e; }
.stat-value.wrong { color: #ef4444; }

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.section {
  margin-top: 1.5rem;
}

.section h3 {
  margin-bottom: 1rem;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.kp-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.kp-name {
  width: 120px;
  font-size: 0.875rem;
}

.kp-count {
  width: 50px;
  font-size: 0.75rem;
  color: #6b7280;
}

.kp-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.kp-bar-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s;
}

.kp-accuracy {
  width: 40px;
  text-align: right;
  font-size: 0.875rem;
}
</style>
