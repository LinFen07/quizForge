<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">知识点管理</h1>
      <button class="primary" @click="showCreate = true">新建知识点</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="tree">
      <div v-for="point in tree" :key="point.id" class="tree-node">
        <div class="node-content">
          <span class="node-name">{{ point.name }}</span>
          <span class="node-count">{{ point.questionCount }} 题</span>
        </div>
        <div v-if="point.children?.length" class="children">
          <div v-for="child in point.children" :key="child.id" class="tree-node child">
            <div class="node-content">
              <span class="node-name">{{ child.name }}</span>
              <span class="node-count">{{ child.questionCount }} 题</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { knowledgePointsApi } from '@/api';
import type { KnowledgePoint } from '@interview-quiz/shared';

const tree = ref<KnowledgePoint[]>([]);
const loading = ref(false);
const showCreate = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    tree.value = await knowledgePointsApi.tree();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.tree {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tree-node {
  background: #fff;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.tree-node.child {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  background: #f9fafb;
}

.node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-name {
  font-weight: 500;
}

.node-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.children {
  margin-top: 0.5rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}
</style>
