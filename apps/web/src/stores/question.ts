import { defineStore } from 'pinia';
import { ref } from 'vue';
import { questionsApi } from '@/api';
import type { Question, PaginatedResponse } from '@interview-quiz/shared';

export const useQuestionStore = defineStore('questions', () => {
  const questions = ref<Question[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const page = ref(1);
  const pageSize = ref(20);
  const filters = ref<Record<string, any>>({});

  async function fetchQuestions() {
    loading.value = true;
    try {
      const res = await questionsApi.list({
        page: page.value,
        pageSize: pageSize.value,
        ...filters.value,
      });
      questions.value = res.items;
      total.value = res.total;
    } finally {
      loading.value = false;
    }
  }

  return { questions, total, loading, page, pageSize, filters, fetchQuestions };
});
