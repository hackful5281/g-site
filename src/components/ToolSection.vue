<script setup>
import { computed } from 'vue';
import ToolCard from './ToolCard.vue';

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
});

defineEmits(['open-tool']);

// 根据当前语言展示工具数量单位，英文需要区分单复数。
const unitLabel = computed(() => {
  if (props.language === 'zh') return '个工具';
  return props.group.items.length === 1 ? 'tool' : 'tools';
});
</script>

<template>
  <section class="tool-section" :aria-labelledby="`group-${group.id}`">
    <div class="section-heading">
      <h2 :id="`group-${group.id}`">{{ group.name }}</h2>
      <span>{{ group.items.length }} {{ unitLabel }}</span>
    </div>
    <div class="tool-grid">
      <ToolCard
        v-for="tool in group.items"
        :key="tool.id"
        :tool="tool"
        :language="language"
        @open-tool="$emit('open-tool', $event)"
      />
    </div>
  </section>
</template>
