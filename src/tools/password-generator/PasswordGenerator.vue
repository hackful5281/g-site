<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  language: {
    type: String,
    required: true,
  },
});

defineEmits(['back']);

const length = ref(18);
const count = ref(5);
const useUpper = ref(true);
const useLower = ref(true);
const useNumbers = ref(true);
const useSymbols = ref(true);
const passwords = ref([]);
const message = ref('');

const copy = {
  zh: {
    back: '返回首页',
    title: '随机密码',
    eyebrow: 'Password Generator',
    description: '按规则生成多组密码，所有计算都在浏览器本地完成。',
    length: '长度',
    count: '数量',
    upper: '大写字母',
    lower: '小写字母',
    numbers: '数字',
    symbols: '符号',
    generate: '生成密码',
    copy: '复制',
    copied: '已复制',
    empty: '至少选择一种字符类型。',
  },
  en: {
    back: 'Back home',
    title: 'Password Generator',
    eyebrow: 'Password Generator',
    description: 'Generate multiple passwords locally in your browser.',
    length: 'Length',
    count: 'Count',
    upper: 'Uppercase',
    lower: 'Lowercase',
    numbers: 'Numbers',
    symbols: 'Symbols',
    generate: 'Generate',
    copy: 'Copy',
    copied: 'Copied',
    empty: 'Choose at least one character set.',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);

// 根据用户勾选的规则拼出候选字符集。
function getCharset() {
  let chars = '';
  if (useUpper.value) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLower.value) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (useNumbers.value) chars += '0123456789';
  if (useSymbols.value) chars += '!@#$%^&*()-_=+[]{};:,.?';
  return chars;
}

// 使用 crypto.getRandomValues 生成随机索引，比 Math.random 更适合密码场景。
function randomChar(chars) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return chars[values[0] % chars.length];
}

// 按数量批量生成密码；如果没有任何字符集，直接提示用户。
function generate() {
  const chars = getCharset();
  message.value = '';

  if (!chars) {
    message.value = text.value.empty;
    return;
  }

  passwords.value = Array.from({ length: count.value }, () =>
    Array.from({ length: length.value }, () => randomChar(chars)).join(''),
  );
}

// 复制单条密码到剪贴板，并给出轻量反馈。
async function copyValue(value) {
  await navigator.clipboard.writeText(value);
  message.value = text.value.copied;
}

// 初次打开页面时先生成一组默认密码，避免页面空着。
generate();
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
      <div class="utility-grid">
        <label class="utility-field">
          <span>{{ text.length }}</span>
          <input v-model.number="length" class="utility-input" type="number" min="6" max="64" />
        </label>
        <label class="utility-field">
          <span>{{ text.count }}</span>
          <input v-model.number="count" class="utility-input" type="number" min="1" max="20" />
        </label>
      </div>
      <div class="utility-pill-row">
        <label class="utility-check"><input v-model="useUpper" type="checkbox" />{{ text.upper }}</label>
        <label class="utility-check"><input v-model="useLower" type="checkbox" />{{ text.lower }}</label>
        <label class="utility-check"><input v-model="useNumbers" type="checkbox" />{{ text.numbers }}</label>
        <label class="utility-check"><input v-model="useSymbols" type="checkbox" />{{ text.symbols }}</label>
      </div>
      <div class="utility-actions">
        <button class="utility-button primary" type="button" @click="generate">{{ text.generate }}</button>
      </div>
      <p v-if="message" class="utility-message">{{ message }}</p>
    </section>
    <section class="utility-result utility-list">
      <div v-for="item in passwords" :key="item" class="utility-output">
        {{ item }}
        <button class="utility-button" type="button" @click="copyValue(item)">{{ text.copy }}</button>
      </div>
    </section>
  </section>
</template>
