<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <h2>📚 面试题库</h2>
      </div>
      <nav class="nav">
        <router-link
          to="/questions"
          class="nav-item"
        >
          <span class="icon">📝</span>
          <span class="text">题目管理</span>
        </router-link>
        <router-link
          to="/companies"
          class="nav-item"
        >
          <span class="icon">🏢</span>
          <span class="text">公司管理</span>
        </router-link>
        <router-link
          to="/knowledge-points"
          class="nav-item"
        >
          <span class="icon">🌳</span>
          <span class="text">知识点</span>
        </router-link>
        <router-link
          to="/tags"
          class="nav-item"
        >
          <span class="icon">🏷️</span>
          <span class="text">标签管理</span>
        </router-link>
        <div class="nav-divider" />
        <router-link
          to="/practice"
          class="nav-item highlight"
        >
          <span class="icon">🎯</span>
          <span class="text">刷题模式</span>
        </router-link>
        <router-link
          to="/review"
          class="nav-item"
        >
          <span class="icon">🔄</span>
          <span class="text">复习队列</span>
        </router-link>
        <div class="nav-divider" />
        <router-link
          to="/stats"
          class="nav-item"
        >
          <span class="icon">📊</span>
          <span class="text">统计面板</span>
        </router-link>
        <router-link
          to="/settings/io"
          class="nav-item"
        >
          <span class="icon">⚙️</span>
          <span class="text">导入导出</span>
        </router-link>
      </nav>
    </aside>
    <main class="main">
      <header class="header">
        <h1 class="page-title">
          {{ currentPageTitle }}
        </h1>
      </header>
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const pageTitles: Record<string, string> = {
  questions: '题目管理',
  'question-detail': '题目详情',
  companies: '公司管理',
  'knowledge-points': '知识点管理',
  tags: '标签管理',
  practice: '刷题模式',
  review: '复习队列',
  stats: '统计面板',
  'import-export': '导入导出',
};

const currentPageTitle = computed(() => pageTitles[route.name as string] || '面试题库平台');
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #1e293b;
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.logo {
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
}

.logo h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #334155;
  color: #fff;
}

.nav-item.router-link-active {
  background: #3b82f6;
  color: #fff;
}

.nav-item.highlight {
  color: #22c55e;
}

.nav-item.highlight:hover,
.nav-item.highlight.router-link-active {
  background: #22c55e;
  color: #fff;
}

.nav-divider {
  height: 1px;
  background: #334155;
  margin: 0.5rem 1.5rem;
}

.icon {
  font-size: 1.125rem;
}

.text {
  font-size: 0.875rem;
}

.main {
  flex: 1;
  margin-left: 220px;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.content {
  flex: 1;
  padding: 2rem;
  background: #f8fafc;
}
</style>
