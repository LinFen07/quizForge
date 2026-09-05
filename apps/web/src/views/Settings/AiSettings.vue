<template>
  <div class="ai-settings">
    <div class="page-header">
      <h1 class="page-title">
        AI 设置
      </h1>
    </div>

    <div class="settings-card">
      <div
        v-if="loading"
        class="loading"
      >
        加载中...
      </div>

      <form
        v-else
        @submit.prevent="handleSave"
      >
        <div class="form-group">
          <label>AI 服务商</label>
          <select v-model="form.provider">
            <option value="openai">
              OpenAI
            </option>
            <option value="claude">
              Anthropic Claude
            </option>
            <option value="deepseek">
              DeepSeek
            </option>
            <option value="ollama">
              Ollama (本地)
            </option>
          </select>
        </div>

        <div
          v-if="form.provider !== 'ollama'"
          class="form-group"
        >
          <label>API Key</label>
          <input
            v-model="form.apiKey"
            type="password"
            :placeholder="`输入 ${providerLabel} API Key`"
          >
          <div class="field-hint">
            API Key 存储在数据库中，不会泄露
          </div>
        </div>

        <div
          v-if="form.provider === 'ollama'"
          class="form-group"
        >
          <label>服务地址</label>
          <input
            v-model="form.baseUrl"
            placeholder="http://localhost:11434"
          >
        </div>

        <div class="form-group">
          <label>模型 (可选)</label>
          <input
            v-model="form.model"
            :placeholder="modelPlaceholder"
          >
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="primary"
            :disabled="saving"
          >
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
          <button
            type="button"
            class="secondary"
            @click="handleTest"
          >
            测试连接
          </button>
        </div>

        <div
          v-if="testResult"
          :class="['test-result', testResult.success ? 'success' : 'error']"
        >
          {{ testResult.message }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { aiApi } from '@/api';

const loading = ref(true);
const saving = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

const form = ref({
  provider: 'openai',
  apiKey: '',
  baseUrl: '',
  model: '',
});

const providerLabel = computed(() => {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    claude: 'Claude',
    deepseek: 'DeepSeek',
    ollama: 'Ollama',
  };
  return labels[form.value.provider] || form.value.provider;
});

const modelPlaceholder = computed(() => {
  const defaults: Record<string, string> = {
    openai: 'gpt-4o-mini',
    claude: 'claude-3-haiku-20240307',
    deepseek: 'deepseek-chat',
    ollama: 'llama3',
  };
  return defaults[form.value.provider] || '留空使用默认模型';
});

onMounted(async () => {
  try {
    const settings = await aiApi.getSettings();
    form.value = {
      provider: settings.provider || 'openai',
      apiKey: settings.apiKey || '',
      baseUrl: settings.baseUrl || '',
      model: settings.model || '',
    };
  } finally {
    loading.value = false;
  }
});

async function handleSave() {
  saving.value = true;
  testResult.value = null;
  try {
    await aiApi.updateSettings(form.value);
    testResult.value = { success: true, message: '设置已保存' };
  } catch (err: any) {
    testResult.value = { success: false, message: '保存失败: ' + err.message };
  } finally {
    saving.value = false;
  }
}

async function handleTest() {
  testResult.value = null;
  try {
    await aiApi.generateQuestions({ count: 1 });
    testResult.value = { success: true, message: '连接测试成功' };
  } catch (err: any) {
    testResult.value = { success: false, message: '连接失败: ' + err.message };
  }
}
</script>

<style scoped>
.ai-settings {
  max-width: 600px;
}

.settings-card {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #787774;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-hint {
  font-size: 12px;
  color: #9b9a97;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.test-result {
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
}

.test-result.success {
  background: #e6f5f0;
  color: #0f7b6c;
}

.test-result.error {
  background: #fde8e8;
  color: #eb5757;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #787774;
}
</style>
