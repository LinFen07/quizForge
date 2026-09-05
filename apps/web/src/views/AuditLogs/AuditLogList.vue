<template>
  <div class="audit-logs">
    <div class="page-header">
      <h1 class="page-title">
        审计日志
      </h1>
      <div class="header-actions">
        <select
          v-model="filter.entity"
          class="filter-select"
        >
          <option value="">
            全部类型
          </option>
          <option value="question">
            题目
          </option>
          <option value="tag">
            标签
          </option>
          <option value="knowledge_point">
            知识点
          </option>
          <option value="practice">
            练习
          </option>
        </select>
        <button
          class="secondary"
          @click="fetchLogs"
        >
          刷新
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <div
      v-else-if="logs.length === 0"
      class="empty-state"
    >
      <div class="empty-content">
        <h3>暂无审计日志</h3>
        <p>执行操作后会自动记录日志</p>
      </div>
    </div>

    <div
      v-else
      class="log-table"
    >
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>类型</th>
            <th>ID</th>
            <th>操作</th>
            <th>变更详情</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
          >
            <td class="time-cell">
              {{ formatTime(log.createdAt) }}
            </td>
            <td>
              <span :class="['entity-badge', log.entity]">{{
                entityLabels[log.entity] || log.entity
              }}</span>
            </td>
            <td class="id-cell">
              #{{ log.entityId }}
            </td>
            <td>
              <span :class="['action-badge', log.action]">{{
                actionLabels[log.action] || log.action
              }}</span>
            </td>
            <td class="changes-cell">
              <span
                v-if="log.changes"
                class="changes-preview"
                @click="showChanges(log)"
              >
                查看变更
              </span>
              <span
                v-else
                class="no-changes"
              >-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal
      v-if="selectedLog"
      :visible="!!selectedLog"
      title="变更详情"
      @close="selectedLog = null"
    >
      <div class="changes-detail">
        <div
          v-if="selectedLog.changes"
          class="changes-json"
        >
          <pre>{{ formatChanges(selectedLog.changes) }}</pre>
        </div>
        <div
          v-else
          class="no-detail"
        >
          无详细变更信息
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { auditApi } from '@/api';
import Modal from '@/components/Modal.vue';

interface AuditLog {
  id: number;
  entity: string;
  entityId: number;
  action: string;
  changes: string | null;
  createdAt: string;
}

const entityLabels: Record<string, string> = {
  question: '题目',
  tag: '标签',
  knowledge_point: '知识点',
  practice: '练习',
};

const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  restore: '恢复',
  batch_delete: '批量删除',
  batch_update: '批量更新',
};

const logs = ref<AuditLog[]>([]);
const loading = ref(true);
const filter = ref({ entity: '' });
const selectedLog = ref<AuditLog | null>(null);

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN');
}

function formatChanges(changes: string) {
  try {
    const obj = JSON.parse(changes);
    return JSON.stringify(obj, null, 2);
  } catch {
    return changes;
  }
}

function showChanges(log: AuditLog) {
  selectedLog.value = log;
}

async function fetchLogs() {
  loading.value = true;
  try {
    logs.value = (await auditApi.getRecent(100)) as AuditLog[];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchLogs);
</script>

<style scoped>
.audit-logs {
  max-width: 1000px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e9e9e7;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
}

.log-table {
  padding: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #787774;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e9e9e7;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0ed;
  font-size: 14px;
}

tr:hover {
  background: #fafaf9;
}

.time-cell {
  color: #787774;
  font-size: 13px;
  white-space: nowrap;
}

.id-cell {
  font-family: 'SF Mono', monospace;
  color: #787774;
}

.entity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.entity-badge.question {
  background: #e8f4f8;
  color: #0f7b6c;
}

.entity-badge.tag {
  background: #f0f0ff;
  color: #5849d4;
}

.entity-badge.knowledge_point {
  background: #fef3e0;
  color: #d9730d;
}

.entity-badge.practice {
  background: #e6f5f0;
  color: #0f7b6c;
}

.action-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.action-badge.create {
  background: #e6f5f0;
  color: #0f7b6c;
}

.action-badge.update {
  background: #e8f4f8;
  color: #2383e2;
}

.action-badge.delete {
  background: #fde8e8;
  color: #eb5757;
}

.action-badge.restore {
  background: #fef3e0;
  color: #d9730d;
}

.changes-preview {
  color: #2383e2;
  cursor: pointer;
  font-size: 13px;
}

.changes-preview:hover {
  text-decoration: underline;
}

.no-changes {
  color: #9b9a97;
}

.changes-detail {
  max-height: 400px;
  overflow-y: auto;
}

.changes-json pre {
  background: #f7f6f3;
  padding: 16px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'SF Mono', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.no-detail {
  color: #787774;
  text-align: center;
  padding: 24px;
}

.loading {
  text-align: center;
  padding: 64px;
  color: #787774;
}

.empty-state {
  padding: 80px 0;
}

.empty-content {
  text-align: center;
}

.empty-content h3 {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #37352f;
  margin: 0 0 8px 0;
}

.empty-content p {
  color: #787774;
  margin: 0;
}
</style>
