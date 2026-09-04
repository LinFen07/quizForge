<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">
        导入导出
      </h1>
    </div>

    <div class="io-grid">
      <div class="card">
        <h3>导出数据</h3>
        <p>导出全部题目、知识点、标签和刷题记录</p>
        <button
          class="primary"
          @click="handleExport"
        >
          导出 JSON
        </button>
      </div>

      <div class="card">
        <h3>导入题目</h3>
        <p>粘贴 JSON 数据或上传文件</p>
        <textarea
          v-model="importData"
          rows="10"
          placeholder="粘贴 JSON 数据..."
        />
        <button
          class="primary"
          :disabled="!importData"
          @click="handleImport"
        >
          导入
        </button>
      </div>
    </div>

    <div
      v-if="message"
      :class="['message', messageType]"
    >
      <div v-html="message" />
      <div
        v-if="importResult && importResult.imported > 0"
        class="import-guide"
      >
        <p><strong>下一步：</strong>建议为导入的题目设置知识点分类</p>
        <router-link
          to="/questions"
          class="primary"
        >
          前往题目管理 → 批量设置知识点
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { importExportApi } from '@/api';

const importData = ref('');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const importResult = ref<{ imported: number; skipped: number } | null>(null);

async function handleExport() {
  try {
    const data = await importExportApi.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-quiz-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.value = '导出成功';
    messageType.value = 'success';
    importResult.value = null;
  } catch {
    message.value = '导出失败';
    messageType.value = 'error';
    importResult.value = null;
  }
}

async function handleImport() {
  try {
    const data = JSON.parse(importData.value);
    const result = await importExportApi.importQuestions(data.data?.questions ?? data);
    importResult.value = result;
    message.value = `导入完成: <strong>${result.imported}</strong> 成功, <strong>${result.skipped}</strong> 跳过`;
    messageType.value = 'success';
    importData.value = '';
  } catch {
    message.value = '导入失败: JSON 格式错误';
    messageType.value = 'error';
    importResult.value = null;
  }
}
</script>

<style scoped>
.io-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.card h3 {
  margin-bottom: 0.5rem;
}

.card p {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

textarea {
  width: 100%;
  margin-bottom: 1rem;
}

.message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
}

.message.success {
  background: #dcfce7;
  color: #166534;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
}

.import-guide {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #bbf7d0;
}

.import-guide p {
  color: #166534;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.import-guide a {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #16a34a;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.875rem;
}

.import-guide a:hover {
  background: #15803d;
}
</style>
