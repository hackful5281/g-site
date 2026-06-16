<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  language: {
    type: String,
    required: true,
  },
});

defineEmits(['back']);

const storageKey = 'garens-site-daily-note';
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const draft = ref('');
const notesByDate = ref({});
const dateInput = ref(null);

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Daily Note',
    title: '每日便签',
    description: '把今天要处理的事情写下来。完成、编辑、删除都会自动保存到本地浏览器。',
    today: '今天',
    placeholder: '写下一件想完成的事',
    add: '添加',
    progress: '完成进度',
    empty: '今天还没有便签，先写下一件小事。',
    done: '已完成',
    todo: '待处理',
    edit: '编辑',
    save: '保存',
    cancel: '取消',
    remove: '删除',
    clearDone: '清除已完成',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Daily Note',
    title: 'Daily Note',
    description: 'Write down what needs your attention today. Completion, edits, and deletes are saved locally.',
    today: 'Today',
    placeholder: 'Write one thing to finish',
    add: 'Add',
    progress: 'Progress',
    empty: 'No notes yet. Add one small thing first.',
    done: 'Done',
    todo: 'To do',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    remove: 'Delete',
    clearDone: 'Clear done',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);
// 只取当前日期的便签列表，模板不直接访问完整存储对象。
const notes = computed(() => notesByDate.value[selectedDate.value] ?? []);
// 完成数量和进度条都从当前日期列表派生，避免重复维护状态。
const doneCount = computed(() => notes.value.filter((item) => item.done).length);
const progress = computed(() => (notes.value.length ? Math.round((doneCount.value / notes.value.length) * 100) : 0));
const todayValue = computed(() => new Date().toISOString().slice(0, 10));

// 所有日期的便签统一存在一个对象里，键名为 YYYY-MM-DD。
function saveNotes() {
  localStorage.setItem(storageKey, JSON.stringify(notesByDate.value));
}

// 读取本地便签时做基础结构校验，避免异常数据影响页面。
function loadNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    notesByDate.value = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch {
    notesByDate.value = {};
  }
}

// 只替换当前日期下的便签列表，其他日期保持不变。
function setNotes(nextNotes) {
  notesByDate.value = {
    ...notesByDate.value,
    [selectedDate.value]: nextNotes,
  };
}

// 点击整个日期框即可打开日期选择器，兼容不支持 showPicker 的浏览器。
function openDatePicker() {
  const input = dateInput.value;
  if (!input) return;

  if (typeof input.showPicker === 'function') {
    input.showPicker();
  } else {
    input.focus();
  }
}

// 新便签插入到列表顶部，便于看到刚添加的内容。
function addNote() {
  const value = draft.value.trim().replace(/\s+/g, ' ');
  if (!value) return;

  setNotes([
    {
      id: `note-${Date.now()}`,
      text: value,
      done: false,
      editing: false,
      draft: value,
    },
    ...notes.value,
  ]);
  draft.value = '';
}

// 完成状态采用不可变更新，确保 Vue 能稳定追踪变更。
function toggleNote(note) {
  setNotes(notes.value.map((item) => (item.id === note.id ? { ...item, done: !item.done } : item)));
}

// 进入编辑时把当前文本复制到 draft，取消时可以无损回退。
function startEdit(note) {
  setNotes(notes.value.map((item) => (item.id === note.id ? { ...item, editing: true, draft: item.text } : item)));
}

function cancelEdit(note) {
  setNotes(notes.value.map((item) => (item.id === note.id ? { ...item, editing: false, draft: item.text } : item)));
}

// 编辑输入没有直接改 text，只有保存后才提交。
function updateDraft(note, value) {
  setNotes(notes.value.map((item) => (item.id === note.id ? { ...item, draft: value } : item)));
}

function saveEdit(note) {
  const value = note.draft.trim().replace(/\s+/g, ' ');
  if (!value) return;
  setNotes(notes.value.map((item) => (item.id === note.id ? { ...item, text: value, draft: value, editing: false } : item)));
}

// 删除当前日期下的单条便签。
function removeNote(note) {
  setNotes(notes.value.filter((item) => item.id !== note.id));
}

// 仅清理当前日期下已完成的便签。
function clearDone() {
  setNotes(notes.value.filter((item) => !item.done));
}

function goToday() {
  selectedDate.value = todayValue.value;
}

// 组件加载时恢复本地数据，之后由 watch 自动持久化。
onMounted(loadNotes);
watch(notesByDate, saveNotes, { deep: true });
</script>

<template>
  <section class="note-page" aria-labelledby="daily-note-title">
    <button class="tool-back" type="button" @click="$emit('back')">
      {{ text.back }}
    </button>

    <div class="note-hero">
      <div>
        <p class="eyebrow">{{ text.eyebrow }}</p>
        <h1 id="daily-note-title">{{ text.title }}</h1>
        <p>{{ text.description }}</p>
      </div>

      <div class="note-date-panel">
        <label class="note-date-field" @click.prevent="openDatePicker">
          <span>{{ text.today }}</span>
          <input ref="dateInput" v-model="selectedDate" type="date" />
        </label>
        <button type="button" @click="goToday">{{ text.today }}</button>
      </div>
    </div>

    <div class="note-progress">
      <div>
        <span>{{ text.progress }}</span>
        <strong>{{ doneCount }} / {{ notes.length }}</strong>
      </div>
      <div class="note-progress-track">
        <span :style="{ width: `${progress}%` }"></span>
      </div>
    </div>

    <form class="note-form" @submit.prevent="addNote">
      <input v-model="draft" type="text" :placeholder="text.placeholder" />
      <button type="submit">{{ text.add }}</button>
    </form>

    <div class="note-toolbar">
      <span>{{ selectedDate }}</span>
      <button type="button" :disabled="doneCount === 0" @click="clearDone">
        {{ text.clearDone }}
      </button>
    </div>

    <div class="note-list">
      <p v-if="notes.length === 0" class="note-empty">{{ text.empty }}</p>

      <article
        v-for="note in notes"
        :key="note.id"
        class="note-item"
        :class="{ 'is-done': note.done }"
      >
        <button class="note-check" type="button" @click="toggleNote(note)">
          <span></span>
        </button>

        <div class="note-body">
          <template v-if="note.editing">
            <input
              :value="note.draft"
              type="text"
              @input="updateDraft(note, $event.target.value)"
              @keydown.enter.prevent="saveEdit(note)"
              @keydown.esc.prevent="cancelEdit(note)"
            />
            <div class="note-actions">
              <button type="button" @click="saveEdit(note)">{{ text.save }}</button>
              <button type="button" @click="cancelEdit(note)">{{ text.cancel }}</button>
            </div>
          </template>

          <template v-else>
            <p>{{ note.text }}</p>
            <span>{{ note.done ? text.done : text.todo }}</span>
          </template>
        </div>

        <div v-if="!note.editing" class="note-actions">
          <button type="button" @click="startEdit(note)">{{ text.edit }}</button>
          <button type="button" @click="removeNote(note)">{{ text.remove }}</button>
        </div>
      </article>
    </div>
  </section>
</template>
