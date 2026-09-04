import { defineStore } from 'pinia';
import { ref } from 'vue';
import { knowledgePointsApi } from '@/api';
import type { KnowledgePoint } from '@interview-quiz/shared';

export const useKnowledgePointStore = defineStore('knowledgePoints', () => {
  const items = ref<KnowledgePoint[]>([]);
  const loading = ref(false);

  async function fetchTree() {
    loading.value = true;
    try {
      items.value = await knowledgePointsApi.tree();
    } finally {
      loading.value = false;
    }
  }

  async function create(data: { name: string; parentId?: number }) {
    const item = await knowledgePointsApi.create(data);
    await fetchTree();
    return item;
  }

  async function update(id: number, data: { name: string }) {
    const item = await knowledgePointsApi.update(id, data);
    await fetchTree();
    return item;
  }

  async function remove(id: number) {
    await knowledgePointsApi.remove(id);
    await fetchTree();
  }

  return { items, loading, fetchTree, create, update, remove };
});
