<script setup>
const props = defineProps({
  tool: {
    type: Object,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
});

defineEmits(['open-tool']);

const labels = {
  zh: {
    cover: '封面图',
    open: '打开',
  },
  en: {
    cover: 'cover image',
    open: 'Open tool',
  },
};

// 工具配置里的文案可能是纯字符串，也可能是 { zh, en }。
function t(value) {
  if (typeof value === 'string') return value;
  return value?.[props.language] ?? value?.zh ?? '';
}
</script>

<template>
  <article
    class="tool-card"
    :id="tool.id"
    :style="{ '--tool-accent': tool.accent }"
    role="button"
    tabindex="0"
    @click="$emit('open-tool', tool.id)"
    @keydown.enter.prevent="$emit('open-tool', tool.id)"
    @keydown.space.prevent="$emit('open-tool', tool.id)"
  >
    <div class="tool-media">
      <img :src="tool.cover" :alt="`${t(tool.title)} ${labels[language].cover}`" loading="lazy" />
    </div>
    <div class="tool-content">
      <div class="tool-meta">
        <span class="tool-dot" aria-hidden="true"></span>
        <span>{{ t(tool.status) }}</span>
      </div>
      <h3>{{ t(tool.title) }}</h3>
      <p>{{ t(tool.summary) }}</p>
      <span class="tool-link">
        {{ labels[language].open }}
      </span>
    </div>
  </article>
</template>
