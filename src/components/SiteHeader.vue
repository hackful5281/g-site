<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  theme: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['toggle-menu', 'close-menu', 'update:theme', 'update:language']);
const themeMenuOpen = ref(false);
const languageMenuOpen = ref(false);

// 头部无配置的辅助文案在组件内按语言生成。
const labels = computed(() => ({
  mainMenu: props.language === 'zh' ? '主菜单' : 'Main menu',
  mobileMenu: props.language === 'zh' ? '移动端菜单' : 'Mobile menu',
  themeMenu: props.language === 'zh' ? '主题选择' : 'Theme picker',
  languageMenu: props.language === 'zh' ? '语言选择' : 'Language picker',
  closeMenu: props.language === 'zh' ? '关闭菜单' : 'Close menu',
  openMenu: props.language === 'zh' ? '打开菜单' : 'Open menu',
}));

// 主题和语言是内置交互，需要从普通外链动作里单独拆出来。
const themeAction = computed(() => props.config.actions.find((action) => action.id === 'theme'));
const languageAction = computed(() => props.config.actions.find((action) => action.id === 'language'));
// 除主题和语言外的动作统一走外链按钮，例如 GitHub。
const otherActions = computed(() => props.config.actions.filter((action) => !['theme', 'language'].includes(action.id)));

// 兼容字符串和中英文对象两种配置写法，减少模板里的判断。
function t(value) {
  if (typeof value === 'string') return value;
  return value?.[props.language] ?? value?.zh ?? '';
}

// 向父组件同步主题，并关闭下拉菜单。
function selectTheme(themeId) {
  emit('update:theme', themeId);
  themeMenuOpen.value = false;
}

// 向父组件同步语言，并关闭下拉菜单。
function selectLanguage(languageId) {
  emit('update:language', languageId);
  languageMenuOpen.value = false;
}
</script>

<template>
  <header class="site-header">
    <a class="brand" href="#home" @click="$emit('close-menu')">
      <!-- 品牌头像使用 public 下的本地资源，后续换图只需要替换 garen.png。 -->
      <img class="brand-mark" src="/garen.png" alt="" aria-hidden="true" />
      <span>{{ config.name }}</span>
    </a>

    <nav class="desktop-menu" :aria-label="labels.mainMenu">
      <a v-for="menu in config.menus" :key="menu.href" :href="menu.href">
        {{ t(menu.label) }}
      </a>
    </nav>

    <div class="header-actions">
      <div class="theme-picker">
        <button
          class="icon-button icon-palette"
          type="button"
          :aria-expanded="themeMenuOpen"
          aria-controls="theme-menu"
          :aria-label="t(themeAction?.label)"
          :title="t(themeAction?.label)"
          @click="themeMenuOpen = !themeMenuOpen"
        >
          <span aria-hidden="true"></span>
        </button>

        <div
          id="theme-menu"
          class="theme-menu"
          :class="{ 'is-open': themeMenuOpen }"
          :aria-label="labels.themeMenu"
        >
          <button
            v-for="item in config.themes"
            :key="item.id"
            class="theme-option"
            :class="{ 'is-active': item.id === theme }"
            type="button"
            @click="selectTheme(item.id)"
          >
            <span class="theme-swatches" aria-hidden="true">
              <span
                v-for="swatch in item.swatches"
                :key="swatch"
                :style="{ background: swatch }"
              ></span>
            </span>
            <span class="theme-copy">
              <strong>{{ t(item.name) }}</strong>
              <small>{{ t(item.description) }}</small>
            </span>
          </button>
        </div>
      </div>

      <div class="language-picker">
        <button
          class="icon-button icon-language"
          type="button"
          :aria-expanded="languageMenuOpen"
          aria-controls="language-menu"
          :aria-label="t(languageAction?.label)"
          :title="t(languageAction?.label)"
          @click="languageMenuOpen = !languageMenuOpen"
        >
          <span aria-hidden="true"></span>
        </button>

        <div
          id="language-menu"
          class="language-menu"
          :class="{ 'is-open': languageMenuOpen }"
          :aria-label="labels.languageMenu"
        >
          <button
            v-for="item in config.languages"
            :key="item.id"
            class="language-option"
            :class="{ 'is-active': item.id === language }"
            type="button"
            @click="selectLanguage(item.id)"
          >
            <span>{{ item.shortLabel }}</span>
            <strong>{{ item.label }}</strong>
          </button>
        </div>
      </div>

      <a
        v-for="action in otherActions"
        :key="action.id"
        class="icon-button"
        :class="`icon-${action.icon}`"
        :href="action.href"
        target="_blank"
        rel="noreferrer"
        :aria-label="t(action.label)"
        :title="t(action.label)"
      >
        <span aria-hidden="true"></span>
      </a>

      <button
        class="menu-button"
        type="button"
        :aria-expanded="isOpen"
        aria-controls="mobile-menu"
        :aria-label="isOpen ? labels.closeMenu : labels.openMenu"
        @click="$emit('toggle-menu')"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <nav
      id="mobile-menu"
      class="mobile-menu"
      :class="{ 'is-open': isOpen }"
      :aria-label="labels.mobileMenu"
    >
      <a
        v-for="menu in config.menus"
        :key="menu.href"
        :href="menu.href"
        @click="$emit('close-menu')"
      >
        {{ t(menu.label) }}
      </a>
    </nav>
  </header>
</template>
