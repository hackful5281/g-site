<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ language: { type: String, required: true } });
defineEmits(['back']);

const input = ref('Hello world\nHello world\n\\u4f60\\u597d');

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Text Toolbox',
    title: '文字工具箱',
    description: '统计字数、去空行、去重复行、大小写转换和 Unicode 转中文。',
    chars: '字符',
    lines: '行数',
    words: '单词',
    upper: '转大写',
    lower: '转小写',
    trimBlank: '去空行',
    unique: '去重复行',
    unicode: 'Unicode 转中文',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Text Toolbox',
    title: 'Text Toolbox',
    description: 'Count text, remove blank or duplicate lines, change case, and decode Unicode escapes.',
    chars: 'Characters',
    lines: 'Lines',
    words: 'Words',
    upper: 'Uppercase',
    lower: 'Lowercase',
    trimBlank: 'Remove blanks',
    unique: 'Unique lines',
    unicode: 'Unicode to text',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);

// 实时统计字符数、行数和粗略单词数。
const stats = computed(() => {
  const wordCount = input.value.trim() ? input.value.trim().split(/\s+/).length : 0;
  return `${text.value.chars}: ${input.value.length} / ${text.value.lines}: ${input.value.split('\n').length} / ${text.value.words}: ${wordCount}`;
});

// 转成大写，适合处理英文标题或常量名。
function upper() {
  input.value = input.value.toUpperCase();
}

// 转成小写，适合处理 URL slug 或统一英文文本。
function lower() {
  input.value = input.value.toLowerCase();
}

// 删除纯空白行，保留原有非空文本顺序。
function trimBlank() {
  input.value = input.value.split('\n').filter((line) => line.trim()).join('\n');
}

// 使用 Set 去除完全相同的重复行。
function uniqueLines() {
  input.value = [...new Set(input.value.split('\n'))].join('\n');
}

// 将 \u4f60\u597d 这类 Unicode 转义恢复成可读中文。
function unicodeToText() {
  input.value = input.value.replace(/\\u([\dA-Fa-f]{4})/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}
</script>

<template>
  <section class="utility-page">
    <button class="tool-back" type="button" @click="$emit('back')">{{ text.back }}</button>
    <div class="utility-hero">
      <p class="eyebrow">{{ text.eyebrow }}</p>
      <h1>{{ text.title }}</h1>
      <p>{{ text.description }}</p>
    </div>
    <section class="utility-panel">
      <textarea v-model="input" class="utility-textarea"></textarea>
      <p class="utility-output">{{ stats }}</p>
      <div class="utility-actions">
        <button class="utility-button" type="button" @click="upper">{{ text.upper }}</button>
        <button class="utility-button" type="button" @click="lower">{{ text.lower }}</button>
        <button class="utility-button" type="button" @click="trimBlank">{{ text.trimBlank }}</button>
        <button class="utility-button" type="button" @click="uniqueLines">{{ text.unique }}</button>
        <button class="utility-button primary" type="button" @click="unicodeToText">{{ text.unicode }}</button>
      </div>
    </section>
  </section>
</template>
