import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { knowledgePointsApi, tagsApi, companiesApi } from '@/api';
import type { KnowledgePoint, Tag } from '@interview-quiz/shared';

export const useFilterStore = defineStore('filters', () => {
  const knowledgePoints = ref<KnowledgePoint[]>([]);
  const knowledgePointsLoading = ref(false);

  const flatKnowledgePoints = computed(() => {
    const result: KnowledgePoint[] = [];
    function flatten(items: KnowledgePoint[]) {
      for (const item of items) {
        result.push(item);
        if (item.children?.length) {
          flatten(item.children);
        }
      }
    }
    flatten(knowledgePoints.value);
    return result;
  });

  async function fetchKnowledgePoints() {
    if (knowledgePoints.value.length > 0) return;
    knowledgePointsLoading.value = true;
    try {
      knowledgePoints.value = await knowledgePointsApi.tree();
    } finally {
      knowledgePointsLoading.value = false;
    }
  }

  function invalidateKnowledgePoints() {
    knowledgePoints.value = [];
  }

  const tags = ref<Tag[]>([]);
  const tagsLoading = ref(false);

  async function fetchTags(withCount = false) {
    if (tags.value.length > 0) return;
    tagsLoading.value = true;
    try {
      tags.value = await tagsApi.list(withCount);
    } finally {
      tagsLoading.value = false;
    }
  }

  function invalidateTags() {
    tags.value = [];
  }

  const companies = ref<any[]>([]);
  const companiesLoading = ref(false);

  async function fetchCompanies(withCount = false) {
    if (companies.value.length > 0) return;
    companiesLoading.value = true;
    try {
      companies.value = await companiesApi.list(withCount);
    } finally {
      companiesLoading.value = false;
    }
  }

  function invalidateCompanies() {
    companies.value = [];
  }

  async function fetchAll() {
    await Promise.all([fetchKnowledgePoints(), fetchTags(), fetchCompanies()]);
  }

  function invalidateAll() {
    invalidateKnowledgePoints();
    invalidateTags();
    invalidateCompanies();
  }

  return {
    knowledgePoints,
    knowledgePointsLoading,
    flatKnowledgePoints,
    fetchKnowledgePoints,
    invalidateKnowledgePoints,
    tags,
    tagsLoading,
    fetchTags,
    invalidateTags,
    companies,
    companiesLoading,
    fetchCompanies,
    invalidateCompanies,
    fetchAll,
    invalidateAll,
  };
});
