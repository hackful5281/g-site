<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ language: { type: String, required: true } });
defineEmits(['back']);

const hexInput = ref('#2563eb');
const message = ref('');

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Color Tool',
    title: '颜色工具',
    description: '输入或选择颜色，查看 HEX、RGB、HSL，并生成一组可用配色。',
    color: '颜色',
    hex: 'HEX',
    values: '颜色值',
    palette: '配色',
    copy: '复制',
    copied: '已复制',
    invalid: '请输入有效的 HEX 颜色，例如 #2563eb。',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Color Tool',
    title: 'Color Tool',
    description: 'Pick or enter a color, inspect HEX/RGB/HSL, and generate a palette.',
    color: 'Color',
    hex: 'HEX',
    values: 'Values',
    palette: 'Palette',
    copy: 'Copy',
    copied: 'Copied',
    invalid: 'Enter a valid HEX color, e.g. #2563eb.',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);

// 统一整理用户输入，支持 2563eb、#2563eb、#26e 三种常见写法。
const normalizedHex = computed(() => {
  let value = hexInput.value.trim();
  if (!value.startsWith('#')) value = `#${value}`;

  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    value = `#${value.slice(1).split('').map((char) => char + char).join('')}`;
  }

  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : '';
});

// 输入无效时仍提供一个安全色，保证取色器和预览块不会空值报错。
const safeHex = computed(() => normalizedHex.value || '#2563EB');

// 将 HEX 转成 RGB，所有后续颜色计算都基于这个结构。
const rgb = computed(() => {
  const value = safeHex.value.slice(1);
  const num = Number.parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
});

// RGB 转 HSL，便于生成同色系的明暗变化。
const hsl = computed(() => {
  const r = rgb.value.r / 255;
  const g = rgb.value.g / 255;
  const b = rgb.value.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) h = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
});

// 将结构化颜色值整理成可复制的 CSS 文本。
const rgbText = computed(() => `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`);
const hslText = computed(() => `hsl(${hsl.value.h}, ${hsl.value.s}%, ${hsl.value.l}%)`);

// 基于当前色相生成一组同色系和辅助色，避免固定死板的配色。
const palette = computed(() => {
  const hue = hsl.value.h;
  const saturation = Math.max(42, hsl.value.s);
  return [
    safeHex.value,
    `hsl(${hue}, ${saturation}%, 28%)`,
    `hsl(${hue}, ${saturation}%, 44%)`,
    `hsl(${hue}, ${saturation}%, 68%)`,
    `hsl(${(hue + 34) % 360}, ${saturation}%, 56%)`,
    `hsl(${(hue + 180) % 360}, ${saturation}%, 46%)`,
  ];
});

// 取色器返回标准 HEX，直接同步到文本输入框。
function setFromPicker(value) {
  hexInput.value = value.toUpperCase();
  message.value = '';
}

// 复制当前颜色值，并用页面提示替代打断式弹窗。
async function copyValue(value) {
  await navigator.clipboard.writeText(value);
  message.value = text.value.copied;
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
      <div class="utility-grid">
        <label class="utility-field">
          <span>{{ text.color }}</span>
          <input
            class="utility-input color-picker-input"
            type="color"
            :value="safeHex"
            @input="setFromPicker($event.target.value)"
          />
        </label>
        <label class="utility-field">
          <span>{{ text.hex }}</span>
          <input v-model="hexInput" class="utility-input" type="text" placeholder="#2563eb" />
        </label>
      </div>

      <p v-if="!normalizedHex" class="utility-error">{{ text.invalid }}</p>
      <p v-else-if="message" class="utility-message">{{ message }}</p>

      <div class="color-swatch-large" :style="{ background: safeHex }"></div>

      <section class="utility-result">
        <h2>{{ text.values }}</h2>
        <div class="utility-list">
          <button class="color-value-row" type="button" @click="copyValue(safeHex)">
            <span>HEX</span><strong>{{ safeHex }}</strong><em>{{ text.copy }}</em>
          </button>
          <button class="color-value-row" type="button" @click="copyValue(rgbText)">
            <span>RGB</span><strong>{{ rgbText }}</strong><em>{{ text.copy }}</em>
          </button>
          <button class="color-value-row" type="button" @click="copyValue(hslText)">
            <span>HSL</span><strong>{{ hslText }}</strong><em>{{ text.copy }}</em>
          </button>
        </div>
      </section>

      <section class="utility-result">
        <h2>{{ text.palette }}</h2>
        <div class="color-palette-grid">
          <button
            v-for="item in palette"
            :key="item"
            class="color-chip"
            type="button"
            :style="{ background: item }"
            @click="copyValue(item)"
          >
            <span>{{ item }}</span>
          </button>
        </div>
      </section>
    </section>
  </section>
</template>
