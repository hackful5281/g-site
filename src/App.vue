<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import SiteHeader from './components/SiteHeader.vue';
import ToolSection from './components/ToolSection.vue';
import { siteConfig } from './config/site.config';
import { createToolGroups } from './tools';
import DailyNote from './tools/daily-note/DailyNote.vue';
import DifficultyPicker from './tools/difficulty-picker/DifficultyPicker.vue';
import FireflyCard from './tools/firefly-card/FireflyCard.vue';
import VideoParser from './tools/video-parser/VideoParser.vue';
import VideoPlayer from './tools/video-player/VideoPlayer.vue';
import PasswordGenerator from './tools/password-generator/PasswordGenerator.vue';
import JsonFormatter from './tools/json-formatter/JsonFormatter.vue';
import TimestampConverter from './tools/timestamp-converter/TimestampConverter.vue';
import PomodoroTimer from './tools/pomodoro-timer/PomodoroTimer.vue';
import SpinWheel from './tools/spin-wheel/SpinWheel.vue';
import ColorTool from './tools/color-tool/ColorTool.vue';
import MarkdownPreview from './tools/markdown-preview/MarkdownPreview.vue';
import QrGenerator from './tools/qr-generator/QrGenerator.vue';
import ImageCompressor from './tools/image-compressor/ImageCompressor.vue';
import TextToolbox from './tools/text-toolbox/TextToolbox.vue';

const themeStorageKey = 'garens-site-theme';
const languageStorageKey = 'garens-site-language';
const defaultTheme = siteConfig.themes[0]?.id ?? 'morning';
const defaultLanguage = siteConfig.defaultLanguage ?? 'zh';

const menuOpen = ref(false);
const activeTheme = ref(defaultTheme);
const activeLanguage = ref(defaultLanguage);
const route = ref(window.location.hash || '#/');

// 页面公共文案从站点配置读取，语言缺失时回落到中文。
const pageCopy = computed(() => siteConfig.copy[activeLanguage.value] ?? siteConfig.copy.zh);
// 工具目录按当前语言生成，首页卡片无需自己处理翻译逻辑。
const toolGroups = computed(() => createToolGroups(activeLanguage.value));
const activeToolId = computed(() => {
  // 项目使用 hash 路由，避免引入路由库也能直接部署到静态站点。
  const match = route.value.match(/^#\/tools\/([^/?#]+)/);
  return match?.[1] ?? '';
});
// 只要 hash 命中工具路径，就切换到工具详情布局。
const isToolPage = computed(() => Boolean(activeToolId.value));

// 同步浏览器地址栏中的 hash，保证前进/后退按钮能正确切换页面。
function syncRoute() {
  route.value = window.location.hash || '#/';
}

// 打开工具详情页，并把页面滚动回顶部。
function openTool(toolId) {
  window.location.hash = `#/tools/${toolId}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 从工具页返回首页。
function goHome() {
  window.location.hash = '#/';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  // 启动时恢复用户上次选择的主题和语言，配置不存在时回落到默认值。
  const savedTheme = localStorage.getItem(themeStorageKey);
  const hasSavedTheme = siteConfig.themes.some((theme) => theme.id === savedTheme);
  activeTheme.value = hasSavedTheme ? savedTheme : defaultTheme;

  const savedLanguage = localStorage.getItem(languageStorageKey);
  const hasSavedLanguage = siteConfig.languages.some((language) => language.id === savedLanguage);
  activeLanguage.value = hasSavedLanguage ? savedLanguage : defaultLanguage;

  window.addEventListener('hashchange', syncRoute);
  syncRoute();
});

onUnmounted(() => {
  // 组件卸载时清理全局监听，避免热更新或重复挂载时残留监听器。
  window.removeEventListener('hashchange', syncRoute);
});

watch(activeTheme, (theme) => {
  // 用户切换主题后立即持久化，下次打开网站继续沿用。
  localStorage.setItem(themeStorageKey, theme);
});

watch(activeLanguage, (language) => {
  // 语言偏好同样保存到本地。
  localStorage.setItem(languageStorageKey, language);
});
</script>

<template>
  <div class="site-shell" :data-theme="activeTheme">
    <SiteHeader
      v-model:theme="activeTheme"
      v-model:language="activeLanguage"
      :config="siteConfig"
      :is-open="menuOpen"
      @toggle-menu="menuOpen = !menuOpen"
      @close-menu="menuOpen = false"
    />

    <main v-if="!isToolPage" id="home" class="main-layout">
      <section class="intro-panel" aria-labelledby="intro-title">
        <div class="intro-copy">
          <p class="eyebrow">{{ pageCopy.personalTools }}</p>
          <h1 id="intro-title">{{ siteConfig.name }}</h1>
          <p>{{ pageCopy.tagline }}</p>
        </div>
      </section>

      <section id="tools" class="tools-area" :aria-label="pageCopy.toolsDirectory">
        <ToolSection
          v-for="group in toolGroups"
          :key="group.id"
          :group="group"
          :language="activeLanguage"
          @open-tool="openTool"
        />
      </section>
    </main>

    <main v-else class="tool-page-layout">
      <DifficultyPicker
        v-if="activeToolId === 'difficulty-picker'"
        :language="activeLanguage"
        @back="goHome"
      />
      <DailyNote
        v-else-if="activeToolId === 'daily-note'"
        :language="activeLanguage"
        @back="goHome"
      />
      <FireflyCard
        v-else-if="activeToolId === 'firefly-card'"
        :language="activeLanguage"
        @back="goHome"
      />
      <VideoParser
        v-else-if="activeToolId === 'video-parser'"
        :language="activeLanguage"
        @back="goHome"
      />
      <VideoPlayer
        v-else-if="activeToolId === 'video-player'"
        :language="activeLanguage"
        @back="goHome"
      />
      <PasswordGenerator
        v-else-if="activeToolId === 'password-generator'"
        :language="activeLanguage"
        @back="goHome"
      />
      <JsonFormatter
        v-else-if="activeToolId === 'json-formatter'"
        :language="activeLanguage"
        @back="goHome"
      />
      <TimestampConverter
        v-else-if="activeToolId === 'timestamp-converter'"
        :language="activeLanguage"
        @back="goHome"
      />
      <PomodoroTimer
        v-else-if="activeToolId === 'pomodoro-timer'"
        :language="activeLanguage"
        @back="goHome"
      />
      <SpinWheel
        v-else-if="activeToolId === 'spin-wheel'"
        :language="activeLanguage"
        @back="goHome"
      />
      <ColorTool
        v-else-if="activeToolId === 'color-tool'"
        :language="activeLanguage"
        @back="goHome"
      />
      <MarkdownPreview
        v-else-if="activeToolId === 'markdown-preview'"
        :language="activeLanguage"
        @back="goHome"
      />
      <QrGenerator
        v-else-if="activeToolId === 'qr-generator'"
        :language="activeLanguage"
        @back="goHome"
      />
      <ImageCompressor
        v-else-if="activeToolId === 'image-compressor'"
        :language="activeLanguage"
        @back="goHome"
      />
      <TextToolbox
        v-else-if="activeToolId === 'text-toolbox'"
        :language="activeLanguage"
        @back="goHome"
      />
    </main>

    <footer class="site-footer">
      {{ pageCopy.copyright }}
    </footer>
  </div>
</template>
