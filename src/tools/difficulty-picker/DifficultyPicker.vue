<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  language: {
    type: String,
    required: true,
  },
});

defineEmits(['back']);

const storageKey = 'garens-site-difficulty-picker-options';
const spinTimer = ref(null);
const inputValue = ref('');
const selectedIndex = ref(0);
const isPicking = ref(false);
const result = ref('');
const customOptions = ref([]);
const removedDefaultIds = ref([]);
const notice = ref('');

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: '选择困难症',
    idleResult: '点一下，让它决定',
    description: '默认准备了一些常见选择，也可以添加你自己的选项。自定义内容会保存在本地浏览器。',
    inputPlaceholder: '添加选项，比如：螺蛳粉',
    add: '添加',
    pick: '随机一下',
    picking: '转动中...',
    reset: '恢复默认',
    clearAll: '清空所有选项',
    options: '候选列表',
    defaultTag: '默认',
    customTag: '自定义',
    resultPrefix: '选择: ',
    emptyHint: '候选列表空了，先添加一个选项吧。',
    duplicateHint: '这个选项已经在列表里了。',
    defaultOptions: [
      '火锅',
      '烤肉',
      '日料',
      '汉堡',
      '沙拉',
      '面条',
      '麻辣烫',
      '米饭套餐',
      '饺子',
      '披萨',
      '小龙虾',
      '粥',
    ],
  },
  en: {
    back: 'Back home',
    eyebrow: 'Decision Picker',
    idleResult: 'Tap once and let it decide',
    description: 'Start with common defaults or add your own options. Custom items are saved locally.',
    inputPlaceholder: 'Add an option, e.g. tacos',
    add: 'Add',
    pick: 'Shuffle',
    picking: 'Rolling...',
    reset: 'Restore defaults',
    clearAll: 'Clear all',
    options: 'Option list',
    defaultTag: 'Default',
    customTag: 'Custom',
    resultPrefix: 'Choose: ',
    emptyHint: 'The list is empty. Add an option first.',
    duplicateHint: 'That option is already in the list.',
    defaultOptions: [
      'Hotpot',
      'BBQ',
      'Sushi',
      'Burger',
      'Salad',
      'Noodles',
      'Spicy Bowl',
      'Rice Set',
      'Dumplings',
      'Pizza',
      'Crawfish',
      'Congee',
    ],
  },
};

const defaultIds = [
  'hotpot',
  'bbq',
  'sushi',
  'burger',
  'salad',
  'noodles',
  'spicy-bowl',
  'rice-set',
  'dumplings',
  'pizza',
  'crawfish',
  'congee',
];

// 页面文案和默认选项按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);
// 默认选项带稳定 id，用户删除默认项时可以只记录 id。
const defaultOptions = computed(() =>
  text.value.defaultOptions.map((label, index) => ({
    id: defaultIds[index],
    label,
    type: 'default',
  })).filter((item) => !removedDefaultIds.value.includes(item.id)),
);
// 当前候选池由“未隐藏的默认项 + 自定义项”合并而成。
const options = computed(() => [...defaultOptions.value, ...customOptions.value]);
const selectedOption = computed(() => options.value[selectedIndex.value] ?? options.value[0]);
// 展示文案优先使用最终结果，否则显示当前滚动项或空状态提示。
const resultText = computed(() => {
  if (result.value) return props.language === 'zh' ? `${text.value.resultPrefix}${result.value}` : `${text.value.resultPrefix} ${result.value}`;
  return selectedOption.value?.label ?? text.value.idleResult;
});

// 统一整理用户输入，避免空格差异导致重复项判断失效。
function normalizeOption(value) {
  return value.trim().replace(/\s+/g, ' ');
}

// 自定义选项和被删除的默认选项都保存在本地，刷新后保持用户配置。
function saveCustomOptions() {
  localStorage.setItem(storageKey, JSON.stringify({
    customOptions: customOptions.value,
    removedDefaultIds: removedDefaultIds.value,
  }));
}

// 兼容早期只保存 customOptions 数组的旧数据格式。
function loadCustomOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (Array.isArray(saved)) {
      customOptions.value = saved.filter((item) => item?.id && item?.label && item?.type === 'custom');
      removedDefaultIds.value = [];
      return;
    }

    customOptions.value = Array.isArray(saved?.customOptions)
      ? saved.customOptions.filter((item) => item?.id && item?.label && item?.type === 'custom')
      : [];
    removedDefaultIds.value = Array.isArray(saved?.removedDefaultIds)
      ? saved.removedDefaultIds.filter((id) => defaultIds.includes(id))
      : [];
  } catch {
    customOptions.value = [];
    removedDefaultIds.value = [];
  }
}

// 添加用户自定义候选项，并阻止与当前候选列表重复。
function addOption() {
  const label = normalizeOption(inputValue.value);
  notice.value = '';
  if (!label) return;

  const exists = options.value.some((item) => item.label.toLowerCase() === label.toLowerCase());
  if (exists) {
    notice.value = text.value.duplicateHint;
    return;
  }

  customOptions.value.push({
    id: `custom-${Date.now()}`,
    label,
    type: 'custom',
  });
  inputValue.value = '';
}

// 默认项不能真正删除，所以记录到 removedDefaultIds；自定义项则直接移除。
function removeOption(option) {
  if (option.type === 'custom') {
    customOptions.value = customOptions.value.filter((item) => item.id !== option.id);
  } else if (!removedDefaultIds.value.includes(option.id)) {
    removedDefaultIds.value = [...removedDefaultIds.value, option.id];
  }

  selectedIndex.value = Math.min(selectedIndex.value, Math.max(0, options.value.length - 2));
  if (result.value === option.label) result.value = '';
}

// 清空所有候选项：自定义项清空，默认项全部加入隐藏列表。
function clearAll() {
  customOptions.value = [];
  removedDefaultIds.value = [...defaultIds];
  result.value = '';
  notice.value = '';
  selectedIndex.value = 0;
}

// 只恢复默认项，不影响用户已经添加的自定义候选项。
function resetPicker() {
  removedDefaultIds.value = [];
  result.value = '';
  notice.value = '';
  selectedIndex.value = 0;
}

// 用短间隔随机切换候选项，制造“转动”反馈，结束后落到最终结果。
function pickOption() {
  if (isPicking.value) return;
  if (options.value.length === 0) {
    notice.value = text.value.emptyHint;
    return;
  }

  notice.value = '';
  result.value = '';
  isPicking.value = true;

  let ticks = 0;
  const totalTicks = 26 + Math.floor(Math.random() * 14);
  spinTimer.value = window.setInterval(() => {
    selectedIndex.value = Math.floor(Math.random() * options.value.length);
    ticks += 1;

    if (ticks >= totalTicks) {
      window.clearInterval(spinTimer.value);
      spinTimer.value = null;
      const finalIndex = Math.floor(Math.random() * options.value.length);
      selectedIndex.value = finalIndex;
      result.value = options.value[finalIndex].label;
      isPicking.value = false;
    }
  }, 64);
}

// 进入页面恢复本地选项，之后候选项变化会自动保存。
onMounted(loadCustomOptions);

onUnmounted(() => {
  // 页面离开时停止随机滚动计时器。
  if (spinTimer.value) window.clearInterval(spinTimer.value);
});

watch([customOptions, removedDefaultIds], saveCustomOptions, { deep: true });
watch(
  () => props.language,
  () => {
    // 切换语言后清掉当前结果，避免中英文默认候选混在一起显示。
    result.value = '';
    notice.value = '';
    selectedIndex.value = 0;
  },
);
</script>

<template>
  <section class="eat-page" aria-labelledby="difficulty-picker-title">
    <button class="tool-back" type="button" @click="$emit('back')">
      {{ text.back }}
    </button>

    <div class="eat-hero">
      <p class="eyebrow">{{ text.eyebrow }}</p>
      <button
        id="difficulty-picker-title"
        class="eat-result"
        :class="{ 'is-spinning': isPicking, 'has-result': result }"
        type="button"
        @click="pickOption"
      >
        {{ resultText }}
      </button>
      <p>{{ text.description }}</p>
    </div>

    <div class="eat-actions">
      <button class="eat-primary" type="button" :disabled="isPicking" @click="pickOption">
        {{ isPicking ? text.picking : text.pick }}
      </button>
      <button type="button" @click="resetPicker">{{ text.reset }}</button>
      <button type="button" :disabled="options.length === 0" @click="clearAll">
        {{ text.clearAll }}
      </button>
    </div>

    <form class="eat-form" @submit.prevent="addOption">
      <input v-model="inputValue" type="text" :placeholder="text.inputPlaceholder" />
      <button type="submit">{{ text.add }}</button>
    </form>
    <p v-if="notice" class="picker-notice">{{ notice }}</p>

    <section class="eat-options" :aria-label="text.options">
      <div class="eat-options-head">
        <h2>{{ text.options }}</h2>
        <span>{{ options.length }}</span>
      </div>

      <div class="eat-word-cloud">
        <div
          v-for="(option, index) in options"
          :key="option.id"
          class="eat-word"
          :class="{ 'is-selected': index === selectedIndex, 'is-custom': option.type === 'custom' }"
        >
          <button type="button" @click="selectedIndex = index">
            <span>{{ option.label }}</span>
            <small>{{ option.type === 'default' ? text.defaultTag : text.customTag }}</small>
          </button>
          <button
            class="eat-remove"
            type="button"
            aria-label="Remove option"
            @click="removeOption(option)"
          >
            ×
          </button>
        </div>
      </div>
    </section>
  </section>
</template>
