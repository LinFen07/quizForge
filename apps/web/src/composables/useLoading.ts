import { ref } from 'vue';

export function useLoading(initial = false) {
  const loading = ref(initial);
  const error = ref<string | null>(null);

  async function withLoading<T>(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true;
    error.value = null;
    try {
      return await fn();
    } catch (e: any) {
      error.value = e.message || '操作失败';
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, withLoading };
}
