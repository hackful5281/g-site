<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ language: { type: String, required: true } });
defineEmits(['back']);

const input = ref('{"hello":"world","items":[1,2,3]}');
const output = ref('');
const error = ref('');

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'JSON Formatter',
    title: 'JSON 格式化',
    description: '格式化、压缩和校验 JSON 内容。',
    placeholder: '粘贴 JSON',
    format: '格式化',
    minify: '压缩',
    copy: '复制结果',
    copied: '已复制',
    invalid: 'JSON 解析失败，请检查格式。',
  },
  en: {
    back: 'Back home',
    eyebrow: 'JSON Formatter',
    title: 'JSON Formatter',
    description: 'Format, minify, and validate JSON content.',
    placeholder: 'Paste JSON',
    format: 'Format',
    minify: 'Minify',
    copy: 'Copy result',
    copied: 'Copied',
    invalid: 'JSON parsing failed. Check the syntax.',
  },
};

// 页面文案按当前语言读取，错误提示和按钮文案统一从这里取。
const text = computed(() => copy[props.language] ?? copy.zh);

// 所有 JSON 操作先经过统一解析，失败时只更新错误提示，不抛到页面外。
function parseJson() {
  error.value = '';
  try {
    return JSON.parse(input.value);
  } catch {
    error.value = text.value.invalid;
    return null;
  }
}

// 用 2 个空格缩进格式化，便于阅读接口返回。
function formatJson() {
  const data = parseJson();
  if (data !== null) output.value = JSON.stringify(data, null, 2);
}

// 压缩为单行 JSON，适合复制到配置或请求参数里。
function minifyJson() {
  const data = parseJson();
  if (data !== null) output.value = JSON.stringify(data);
}

// 输出区复制到剪贴板。
async function copyOutput() {
  await navigator.clipboard.writeText(output.value);
  error.value = text.value.copied;
}

// 初始化时格式化示例内容，让用户一打开就能看到效果。
formatJson();
</script>

<template>
  <section class="utility-page">
    <button class="tool-back" type="button" @click="$emit('back')">{{ text.back }}</button>
    <div class="utility-hero">
      <p class="eyebrow">{{ text.eyebrow }}</p>
      <h1>{{ text.title }}</h1>
      <p>{{ text.description }}</p>
    </div>
    <section class="utility-grid json-formatter-grid">
      <div class="utility-panel json-formatter-panel">
        <textarea v-model="input" class="utility-textarea" :placeholder="text.placeholder"></textarea>
        <div class="utility-actions">
          <button class="utility-button primary" type="button" @click="formatJson">{{ text.format }}</button>
          <button class="utility-button" type="button" @click="minifyJson">{{ text.minify }}</button>
        </div>
      </div>
      <div class="utility-panel json-formatter-panel">
        <textarea v-model="output" class="utility-textarea" readonly></textarea>
        <button class="utility-button" type="button" :disabled="!output" @click="copyOutput">{{ text.copy }}</button>
      </div>
    </section>
    <p v-if="error" class="utility-error">{{ error }}</p>
  </section>
</template>
