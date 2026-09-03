<template>
  <div
    class="markdown-body"
    v-html="rendered"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
  content: string;
}>();

const rendered = computed(() => {
  if (!props.content) return '';
  return marked.parse(props.content, { async: false }) as string;
});
</script>

<style scoped>
.markdown-body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: #37352f;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #37352f;
}

.markdown-body :deep(h1) {
  font-size: 1.5em;
}
.markdown-body :deep(h2) {
  font-size: 1.3em;
}
.markdown-body :deep(h3) {
  font-size: 1.1em;
}

.markdown-body :deep(p) {
  margin: 0.75em 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5em;
  margin: 0.75em 0;
}

.markdown-body :deep(li) {
  margin: 0.25em 0;
}

.markdown-body :deep(code) {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
  font-size: 0.9em;
  background: #f7f6f3;
  padding: 0.15em 0.4em;
  border-radius: 3px;
  color: #eb5757;
}

.markdown-body :deep(pre) {
  background: #f7f6f3;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  color: #37352f;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid #e9e9e7;
  padding-left: 16px;
  margin: 1em 0;
  color: #787774;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #e9e9e7;
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #f7f6f3;
  font-weight: 500;
}

.markdown-body :deep(strong) {
  font-weight: 600;
}

.markdown-body :deep(a) {
  color: #2383e2;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #e9e9e7;
  margin: 1.5em 0;
}
</style>
