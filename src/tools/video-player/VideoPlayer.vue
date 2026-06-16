<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  language: {
    type: String,
    required: true,
  },
});

defineEmits(['back']);

const storageKey = 'garens-site-video-player-url';
const optionsStorageKey = 'garens-site-video-player-options';
const dplayerScriptUrl = 'https://cdn.jsdelivr.net/npm/dplayer/dist/DPlayer.min.js';
const dplayerStyleUrl = 'https://cdn.jsdelivr.net/npm/dplayer/dist/DPlayer.min.css';
const hlsScriptUrl = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';

let dplayerInstance = null;
let dplayerScriptPromise = null;
let hlsScriptPromise = null;

const playerContainer = ref(null);
const videoUrl = ref('');
const activeUrl = ref('');
const error = ref('');
const playerStatus = ref('');
const isLoading = ref(false);
const advancedOpen = ref(false);
const danmakuApi = ref('');
const danmakuId = ref('');
const danmakuAddition = ref('');
const subtitleUrl = ref('');
const subtitleType = ref('webvtt');
const subtitleName = ref('');

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Video Player',
    title: '视频播放器',
    description: '输入 m3u8、mp4、webm 等公开视频地址，使用 DPlayer 在页面中直接播放。',
    placeholder: '粘贴视频地址，例如：https://example.com/video.m3u8',
    advanced: '弹幕与字幕',
    danmakuAddition: '弹幕 JSON 地址',
    danmakuAdditionPlaceholder: '例如：https://s-sh-17-dplayercdn.oss.dogecdn.com/1678963.json',
    danmakuApi: '弹幕接口',
    danmakuApiPlaceholder: '例如：https://api.example.com/',
    danmakuId: '弹幕 ID',
    danmakuIdPlaceholder: '用于区分弹幕库，例如 video-001',
    subtitleUrl: '字幕地址',
    subtitleUrlPlaceholder: '例如：https://example.com/subtitle.vtt',
    subtitleType: '字幕类型',
    subtitleName: '字幕名称',
    subtitleNamePlaceholder: '例如：中文字幕',
    play: '播放',
    clear: '清空',
    empty: '请输入一个视频地址。',
    invalid: '请输入以 http:// 或 https:// 开头的完整地址。',
    loadFailed: '播放器加载失败，请检查网络或稍后再试。',
    playFailed: '视频无法播放，请检查地址、跨域限制、防盗链或视频编码。',
    tip: '基于 DPlayer + hls.js。m3u8 会使用 HLS 模式，mp4/webm 等会使用普通视频模式。',
    waiting: '等待输入视频地址',
    loading: '正在加载播放器...',
    ready: '播放器已就绪',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Video Player',
    title: 'Video Player',
    description: 'Paste a public m3u8, mp4, webm, or similar URL and play it directly with DPlayer.',
    placeholder: 'Paste a video URL, e.g. https://example.com/video.m3u8',
    advanced: 'Danmaku & subtitles',
    danmakuAddition: 'Danmaku JSON URL',
    danmakuAdditionPlaceholder: 'e.g. https://s-sh-17-dplayercdn.oss.dogecdn.com/1678963.json',
    danmakuApi: 'Danmaku API',
    danmakuApiPlaceholder: 'e.g. https://api.example.com/',
    danmakuId: 'Danmaku ID',
    danmakuIdPlaceholder: 'A unique danmaku id, e.g. video-001',
    subtitleUrl: 'Subtitle URL',
    subtitleUrlPlaceholder: 'e.g. https://example.com/subtitle.vtt',
    subtitleType: 'Subtitle type',
    subtitleName: 'Subtitle name',
    subtitleNamePlaceholder: 'e.g. English',
    play: 'Play',
    clear: 'Clear',
    empty: 'Please enter a video URL.',
    invalid: 'Please enter a full URL starting with http:// or https://.',
    loadFailed: 'Player loading failed. Check your network or try again later.',
    playFailed: 'Video cannot be played. Check the URL, CORS, hotlink protection, or codec.',
    tip: 'Powered by DPlayer + hls.js. m3u8 uses HLS mode; mp4/webm use normal video mode.',
    waiting: 'Waiting for a video URL',
    loading: 'Loading player...',
    ready: 'Player ready',
  },
};

const text = computed(() => copy[props.language] ?? copy.zh);
const sourceType = computed(() => (/\.m3u8(?:[?#].*)?$/i.test(activeUrl.value) ? 'HLS / M3U8' : 'Direct URL'));

// 统一清理用户复制地址时常见的前后空白。
function normalizeUrl(value) {
  return value.trim();
}

// 主视频地址必须是完整 http/https URL，否则 DPlayer 无法稳定加载。
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

// 高级设置里的可选地址为空或非法时忽略，不阻断主视频播放。
function getOptionalUrl(value) {
  const normalized = normalizeUrl(value);
  return /^https?:\/\//i.test(normalized) ? normalized : '';
}

// DPlayer 的弹幕读取器需要对象数组，这里兼容官方 JSON 数组格式和对象格式。
function normalizeDanmakuData(data) {
  const list = Array.isArray(data) ? data : data?.data;

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((item) => {
      if (Array.isArray(item)) {
        return {
          time: item[0],
          type: item[1],
          color: item[2],
          author: item[3],
          text: item[4],
        };
      }

      return item;
    })
    .filter((item) => item && item.text !== undefined && item.time !== undefined);
}

// 组装 DPlayer 初始化参数，按用户填写情况动态加入弹幕和字幕配置。
function getPlayerOptions(url, isHls) {
  const options = {
    container: playerContainer.value,
    autoplay: true,
    screenshot: false,
    hotkey: true,
    mutex: true,
    preload: 'auto',
    video: {
      url,
      type: isHls ? 'hls' : 'auto',
    },
    apiBackend: {
      // 自定义读取器用于支持“静态弹幕 JSON 地址”，格式转换与 DPlayer 官方 api.js 保持一致。
      read({ url: endpoint, success, error: fail }) {
        if (endpoint.startsWith('garens://danmaku-empty/')) {
          success([]);
          return;
        }

        fetch(endpoint)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            return response.json();
          })
          .then((data) => {
            success(normalizeDanmakuData(data));
          })
          .catch((reason) => {
            fail(reason?.message);
          });
      },
      // 当前工具只播放和加载弹幕，不提供发弹幕后端；发送动作直接吞掉。
      send({ success }) {
        success?.();
      },
    },
  };

  const api = getOptionalUrl(danmakuApi.value);
  const id = normalizeUrl(danmakuId.value);
  const addition = getOptionalUrl(danmakuAddition.value);
  const subtitle = getOptionalUrl(subtitleUrl.value);

  if ((api && id) || addition) {
    options.danmaku = {
      id: id || 'garens-local-danmaku',
      user: 'garens-site',
      api: api || 'garens://danmaku-empty/',
      addition: addition ? [addition] : [],
      bottom: '15%',
      maximum: 3000,
      unlimited: false,
    };
  }

  if (subtitle) {
    options.subtitle = {
      url: subtitle,
      type: subtitleType.value,
      fontSize: '20px',
      bottom: '10%',
      color: '#ffffff',
    };

    const name = normalizeUrl(subtitleName.value);
    if (name) {
      options.subtitle.name = name;
    }
  }

  return options;
}

// DPlayer CSS 运行时加载，避免在项目里额外安装依赖。
function ensureStyle(url) {
  if (document.querySelector(`link[href="${url}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

// CDN 脚本按需加载并缓存 Promise，多个播放请求不会重复插入 script。
function loadScript(url, globalName, cacheGetter, cacheSetter) {
  if (window[globalName]) {
    return Promise.resolve(window[globalName]);
  }

  const cached = cacheGetter();
  if (cached) {
    return cached;
  }

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve(window[globalName]);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  cacheSetter(promise);
  return promise;
}

// 加载 DPlayer 主脚本和样式。
function loadDPlayer() {
  ensureStyle(dplayerStyleUrl);
  return loadScript(
    dplayerScriptUrl,
    'DPlayer',
    () => dplayerScriptPromise,
    (promise) => {
      dplayerScriptPromise = promise;
    },
  );
}

// m3u8 需要 hls.js，普通 mp4/webm 不加载它。
function loadHls() {
  return loadScript(
    hlsScriptUrl,
    'Hls',
    () => hlsScriptPromise,
    (promise) => {
      hlsScriptPromise = promise;
    },
  );
}

// 切换视频或离开页面时销毁旧实例，释放事件和媒体资源。
function destroyPlayer() {
  if (dplayerInstance) {
    dplayerInstance.destroy();
    dplayerInstance = null;
  }

  if (playerContainer.value) {
    playerContainer.value.innerHTML = '';
  }
}

// 用户点击播放后尽快启动；若浏览器拦截，保留 DPlayer 控件供手动播放。
function startPlayback() {
  if (!dplayerInstance) {
    return;
  }

  try {
    dplayerInstance.play();
  } catch {
    // 保持播放器可见，用户仍然可以通过 DPlayer 控件手动播放。
  }
}

// 创建播放器前先确保容器已渲染，再按视频类型加载所需脚本。
async function createPlayer(url) {
  await nextTick();

  if (!playerContainer.value) {
    return;
  }

  destroyPlayer();
  error.value = '';
  playerStatus.value = text.value.loading;

  const isHls = /\.m3u8(?:[?#].*)?$/i.test(url);

  try {
    if (isHls) {
      await loadHls();
    }

    const DPlayer = await loadDPlayer();

    dplayerInstance = new DPlayer(getPlayerOptions(url, isHls));

    dplayerInstance.on('loadedmetadata', () => {
      playerStatus.value = text.value.ready;
      startPlayback();
    });

    dplayerInstance.on('canplay', () => {
      startPlayback();
    });

    dplayerInstance.on('play', () => {
      error.value = '';
      playerStatus.value = '';
    });

    dplayerInstance.on('error', () => {
      error.value = text.value.playFailed;
      playerStatus.value = '';
    });

    requestAnimationFrame(() => {
      startPlayback();
    });
  } catch {
    error.value = text.value.loadFailed;
    playerStatus.value = '';
  }
}

// 表单提交入口：校验 URL、记录当前地址、初始化播放器。
async function play() {
  const value = getValidVideoUrl();

  if (!value) {
    return;
  }

  isLoading.value = true;
  activeUrl.value = value;
  try {
    await createPlayer(value);
  } finally {
    isLoading.value = false;
  }
}

// 清空播放器和所有当前状态，但保留高级配置，方便继续播放其他地址。
function clearUrl() {
  destroyPlayer();
  videoUrl.value = '';
  activeUrl.value = '';
  error.value = '';
  playerStatus.value = '';
}

onMounted(() => {
  // 恢复主视频地址和弹幕/字幕等高级设置。
  videoUrl.value = localStorage.getItem(storageKey) ?? '';
  const savedOptions = localStorage.getItem(optionsStorageKey);

  if (savedOptions) {
    try {
      const options = JSON.parse(savedOptions);
      danmakuApi.value = options.danmakuApi ?? '';
      danmakuId.value = options.danmakuId ?? '';
      danmakuAddition.value = options.danmakuAddition ?? '';
      subtitleUrl.value = options.subtitleUrl ?? '';
      subtitleType.value = options.subtitleType ?? 'webvtt';
      subtitleName.value = options.subtitleName ?? '';
      advancedOpen.value = Boolean(
        danmakuApi.value ||
          danmakuId.value ||
          danmakuAddition.value ||
          subtitleUrl.value ||
          subtitleName.value,
      );
    } catch {
      localStorage.removeItem(optionsStorageKey);
    }
  }
});

onBeforeUnmount(() => {
  // 页面切换时销毁播放器，避免音频继续播放或事件残留。
  destroyPlayer();
});

watch(videoUrl, (value) => {
  // 主视频地址实时保存。
  localStorage.setItem(storageKey, value);
});

watch([danmakuApi, danmakuId, danmakuAddition, subtitleUrl, subtitleType, subtitleName], () => {
  // 高级设置单独保存，和主视频地址互不影响。
  localStorage.setItem(
    optionsStorageKey,
    JSON.stringify({
      danmakuApi: danmakuApi.value,
      danmakuId: danmakuId.value,
      danmakuAddition: danmakuAddition.value,
      subtitleUrl: subtitleUrl.value,
      subtitleType: subtitleType.value,
      subtitleName: subtitleName.value,
    }),
  );
});
</script>

<template>
  <section class="video-player-page" aria-labelledby="video-player-title">
    <button class="tool-back" type="button" @click="$emit('back')">
      {{ text.back }}
    </button>

    <div class="video-player-hero">
      <p class="eyebrow">{{ text.eyebrow }}</p>
      <h1 id="video-player-title">{{ text.title }}</h1>
      <p>{{ text.description }}</p>
    </div>

    <form class="video-player-form" @submit.prevent="play">
      <input v-model="videoUrl" type="url" :placeholder="text.placeholder" />
      <button class="video-player-primary" type="submit" :disabled="isLoading">
        {{ text.play }}
      </button>
      <button type="button" @click="clearUrl">{{ text.clear }}</button>
    </form>

    <section class="video-player-options">
      <button class="video-player-options-toggle" type="button" @click="advancedOpen = !advancedOpen">
        {{ text.advanced }}
      </button>
      <div v-if="advancedOpen" class="video-player-options-grid">
        <label>
          <span>{{ text.danmakuAddition }}</span>
          <input v-model="danmakuAddition" type="url" :placeholder="text.danmakuAdditionPlaceholder" />
        </label>
        <label>
          <span>{{ text.danmakuApi }}</span>
          <input v-model="danmakuApi" type="url" :placeholder="text.danmakuApiPlaceholder" />
        </label>
        <label>
          <span>{{ text.danmakuId }}</span>
          <input v-model="danmakuId" type="text" :placeholder="text.danmakuIdPlaceholder" />
        </label>
        <label>
          <span>{{ text.subtitleUrl }}</span>
          <input v-model="subtitleUrl" type="url" :placeholder="text.subtitleUrlPlaceholder" />
        </label>
        <label>
          <span>{{ text.subtitleType }}</span>
          <select v-model="subtitleType">
            <option value="webvtt">WebVTT</option>
            <option value="ass">ASS</option>
          </select>
        </label>
        <label>
          <span>{{ text.subtitleName }}</span>
          <input v-model="subtitleName" type="text" :placeholder="text.subtitleNamePlaceholder" />
        </label>
      </div>
    </section>

    <p v-if="error" class="video-player-error">{{ error }}</p>
    <p v-else-if="playerStatus" class="video-player-state">{{ playerStatus }}</p>
    <p class="video-player-note">{{ text.tip }}</p>

    <section class="video-player-shell">
      <div v-show="activeUrl" ref="playerContainer" class="video-player-dplayer"></div>
      <div v-if="!activeUrl" class="video-player-placeholder">
        {{ text.waiting }}
      </div>

      <div v-if="activeUrl" class="video-player-meta">
        <span>{{ sourceType }}</span>
        <strong>{{ activeUrl }}</strong>
      </div>
    </section>
  </section>
</template>
