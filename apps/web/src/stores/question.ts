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
  const filters = ref<Record<string, any>>({
    keyword: '',
    type: '',
    difficulty: 0,
    companyIds: 0,
    sort: 'createdAt',
    order: 'desc',
  });

  async function fetchQuestions() {
    loading.value = true;
    try {
      const params: Record<string, any> = {
        page: page.value,
        pageSize: pageSize.value,
      };
      if (filters.value.keyword) params.keyword = filters.value.keyword;
      if (filters.value.type) params.type = filters.value.type;
      if (filters.value.difficulty > 0) params.difficulty = filters.value.difficulty;
      if (filters.value.companyIds && filters.value.companyIds !== 0)
        params.companyIds = [filters.value.companyIds];
      if (filters.value.sort) params.sort = filters.value.sort;
      if (filters.value.order) params.order = filters.value.order;

      const res = await questionsApi.list(params);
      questions.value = res.items;
      total.value = res.total;
    } finally {
      loading.value = false;
    }
  }

  return { questions, total, loading, page, pageSize, filters, fetchQuestions };
});
