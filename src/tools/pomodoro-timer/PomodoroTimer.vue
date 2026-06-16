<script setup>
import { computed, onUnmounted, ref } from 'vue';

const props = defineProps({ language: { type: String, required: true } });
defineEmits(['back']);

const focusMinutes = ref(25);
const breakMinutes = ref(5);
const mode = ref('focus');
const remaining = ref(focusMinutes.value * 60);
const running = ref(false);
const message = ref('');
let timer = null;

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Pomodoro',
    title: '番茄钟',
    description: '设置专注和休息时长，开始一段清爽的倒计时。',
    focus: '专注',
    rest: '休息',
    start: '开始',
    pause: '暂停',
    reset: '重置',
    notify: '提醒',
    focusDone: '专注时间结束，休息一下吧。',
    breakDone: '休息结束，可以开始下一轮专注了。',
    enableNotify: '开启通知',
    notifyEnabled: '通知已开启',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Pomodoro',
    title: 'Pomodoro Timer',
    description: 'Set focus and break durations, then start a clean countdown.',
    focus: 'Focus',
    rest: 'Break',
    start: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    notify: 'Alert',
    focusDone: 'Focus time is over. Take a break.',
    breakDone: 'Break is over. Time for another focus round.',
    enableNotify: 'Enable notifications',
    notifyEnabled: 'Notifications enabled',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);

// 将剩余秒数格式化成 00:00，避免模板里写复杂计算。
const timeText = computed(() => {
  const minutes = Math.floor(remaining.value / 60).toString().padStart(2, '0');
  const seconds = (remaining.value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
});

// 切换专注/休息模式时重置当前阶段剩余时间。
function setMode(nextMode) {
  mode.value = nextMode;
  remaining.value = (nextMode === 'focus' ? focusMinutes.value : breakMinutes.value) * 60;
}

// 用 Web Audio 生成短提示音，不依赖外部音频文件。
function playAlarm() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audio = new AudioContext();
  const gain = audio.createGain();
  gain.gain.value = 0.08;
  gain.connect(audio.destination);

  [0, 0.22, 0.44].forEach((offset) => {
    const oscillator = audio.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    oscillator.connect(gain);
    oscillator.start(audio.currentTime + offset);
    oscillator.stop(audio.currentTime + offset + 0.14);
  });
}

// 通知权限必须由用户手势触发，所以提供单独按钮让用户主动开启。
async function requestNotification() {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  message.value = Notification.permission === 'granted' ? text.value.notifyEnabled : message.value;
}

// 到点后同时触发声音、系统通知或 alert 兜底提示。
function notifyTimerDone(doneMode) {
  const body = doneMode === 'focus' ? text.value.focusDone : text.value.breakDone;
  message.value = body;
  playAlarm();

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(text.value.title, { body });
  } else {
    window.alert(body);
  }
}

// 每秒推进倒计时；到 0 后提醒并自动切换到下一阶段。
function tick() {
  if (remaining.value > 0) {
    remaining.value -= 1;
    return;
  }

  const doneMode = mode.value;
  notifyTimerDone(doneMode);
  setMode(doneMode === 'focus' ? 'break' : 'focus');
}

// 开始/暂停共用一个按钮，避免重复创建多个 interval。
function toggle() {
  running.value = !running.value;
  if (running.value) timer = window.setInterval(tick, 1000);
  else window.clearInterval(timer);
}

// 重置当前模式，清理计时器和提示文案。
function reset() {
  window.clearInterval(timer);
  running.value = false;
  message.value = '';
  setMode(mode.value);
}

// 页面切走时停止计时器。
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
      <div class="utility-actions">
        <button class="utility-button" :class="{ primary: mode === 'focus' }" type="button" @click="setMode('focus')">{{ text.focus }}</button>
        <button class="utility-button" :class="{ primary: mode === 'break' }" type="button" @click="setMode('break')">{{ text.rest }}</button>
      </div>
      <div class="timer-display">{{ timeText }}</div>
      <p v-if="message" class="utility-message">{{ message }}</p>
      <div class="utility-grid">
        <label class="utility-field"><span>{{ text.focus }}</span><input v-model.number="focusMinutes" class="utility-input" type="number" min="1" @change="setMode(mode)" /></label>
        <label class="utility-field"><span>{{ text.rest }}</span><input v-model.number="breakMinutes" class="utility-input" type="number" min="1" @change="setMode(mode)" /></label>
      </div>
      <div class="utility-actions">
        <button class="utility-button primary" type="button" @click="toggle">{{ running ? text.pause : text.start }}</button>
        <button class="utility-button" type="button" @click="reset">{{ text.reset }}</button>
        <button class="utility-button" type="button" @click="requestNotification">{{ text.enableNotify }}</button>
      </div>
    </section>
  </section>
</template>
