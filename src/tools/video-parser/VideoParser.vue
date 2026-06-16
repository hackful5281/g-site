<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  language: {
    type: String,
    required: true,
  },
});

defineEmits(['back']);

const storageKey = 'garens-site-video-parser-url';
const parserBase = 'https://jx.xmflv.com/?url=';
const videoUrl = ref('');
const activeUrl = ref('');
const error = ref('');

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Video Parser',
    title: '视频解析',
    description: '输入视频站点页面地址，点击播放后会在下方嵌入第三方解析页面。',
    placeholder: '粘贴视频页面地址，例如：https://...',
    play: '播放',
    clear: '清空',
    frameTitle: '视频解析播放器',
    empty: '请输入一个视频页面地址。',
    invalid: '请输入以 http:// 或 https:// 开头的完整地址。',
    note: '解析服务来自第三方站点，播放效果取决于目标站点和解析服务的可用性。',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Video Parser',
    title: 'Video Parser',
    description: 'Paste a video page URL and play it through an embedded external parser.',
    placeholder: 'Paste a video page URL, e.g. https://...',
    play: 'Play',
    clear: 'Clear',
    frameTitle: 'Video parser player',
    empty: 'Please enter a video page URL.',
    invalid: 'Please enter a full URL starting with http:// or https://.',
    note: 'The parser is provided by a third party. Playback depends on the target site and parser availability.',
  },
};

const text = computed(() => copy[props.language] ?? copy.zh);
// 第三方解析站点通过 url 参数接收目标页面地址。
const parsedUrl = computed(() => (activeUrl.value ? `${parserBase}${encodeURIComponent(activeUrl.value)}` : ''));

// 去掉前后空格，避免用户复制地址时带入不可见空白。
function normalizeUrl(value) {
  return value.trim();
}

// 播放前统一做 URL 校验，错误信息直接反馈到页面。
function getValidVideoUrl() {
  const value = normalizeUrl(videoUrl.value);
  error.value = '';

  if (!value) {
    error.value = text.value.empty;
    return '';
  }

  if (!/^https?:\/\//i.test(value)) {
    error.value = text.value.invalid;
    return '';
  }

  return value;
}

// 设置 activeUrl 后 iframe 才会真正加载解析页面。
function play() {
  const value = getValidVideoUrl();

  if (!value) {
    return;
  }

  activeUrl.value = value;
}

// 清空输入、当前播放地址和错误提示。
function clearUrl() {
  videoUrl.value = '';
  activeUrl.value = '';
  error.value = '';
}

onMounted(() => {
  // 恢复上次输入过的视频页面地址。
  videoUrl.value = localStorage.getItem(storageKey) ?? '';
});

watch(videoUrl, (value) => {
  // 输入过程中实时保存，刷新页面也不会丢失。
  localStorage.setItem(storageKey, value);
});
</script>

<template>
  <section class="video-page" aria-labelledby="video-parser-title">
    <button class="tool-back" type="button" @click="$emit('back')">
      {{ text.back }}
    </button>

    <div class="video-hero">
      <p class="eyebrow">{{ text.eyebrow }}</p>
      <h1 id="video-parser-title">{{ text.title }}</h1>
      <p>{{ text.description }}</p>
    </div>

    <form class="video-form" @submit.prevent="play">
      <input v-model="videoUrl" type="url" :placeholder="text.placeholder" />
      <button class="video-primary" type="submit">{{ text.play }}</button>
      <button type="button" @click="clearUrl">{{ text.clear }}</button>
    </form>

    <p v-if="error" class="video-error">{{ error }}</p>
    <p class="video-note">{{ text.note }}</p>

    <section class="video-frame-shell">
      <iframe
        v-if="parsedUrl"
        :src="parsedUrl"
        :title="text.frameTitle"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        referrerpolicy="no-referrer"
      ></iframe>
      <div v-else class="video-placeholder">
        {{ text.placeholder }}
      </div>
    </section>
  </section>
</template>
