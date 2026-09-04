import { defineStore } from 'pinia';
import { ref } from 'vue';
import { tagsApi } from '@/api';
import type { Tag } from '@interview-quiz/shared';

export const useTagStore = defineStore('tags', () => {
  const items = ref<Tag[]>([]);
  const loading = ref(false);

  async function fetchList(withCount = true) {
    loading.value = true;
    try {
      items.value = await tagsApi.list(withCount);
    } finally {
      loading.value = false;
    }
  }

  async function create(data: { name: string; color?: string }) {
    const item = await tagsApi.create(data);
    await fetchList();
    return item;
  }

  async function update(id: number, data: { name?: string; color?: string }) {
    const item = await tagsApi.update(id, data);
    await fetchList();
    return item;
  }

  async function remove(id: number) {
    await tagsApi.remove(id);
    await fetchList();
  }

  return { items, loading, fetchList, create, update, remove };
});
