<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">标签管理</h1>
      <button class="primary" @click="showCreate = true">新建标签</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="tag-grid">
      <div v-for="tag in tags" :key="tag.id" class="card tag-card">
        <div class="tag-color" :style="{ background: tag.color || '#6b7280' }"></div>
        <span class="tag-name">{{ tag.name }}</span>
        <span v-if="tag._count" class="tag-count">{{ tag._count.questions }} 题</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { tagsApi } from '@/api';
import type { Tag } from '@interview-quiz/shared';

const tags = ref<(Tag & { _count?: { questions: number } })[]>([]);
const loading = ref(false);
const showCreate = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    tags.value = await tagsApi.list(true);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.tag-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  margin-left: auto;
  font-size: 0.75rem;
  color: #6b7280;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}
</style>
