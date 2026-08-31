<template>
  <div class="app">
    <nav class="sidebar">
      <div class="logo">面试题库</div>
      <router-link to="/questions" class="nav-item">题目管理</router-link>
      <router-link to="/practice" class="nav-item">刷题</router-link>
      <router-link to="/review" class="nav-item">复习队列</router-link>
      <router-link to="/stats" class="nav-item">统计面板</router-link>
      <router-link to="/knowledge-points" class="nav-item">知识点</router-link>
      <router-link to="/tags" class="nav-item">标签</router-link>
      <router-link to="/settings/io" class="nav-item">导入导出</router-link>
    </nav>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 200px;
  background: #1a1a2e;
  color: #fff;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: bold;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #333;
}

.nav-item {
  color: #ccc;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.nav-item:hover {
  background: #16213e;
}

.nav-item.router-link-active {
  background: #0f3460;
  color: #fff;
}

.content {
  flex: 1;
  padding: 1.5rem;
  background: #f5f5f5;
}
</style>
