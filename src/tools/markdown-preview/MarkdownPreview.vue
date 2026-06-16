<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({ language: { type: String, required: true } });
defineEmits(['back']);

const defaultMarkdown = {
  zh: '# 标题\n\n这是一段 **Markdown** 文本。\n\n- 支持列表\n- 支持粗体\n- 支持链接：https://example.com',
  en: '# Title\n\nThis is a **Markdown** sample.\n\n- Lists\n- Bold text\n- Links: https://example.com',
};

const markdown = ref(defaultMarkdown[props.language] ?? defaultMarkdown.zh);

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Markdown',
    title: 'Markdown 预览',
    description: '左侧编辑 Markdown，右侧实时预览。',
    input: '编辑',
    preview: '预览',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Markdown',
    title: 'Markdown Preview',
    description: 'Edit Markdown on the left and preview it live on the right.',
    input: 'Editor',
    preview: 'Preview',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);

// v-html 渲染前先转义 HTML，避免用户输入脚本被直接执行。
function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 轻量 Markdown 解析器，只覆盖常用语法；复杂场景后续可替换为 markdown-it。
const html = computed(() => {
  let value = escapeHtml(markdown.value);
  value = value.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  value = value.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  value = value.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  value = value.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  value = value.replace(/`([^`]+)`/g, '<code>$1</code>');
  value = value.replace(/^- (.*)$/gm, '<li>$1</li>');
  value = value.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  value = value.replace(/\n{2,}/g, '</p><p>');
  value = value.replace(/\n/g, '<br>');
  return `<p>${value}</p>`;
});

watch(
  () => props.language,
  (nextLanguage, oldLanguage) => {
    // 只有内容仍是默认示例时才跟随语言切换，避免覆盖用户正在编辑的 Markdown。
    if (markdown.value === defaultMarkdown[oldLanguage]) {
      markdown.value = defaultMarkdown[nextLanguage] ?? defaultMarkdown.zh;
    }
  },
);
</script>

<template>
  <section class="utility-page">
    <button class="tool-back" type="button" @click="$emit('back')">{{ text.back }}</button>
    <div class="utility-hero">
      <p class="eyebrow">{{ text.eyebrow }}</p>
      <h1>{{ text.title }}</h1>
      <p>{{ text.description }}</p>
    </div>
    <section class="utility-grid markdown-preview-grid">
      <div class="utility-panel markdown-preview-panel">
        <!-- 左右两侧使用一致的标题 + 内容结构，保证输入框和预览框顶部对齐。 -->
        <span class="markdown-panel-title">{{ text.input }}</span>
        <textarea v-model="markdown" class="utility-textarea markdown-editor"></textarea>
      </div>
      <div class="utility-panel markdown-preview-panel">
        <span class="markdown-panel-title">{{ text.preview }}</span>
        <div class="utility-preview markdown-rendered" v-html="html"></div>
      </div>
    </section>
  </section>
</template>
