import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/questions' },
    {
      path: '/questions',
      name: 'questions',
      component: () => import('@/views/Questions/QuestionList.vue'),
    },
    {
      path: '/questions/:id',
      name: 'question-detail',
      component: () => import('@/views/Questions/QuestionDetail.vue'),
    },
    {
      path: '/practice',
      name: 'practice',
      component: () => import('@/views/Practice/PracticePage.vue'),
    },
    {
      path: '/review',
      name: 'review',
      component: () => import('@/views/Practice/ReviewQueue.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/Stats/StatsPanel.vue'),
    },
    {
      path: '/knowledge-points',
      name: 'knowledge-points',
      component: () => import('@/views/KnowledgePoints/KnowledgePointList.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('@/views/Tags/TagList.vue'),
    },
    {
      path: '/settings/io',
      name: 'import-export',
      component: () => import('@/views/ImportExport/ImportExportPage.vue'),
    },
  ],
});

export default router;
