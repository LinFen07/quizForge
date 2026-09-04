<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">公司管理</h1>
      <button class="primary" @click="openCreate()">新建公司</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="companies.length === 0" class="empty">暂无公司，点击上方按钮新建</div>

    <div v-else class="company-list">
      <div v-for="c in companies" :key="c.id" class="card company-card">
        <div class="c-content">
          <div class="c-header">
            <span class="c-name">{{ c.name }}</span>
            <span v-if="c._count" class="c-count">{{ c._count.questions }} 题</span>
          </div>
          <div v-if="c.alias" class="c-alias">别名: {{ c.alias }}</div>
        </div>
        <div class="c-actions">
          <button class="small" @click="openEdit(c)">编辑</button>
          <button class="small danger" @click="handleDelete(c)">删除</button>
        </div>
      </div>
    </div>

    <Modal
      :visible="showModal"
      :title="editingCompany ? '编辑公司' : '新建公司'"
      :loading="submitting"
      @close="closeModal"
      @confirm="handleSubmit"
    >
      <div class="form-group">
        <label>公司名称</label>
        <input v-model="formData.name" placeholder="如：字节跳动" />
      </div>
      <div class="form-group">
        <label>别名（JSON 数组格式）</label>
        <input v-model="formData.alias" placeholder='如：["ByteDance", "字节"]' />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { companiesApi } from '@/api';
import Modal from '@/components/Modal.vue';

const companies = ref<any[]>([]);
const loading = ref(false);
const showModal = ref(false);
const submitting = ref(false);
const editingCompany = ref<any>(null);

const formData = reactive({
  name: '',
  alias: '',
});

function openCreate() {
  editingCompany.value = null;
  formData.name = '';
  formData.alias = '';
  showModal.value = true;
}

function openEdit(company: any) {
  editingCompany.value = company;
  formData.name = company.name;
  formData.alias = company.alias || '';
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingCompany.value = null;
}

async function fetchList() {
  loading.value = true;
  try {
    companies.value = await companiesApi.list(true);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!formData.name.trim()) return;
  submitting.value = true;
  try {
    const data: any = { name: formData.name };
    if (formData.alias) data.alias = formData.alias;

    if (editingCompany.value) {
      await companiesApi.update(editingCompany.value.id, data);
    } else {
      await companiesApi.create(data);
    }
    await fetchList();
    closeModal();
  } catch (err: any) {
    alert(err.message || '操作失败');
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(company: any) {
  if (!confirm(`确定删除公司 "${company.name}" 吗？`)) return;
  try {
    await companiesApi.remove(company.id);
    await fetchList();
  } catch (err: any) {
    alert(err.message || '删除失败');
  }
}

onMounted(fetchList);
</script>

<style scoped>
.company-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.company-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.c-content {
  flex: 1;
}

.c-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.c-name {
  font-size: 1rem;
  font-weight: 500;
}

.c-count {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.c-alias {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.c-actions {
  display: flex;
  gap: 0.5rem;
}

.small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.small.danger {
  background: #fee2e2;
  color: #dc2626;
}

.small.danger:hover {
  background: #fecaca;
}

.loading, .empty {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-group input {
  width: 100%;
}
</style>
