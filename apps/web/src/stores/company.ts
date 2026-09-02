import { defineStore } from 'pinia';
import { ref } from 'vue';
import { companiesApi } from '@/api';

export const useCompanyStore = defineStore('companies', () => {
  const items = ref<any[]>([]);
  const loading = ref(false);

  async function fetchList(withCount = true) {
    loading.value = true;
    try {
      items.value = await companiesApi.list(withCount);
    } finally {
      loading.value = false;
    }
  }

  async function create(data: { name: string; alias?: string }) {
    const item = await companiesApi.create(data);
    await fetchList();
    return item;
  }

  async function update(id: number, data: { name?: string; alias?: string }) {
    const item = await companiesApi.update(id, data);
    await fetchList();
    return item;
  }

  async function remove(id: number) {
    await companiesApi.remove(id);
    await fetchList();
  }

  return { items, loading, fetchList, create, update, remove };
});
