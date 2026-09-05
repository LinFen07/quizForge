<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <h2>面试题库</h2>
      </div>
      <nav class="nav">
        <router-link
          to="/questions"
          class="nav-item"
        >
          <span class="nav-text">题目管理</span>
        </router-link>
        <router-link
          to="/companies"
          class="nav-item"
        >
          <span class="nav-text">公司管理</span>
        </router-link>
        <router-link
          to="/knowledge-points"
          class="nav-item"
        >
          <span class="nav-text">知识点</span>
        </router-link>
        <router-link
          to="/tags"
          class="nav-item"
        >
          <span class="nav-text">标签管理</span>
        </router-link>
        <div class="nav-divider" />
        <router-link
          to="/practice"
          class="nav-item nav-primary"
        >
          <span class="nav-text">刷题模式</span>
        </router-link>
        <router-link
          to="/review"
          class="nav-item"
        >
          <span class="nav-text">复习队列</span>
        </router-link>
        <div class="nav-divider" />
        <router-link
          to="/stats"
          class="nav-item"
        >
          <span class="nav-text">统计面板</span>
        </router-link>
        <router-link
          to="/audit-logs"
          class="nav-item"
        >
          <span class="nav-text">审计日志</span>
        </router-link>
        <div class="nav-divider" />
        <router-link
          to="/settings/io"
          class="nav-item"
        >
          <span class="nav-text">导入导出</span>
        </router-link>
        <router-link
          to="/settings/ai"
          class="nav-item"
        >
          <span class="nav-text">AI 设置</span>
        </router-link>
      </nav>
    </aside>
    <main class="main">
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #ffffff;
}

.sidebar {
  width: 240px;
  background: #f7f6f3;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  border-right: 1px solid #e9e9e7;
}

.logo {
  padding: 24px 20px;
  border-bottom: 1px solid #e9e9e7;
}

.logo h2 {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #37352f;
  margin: 0;
  letter-spacing: -0.01em;
}

.nav {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  color: #787774;
  text-decoration: none;
  border-radius: 4px;
  transition:
    background 150ms ease,
    color 150ms ease;
  margin-bottom: 2px;
}

.nav-item:hover {
  background: rgba(55, 53, 47, 0.04);
  color: #37352f;
}

.nav-item.router-link-active {
  background: rgba(55, 53, 47, 0.06);
  color: #37352f;
  font-weight: 500;
}

.nav-primary {
  color: #2383e2;
}

.nav-primary:hover {
  background: rgba(35, 131, 226, 0.06);
  color: #2383e2;
}

.nav-primary.router-link-active {
  background: rgba(35, 131, 226, 0.08);
  color: #2383e2;
}

.nav-divider {
  height: 1px;
  background: #e9e9e7;
  margin: 8px 12px;
}

.nav-text {
  font-size: 14px;
  line-height: 1.5;
}

.main {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  flex: 1;
  padding: 32px 40px;
  max-width: 1200px;
}
</style>
