<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({ language: { type: String, required: true } });
defineEmits(['back']);

const now = ref(Date.now());
const timestamp = ref(String(Date.now()));
const unit = ref('ms');
const dateValue = ref(new Date().toISOString().slice(0, 16));
let timer = null;

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Timestamp',
    title: '时间戳转换',
    description: '秒/毫秒时间戳与本地日期时间互相转换。',
    current: '当前时间',
    timestamp: '时间戳',
    unit: '单位',
    date: '日期时间',
    millisecond: '毫秒',
    second: '秒',
    toDate: '转日期',
    toTimestamp: '转时间戳',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Timestamp',
    title: 'Timestamp Converter',
    description: 'Convert Unix timestamps in seconds or milliseconds to local date time and back.',
    current: 'Current time',
    timestamp: 'Timestamp',
    unit: 'Unit',
    date: 'Date time',
    millisecond: 'Milliseconds',
    second: 'Seconds',
    toDate: 'To date',
    toTimestamp: 'To timestamp',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);

// 同时展示毫秒和秒，方便开发时直接复制需要的单位。
const currentText = computed(() => `${now.value} / ${Math.floor(now.value / 1000)}`);

// 根据秒/毫秒单位把时间戳转换成本地 datetime-local 可识别的值。
function toDate() {
  const value = Number(timestamp.value);
  const ms = unit.value === 's' ? value * 1000 : value;
  dateValue.value = new Date(ms).toISOString().slice(0, 16);
}

// 把日期控件的值转成时间戳，并按当前单位输出秒或毫秒。
function toTimestamp() {
  const ms = new Date(dateValue.value).getTime();
  timestamp.value = String(unit.value === 's' ? Math.floor(ms / 1000) : ms);
}

onMounted(() => {
  // 当前时间每秒刷新一次，只用于展示，不影响用户手动输入。
  timer = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

// 离开页面时清理计时器，避免后台继续运行。
onUnmounted(() => window.clearInterval(timer));
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
      <p class="utility-output">{{ text.current }}: {{ currentText }}</p>
      <div class="utility-grid three">
        <label class="utility-field"><span>{{ text.timestamp }}</span><input v-model="timestamp" class="utility-input" /></label>
        <label class="utility-field"><span>{{ text.unit }}</span><select v-model="unit" class="utility-select"><option value="ms">{{ text.millisecond }}</option><option value="s">{{ text.second }}</option></select></label>
        <label class="utility-field"><span>{{ text.date }}</span><input v-model="dateValue" class="utility-input" type="datetime-local" /></label>
      </div>
      <div class="utility-actions">
        <button class="utility-button primary" type="button" @click="toDate">{{ text.toDate }}</button>
        <button class="utility-button" type="button" @click="toTimestamp">{{ text.toTimestamp }}</button>
      </div>
    </section>
  </section>
</template>
