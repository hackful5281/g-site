<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';

const props = defineProps({ language: { type: String, required: true } });
defineEmits(['back']);

const defaultOptions = {
  zh: '旅行\n火锅\n电影\n散步\n学习\n咖啡\n游戏\n阅读',
  en: 'Travel\nHotpot\nMovie\nWalk\nStudy\nCoffee\nGame\nReading',
};

const rawOptions = ref(defaultOptions[props.language] ?? defaultOptions.zh);
const result = ref('');
const rotation = ref(0);
const multiplier = ref(5);
const speed = ref(1);
const spinDuration = ref(2.8);
const isSpinning = ref(false);
const soundEnabled = ref(true);
let spinSoundTimer = null;

const colors = ['#5b7cfa', '#59c38b', '#f2be5c', '#d98bdb', '#fb7a70', '#45b7c4'];

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Spin Wheel',
    title: '抽签转盘',
    description: '每行一个候选项，调节倍率和转速后开始抽签。',
    options: '候选项',
    multiplier: '倍率',
    speed: '转速',
    duration: '旋转时长',
    sound: '转盘声音',
    spinning: '转动中...',
    ready: '准备开始',
    spin: '开始',
    reset: '重置',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Spin Wheel',
    title: 'Spin Wheel',
    description: 'Put one option per line, then tune the multiplier and speed before spinning.',
    options: 'Options',
    multiplier: 'Multiplier',
    speed: 'Speed',
    duration: 'Duration',
    sound: 'Wheel sound',
    spinning: 'Spinning...',
    ready: 'Ready to spin',
    spin: 'Spin',
    reset: 'Reset',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);
// 结果区有真实结果时展示结果，否则展示当前语言下的待开始文案。
const displayResult = computed(() => result.value || text.value.ready);

// 每行一个候选项，过滤空行后作为抽签池。
const options = computed(() => rawOptions.value.split('\n').map((item) => item.trim()).filter(Boolean));
const segmentAngle = computed(() => (options.value.length ? 360 / options.value.length : 360));
// CSS 动画时长由滑块控制，结果公布也复用同一个时长。
const duration = computed(() => `${spinDuration.value.toFixed(1)}s`);

// 用 conic-gradient 生成转盘分区，避免引入 canvas 或 SVG。
const wheelBackground = computed(() => {
  if (!options.value.length) {
    return '#d8dee8';
  }

  return options.value
    .map((_, index) => {
      const start = index * segmentAngle.value;
      const end = (index + 1) * segmentAngle.value;
      return `${colors[index % colors.length]} ${start}deg ${end}deg`;
    })
    .join(', ');
});

// 每个扇区的文字单独定位，并反向旋转保持正直。
const segmentLabels = computed(() =>
  options.value.map((label, index) => {
    const angle = index * segmentAngle.value + segmentAngle.value / 2;
    return {
      id: `${label}-${index}`,
      label,
      style: {
        '--label-angle': `${angle}deg`,
      },
    };
  }),
);

function reset() {
  window.clearInterval(spinSoundTimer);
  rotation.value = 0;
  result.value = '';
  isSpinning.value = false;
}

// 使用 Web Audio 动态合成提示音，避免额外引入音频文件。
function playTone(frequency, duration = 0.05, volume = 0.045) {
  if (!soundEnabled.value) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

// 转动中按当前转速播放短促节拍，结束时播放一个收尾音。
function startSpinSound(totalMs) {
  if (!soundEnabled.value) return;

  window.clearInterval(spinSoundTimer);
  let tick = 0;
  spinSoundTimer = window.setInterval(() => {
    playTone(420 + (tick % 5) * 42, 0.035, 0.035);
    tick += 1;
  }, Math.max(60, 140 / speed.value));

  window.setTimeout(() => {
    window.clearInterval(spinSoundTimer);
    playTone(760, 0.12, 0.06);
  }, totalMs);
}

// 让被抽中的扇区最终停在右侧指针位置；倍率控制额外旋转圈数，旋转时长控制动画和开奖延迟。
function spin() {
  if (!options.value.length || isSpinning.value) return;

  const index = Math.floor(Math.random() * options.value.length);
  const nextResult = options.value[index];
  const centerAngle = index * segmentAngle.value + segmentAngle.value / 2;
  const current = rotation.value % 360;
  const targetAtPointer = 90;
  const delta = 360 * multiplier.value + targetAtPointer - centerAngle - current;
  const totalMs = spinDuration.value * 1000;

  isSpinning.value = true;
  // 转盘停止前不提前暴露结果，避免用户感觉“先开奖后转动”。
  result.value = text.value.spinning;
  rotation.value += delta;
  startSpinSound(totalMs);

  window.setTimeout(() => {
    result.value = nextResult;
    isSpinning.value = false;
  }, totalMs);
}

// 离开页面时清理声音节拍，避免后台继续播放。
onUnmounted(() => {
  window.clearInterval(spinSoundTimer);
});

watch(
  () => props.language,
  (nextLanguage, oldLanguage) => {
    // 如果用户还没改过默认候选项，切换语言时同步默认示例；已编辑的内容不覆盖。
    if (rawOptions.value === defaultOptions[oldLanguage]) {
      rawOptions.value = defaultOptions[nextLanguage] ?? defaultOptions.zh;
    }
    // 切换语言时清空非最终态文案，避免“准备开始”和英文界面混排。
    if (!isSpinning.value) result.value = '';
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

    <section class="wheel-layout">
      <div class="utility-panel wheel-stage">
        <div class="wheel-result-bar">
          <span>{{ displayResult }}</span>
        </div>

        <div
          class="wheel-shell"
          role="button"
          tabindex="0"
          @click="spin"
          @keydown.enter.prevent="spin"
          @keydown.space.prevent="spin"
        >
          <div class="wheel-pointer" aria-hidden="true"></div>
          <div
            class="wheel-disc"
            :style="{
              '--wheel-bg': wheelBackground,
              '--wheel-duration': duration,
              transform: `rotate(${rotation}deg)`,
            }"
          >
            <span
              v-for="item in segmentLabels"
              :key="item.id"
              class="wheel-segment-label"
              :style="item.style"
            >
              {{ item.label }}
            </span>
          </div>
          <strong class="wheel-result">{{ displayResult }}</strong>
        </div>
      </div>

      <div class="utility-panel wheel-control-panel">
        <label class="utility-field">
          <span>{{ text.options }}</span>
          <textarea v-model="rawOptions" class="utility-textarea"></textarea>
        </label>

        <div class="utility-grid">
          <label class="utility-field">
            <span>{{ text.multiplier }} x{{ multiplier }}</span>
            <input v-model.number="multiplier" type="range" min="1" max="12" />
          </label>
          <label class="utility-field">
            <span>{{ text.speed }} x{{ speed }}</span>
            <input v-model.number="speed" type="range" min="0.5" max="3" step="0.5" />
          </label>
          <label class="utility-field">
            <span>{{ text.duration }} {{ spinDuration.toFixed(1) }}s</span>
            <input v-model.number="spinDuration" type="range" min="0.8" max="8" step="0.2" />
          </label>
        </div>

        <label class="utility-check">
          <input v-model="soundEnabled" type="checkbox" />
          {{ text.sound }}
        </label>

        <div class="utility-actions">
          <button class="utility-button primary" type="button" :disabled="isSpinning" @click="spin">
            {{ text.spin }}
          </button>
          <button class="utility-button" type="button" @click="reset">{{ text.reset }}</button>
        </div>
      </div>
    </section>
  </section>
</template>
