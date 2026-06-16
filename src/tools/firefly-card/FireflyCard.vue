<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  language: {
    type: String,
    required: true,
  },
});

defineEmits(['back']);

const storageKey = 'garens-site-firefly-card';
const title = ref('hi 你好');
const content = ref('你可以在这里输入文字尝试一下，支持多行内容。\n- 复制粘贴可插入灵感\n- Ctrl+B 加粗文本\n- 二维码可修改隐藏');
const author = ref('是魔王哒');
const cardName = ref('');
const templateId = ref('default');
const backgroundId = ref('paper');
const ratio = ref('portrait');
const fontScale = ref(1);
const fontFamily = ref('system');
const customWidth = ref(440);
const customHeight = ref(0);
const cardPadding = ref(30);
const cardRadius = ref(18);
const blockGap = ref(16);
const textAlign = ref('left');
const showWatermark = ref(true);
const syncAllCards = ref(false);
const previewRef = ref(null);

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Firefly Card',
    title: '流光卡片',
    description: '选择模板、背景和比例，把一段文字排成适合分享的卡片。',
    cardNamePlaceholder: '添加卡片名称',
    titleLabel: '标题',
    contentLabel: '正文',
    authorLabel: '署名',
    templateLabel: '模板',
    backgroundLabel: '背景',
    propertyLabel: '属性',
    syncAllCards: '同步所有卡片',
    watermark: '水印',
    sizeLabel: '模板尺寸',
    widthLabel: 'W',
    heightLabel: 'H',
    containerLabel: '容器',
    paddingLabel: '内边距',
    radiusLabel: '圆角半径',
    gapLabel: '内容间距',
    textPanelLabel: '文本',
    alignLabel: '对齐方式',
    ratioLabel: '布局',
    fontLabel: '字号',
    fontFamilyLabel: '字体',
    download: '下载 PNG',
    preview: '流光卡片',
    scan: '扫描二维码',
    portrait: '竖版',
    square: '方形',
    wide: '横版',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Firefly Card',
    title: 'Firefly Card',
    description: 'Pick a template, background, and ratio to turn text into a shareable card.',
    cardNamePlaceholder: 'Add card name',
    titleLabel: 'Title',
    contentLabel: 'Body',
    authorLabel: 'Signature',
    templateLabel: 'Template',
    backgroundLabel: 'Background',
    propertyLabel: 'Properties',
    syncAllCards: 'Sync all cards',
    watermark: 'Watermark',
    sizeLabel: 'Template size',
    widthLabel: 'W',
    heightLabel: 'H',
    containerLabel: 'Container',
    paddingLabel: 'Padding',
    radiusLabel: 'Radius',
    gapLabel: 'Block gap',
    textPanelLabel: 'Text',
    alignLabel: 'Alignment',
    ratioLabel: 'Layout',
    fontLabel: 'Font size',
    fontFamilyLabel: 'Font family',
    download: 'Download PNG',
    preview: 'Firefly Card',
    scan: 'Scan QR code',
    portrait: 'Portrait',
    square: 'Square',
    wide: 'Wide',
  },
};

const templates = [
  { id: 'default', name: { zh: '默认', en: 'Default' }, icon: 'lines', vip: false },
  { id: 'transparent', name: { zh: '透明', en: 'Glass' }, icon: 'glass', vip: false },
  { id: 'quote', name: { zh: '金句', en: 'Quote' }, icon: 'quote', vip: false },
  { id: 'excerpt', name: { zh: '书摘', en: 'Excerpt' }, icon: 'dark-lines', vip: false },
  { id: 'memo', name: { zh: '备忘录', en: 'Memo' }, icon: 'memo', vip: false },
  { id: 'bento', name: { zh: '便当', en: 'Bento' }, icon: 'bento', vip: false },
  { id: 'black', name: { zh: '黑日', en: 'Black' }, icon: 'black', vip: false },
  { id: 'frame', name: { zh: '框界', en: 'Frame' }, icon: 'frame', vip: false },
  { id: 'simple', name: { zh: '简约', en: 'Simple' }, icon: 'simple', vip: true },
  { id: 'story', name: { zh: '故事', en: 'Story' }, icon: 'story', vip: true },
  { id: 'handwrite', name: { zh: '手写', en: 'Handwrite' }, icon: 'handwrite', vip: false },
  { id: 'code', name: { zh: '代码', en: 'Code' }, icon: 'code', vip: false },
  { id: 'image', name: { zh: '图片', en: 'Image' }, icon: 'image', vip: false },
];

const fontFamilies = [
  { id: 'system', name: { zh: '系统默认', en: 'System' }, css: 'Inter, "Microsoft YaHei", sans-serif', canvas: '"Microsoft YaHei", sans-serif' },
  { id: 'song', name: { zh: '宋体', en: 'Serif' }, css: 'SimSun, "Songti SC", serif', canvas: 'SimSun, serif' },
  { id: 'hei', name: { zh: '黑体', en: 'Sans' }, css: 'SimHei, "Microsoft YaHei", sans-serif', canvas: 'SimHei, sans-serif' },
  { id: 'kai', name: { zh: '楷体', en: 'Kai' }, css: 'KaiTi, STKaiti, serif', canvas: 'KaiTi, serif' },
  { id: 'mono', name: { zh: '等宽', en: 'Mono' }, css: 'Consolas, "Courier New", monospace', canvas: 'Consolas, monospace' },
];

const backgrounds = [
  {
    id: 'aurora',
    name: { zh: '极光', en: 'Aurora' },
    colors: ['#2f6f73', '#9b8cff', '#f4d35e'],
    text: '#f8fbff',
    muted: 'rgba(248, 251, 255, 0.72)',
  },
  {
    id: 'paper',
    name: { zh: '纸页', en: 'Paper' },
    colors: ['#f7efe3', '#93b5a6', '#d7a86e'],
    text: '#253126',
    muted: 'rgba(37, 49, 38, 0.62)',
  },
  {
    id: 'night',
    name: { zh: '夜航', en: 'Night' },
    colors: ['#151719', '#1f9fb8', '#8da7d8'],
    text: '#f4f0e8',
    muted: 'rgba(244, 240, 232, 0.66)',
  },
];

const ratios = {
  portrait: { width: 720, height: 960 },
  square: { width: 900, height: 900 },
  wide: { width: 1200, height: 675 },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);
// 当前模板、背景、字体都通过 id 查询，避免模板里散落查找逻辑。
const activeTemplate = computed(() => templates.find((item) => item.id === templateId.value) ?? templates[0]);
const activeBackground = computed(() => backgrounds.find((item) => item.id === backgroundId.value) ?? backgrounds[0]);
const activeFont = computed(() => fontFamilies.find((item) => item.id === fontFamily.value) ?? fontFamilies[0]);
// 比例只负责外层画布尺寸，视觉样式由 cardStyle 单独维护。
const ratioStyle = computed(() => ({
  aspectRatio: `${ratios[ratio.value].width} / ${ratios[ratio.value].height}`,
}));
// DOM 预览和 Canvas 下载共用同一组配置变量，尽量保持两边样式一致。
const cardStyle = computed(() => ({
  '--card-a': activeBackground.value.colors[0],
  '--card-b': activeBackground.value.colors[1],
  '--card-c': activeBackground.value.colors[2],
  '--card-text': activeBackground.value.text,
  '--card-muted': activeBackground.value.muted,
  '--card-scale': fontScale.value,
  '--card-font': activeFont.value.css,
  '--inner-padding': `${cardPadding.value}px`,
  '--inner-radius': `${cardRadius.value}px`,
  '--block-gap': `${blockGap.value}px`,
  '--text-align': textAlign.value,
}));

// 组件内所有配置文案都走这个方法，兼容中英文对象和普通字符串。
function t(value) {
  if (typeof value === 'string') return value;
  return value?.[props.language] ?? value?.zh ?? '';
}

// 编辑器状态实时保存到本地，避免用户刷新后丢失卡片内容和样式。
function saveDraft() {
  localStorage.setItem(storageKey, JSON.stringify({
    title: title.value,
    content: content.value,
    author: author.value,
    cardName: cardName.value,
    templateId: templateId.value,
    backgroundId: backgroundId.value,
    ratio: ratio.value,
    fontScale: fontScale.value,
    fontFamily: fontFamily.value,
    customWidth: customWidth.value,
    customHeight: customHeight.value,
    cardPadding: cardPadding.value,
    cardRadius: cardRadius.value,
    blockGap: blockGap.value,
    textAlign: textAlign.value,
    showWatermark: showWatermark.value,
    syncAllCards: syncAllCards.value,
  }));
}

// 恢复草稿时会校验枚举值，防止旧版本或手动修改的本地数据污染状态。
function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    if (!saved || typeof saved !== 'object') return;
    title.value = saved.title ?? title.value;
    content.value = saved.content ?? content.value;
    author.value = saved.author ?? author.value;
    cardName.value = saved.cardName ?? cardName.value;
    templateId.value = templates.some((item) => item.id === saved.templateId) ? saved.templateId : templateId.value;
    backgroundId.value = backgrounds.some((item) => item.id === saved.backgroundId) ? saved.backgroundId : backgroundId.value;
    ratio.value = ratios[saved.ratio] ? saved.ratio : ratio.value;
    fontScale.value = Number(saved.fontScale) || fontScale.value;
    fontFamily.value = fontFamilies.some((item) => item.id === saved.fontFamily) ? saved.fontFamily : fontFamily.value;
    customWidth.value = Number(saved.customWidth) || customWidth.value;
    customHeight.value = Number(saved.customHeight) || customHeight.value;
    cardPadding.value = Number(saved.cardPadding) || cardPadding.value;
    cardRadius.value = Number(saved.cardRadius) || cardRadius.value;
    blockGap.value = Number(saved.blockGap) || blockGap.value;
    textAlign.value = ['left', 'center', 'right', 'justify'].includes(saved.textAlign) ? saved.textAlign : textAlign.value;
    showWatermark.value = typeof saved.showWatermark === 'boolean' ? saved.showWatermark : showWatermark.value;
    syncAllCards.value = typeof saved.syncAllCards === 'boolean' ? saved.syncAllCards : syncAllCards.value;
  } catch {
    // 本地草稿损坏时忽略，继续使用默认卡片内容。
  }
}

// Canvas 没有自动换行能力，这里按字符测量宽度手动拆行，兼容中英文混排。
function wrapText(ctx, value, maxWidth) {
  const lines = [];
  value.split('\n').forEach((paragraph) => {
    let line = '';
    Array.from(paragraph).forEach((char) => {
      const next = line + char;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    lines.push('');
  });
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

// 按指定行高逐行绘制文字，并返回绘制后的光标位置。
function drawTextLines(ctx, lines, x, y, lineHeight) {
  let cursor = y;
  lines.forEach((line) => {
    if (line) ctx.fillText(line, x, cursor);
    cursor += lineHeight;
  });
  return cursor;
}

// 生成一个轻量的伪二维码，用作水印视觉，不承担真实扫码能力。
function drawQr(ctx, x, y, size, dark) {
  ctx.fillStyle = dark;
  const cell = size / 9;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if ((row * col + row + col) % 3 !== 0) {
        ctx.fillRect(x + col * cell, y + row * cell, cell * 0.72, cell * 0.72);
      }
    }
  }
}

// Canvas 原生圆角矩形兼容性不一，手动绘制路径更稳。
function roundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
}

// 将 DOM 预览重新绘制到 Canvas，确保下载 PNG 与页面预览尽量一致。
function downloadCard() {
  const preview = previewRef.value;
  if (!preview) return;

  const rect = preview.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const bg = activeBackground.value;
  const tpl = activeTemplate.value;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, bg.colors[0]);
  gradient.addColorStop(0.56, bg.colors[1]);
  gradient.addColorStop(1, bg.colors[2]);
  ctx.fillStyle = tpl.id === 'black' ? '#050607' : gradient;
  ctx.fillRect(0, 0, width, height);

  if (tpl.id !== 'black') {
    ctx.globalAlpha = tpl.id === 'transparent' ? 0.42 : 0.22;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width * 0.84, height * 0.12, width * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.1, height * 0.94, width * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const contentInset = ['frame', 'memo', 'bento'].includes(tpl.id) ? Math.round(width * 0.06) : 0;
  const padding = cardPadding.value + contentInset;
  const textColor = tpl.id === 'black' ? '#f4f0e8' : bg.text;
  const mutedColor = tpl.id === 'black' ? 'rgba(244,240,232,.72)' : bg.muted;
  const contentWidth = width - padding * 2;
  const align = textAlign.value === 'justify' ? 'left' : textAlign.value;
  const textX = align === 'center' ? width / 2 : align === 'right' ? width - padding : padding;
  const titleSize = 34 * fontScale.value;
  const bodySize = 18 * fontScale.value;

  if (contentInset) {
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    const radius = cardRadius.value;
    roundedRect(ctx, contentInset, contentInset, width - contentInset * 2, height - contentInset * 2, radius);
    ctx.stroke();
  }

  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillStyle = mutedColor;
  ctx.font = `700 ${12 * fontScale.value}px ${activeFont.value.canvas}`;
  ctx.fillText(text.value.preview, textX, padding);

  ctx.fillStyle = textColor;
  ctx.font = `700 ${titleSize}px ${activeFont.value.canvas}`;
  const titleLines = wrapText(ctx, title.value, contentWidth);
  let cursor = drawTextLines(ctx, titleLines, textX, padding + 34, titleSize * 1.16);

  ctx.fillStyle = mutedColor;
  ctx.font = `400 ${bodySize}px ${activeFont.value.canvas}`;
  const bodyLines = wrapText(ctx, content.value, contentWidth);
  cursor += blockGap.value;
  drawTextLines(ctx, bodyLines, textX, cursor, bodySize * 1.75);

  ctx.textBaseline = 'bottom';
  ctx.fillStyle = textColor;
  ctx.font = `600 ${15 * fontScale.value}px ${activeFont.value.canvas}`;
  ctx.fillText(author.value ? `- ${author.value}` : '', textX, height - padding);

  if (showWatermark.value && ['default', 'bento', 'frame'].includes(tpl.id)) {
    drawQr(ctx, width - padding - 54, height - padding - 54, 54, textColor);
  }

  const link = document.createElement('a');
  link.download = `${cardName.value || 'firefly-card'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// 进入页面恢复草稿；之后任意编辑项变化都会自动保存。
onMounted(loadDraft);
watch([
  title,
  content,
  author,
  cardName,
  templateId,
  backgroundId,
  ratio,
  fontScale,
  fontFamily,
  customWidth,
  customHeight,
  cardPadding,
  cardRadius,
  blockGap,
  textAlign,
  showWatermark,
  syncAllCards,
], saveDraft);
</script>

<template>
  <section class="firefly-page" aria-labelledby="firefly-title">
    <button class="tool-back" type="button" @click="$emit('back')">
      {{ text.back }}
    </button>

    <div class="firefly-hero">
      <div>
        <p class="eyebrow">{{ text.eyebrow }}</p>
        <h1 id="firefly-title">{{ text.title }}</h1>
        <p>{{ text.description }}</p>
      </div>
      <button class="firefly-download" type="button" @click="downloadCard">
        {{ text.download }}
      </button>
    </div>

    <div class="firefly-editor firefly-editor-pro">
      <section class="firefly-workspace">
        <div class="firefly-topbar">
          <input v-model="cardName" type="text" :placeholder="text.cardNamePlaceholder" />
          <div class="firefly-toolbar" aria-hidden="true">
            <span>✂</span>
            <span>▣</span>
            <span>▦</span>
          </div>
        </div>

        <section class="firefly-preview-wrap" :aria-label="text.preview">
          <div
            ref="previewRef"
            class="firefly-preview"
            :class="`card-template-${activeTemplate.id}`"
            :style="[ratioStyle, cardStyle]"
          >
            <div class="firefly-glow one"></div>
            <div class="firefly-glow two"></div>
            <div class="firefly-card-content">
              <div v-if="activeTemplate.id === 'frame'" class="card-window-dots">
                <span></span><span></span><span></span>
              </div>
              <p>{{ text.preview }}</p>
              <h2>{{ title }}</h2>
              <div class="firefly-body">{{ content }}</div>
              <div class="card-footer">
                <strong v-if="author">- {{ author }}</strong>
                <span v-if="showWatermark && ['default', 'bento', 'frame'].includes(activeTemplate.id)" class="fake-qr"></span>
              </div>
            </div>
          </div>
        </section>
      </section>

      <aside class="firefly-property">
        <div class="property-tabs">
          <span class="is-active">{{ text.propertyLabel }}</span>
        </div>

        <section class="property-section">
          <label class="switch-row">
            <span>{{ text.syncAllCards }}</span>
            <input v-model="syncAllCards" type="checkbox" />
          </label>
          <label class="switch-row">
            <span>{{ text.watermark }}</span>
            <input v-model="showWatermark" type="checkbox" />
          </label>
        </section>

        <section class="property-section">
          <h3>{{ text.templateLabel }}</h3>
          <div class="property-grid two">
            <label>
              <span>{{ text.widthLabel }}</span>
              <input v-model.number="customWidth" type="number" min="260" />
            </label>
            <label>
              <span>{{ text.heightLabel }}</span>
              <input v-model.number="customHeight" type="number" min="0" />
            </label>
          </div>

          <div class="firefly-control">
            <span>{{ text.backgroundLabel }}</span>
            <div class="firefly-background-list">
              <button
                v-for="item in backgrounds"
                :key="item.id"
                type="button"
                :class="{ 'is-active': item.id === backgroundId }"
                @click="backgroundId = item.id"
              >
                <span class="template-swatch" :style="{ background: `linear-gradient(135deg, ${item.colors.join(',')})` }"></span>
                {{ t(item.name) }}
              </button>
            </div>
          </div>

          <div class="firefly-control">
            <span>{{ text.ratioLabel }}</span>
            <div class="firefly-segments">
              <button type="button" :class="{ 'is-active': ratio === 'portrait' }" @click="ratio = 'portrait'">
                {{ text.portrait }}
              </button>
              <button type="button" :class="{ 'is-active': ratio === 'square' }" @click="ratio = 'square'">
                {{ text.square }}
              </button>
              <button type="button" :class="{ 'is-active': ratio === 'wide' }" @click="ratio = 'wide'">
                {{ text.wide }}
              </button>
            </div>
          </div>
        </section>

        <section class="property-section">
          <h3>{{ text.containerLabel }}</h3>
          <label>
            <span>{{ text.paddingLabel }}</span>
            <input v-model.number="cardPadding" type="range" min="16" max="64" />
          </label>
          <label>
            <span>{{ text.radiusLabel }}</span>
            <input v-model.number="cardRadius" type="range" min="0" max="34" />
          </label>
          <label>
            <span>{{ text.gapLabel }}</span>
            <input v-model.number="blockGap" type="range" min="0" max="40" />
          </label>
        </section>

        <section class="property-section">
          <h3>{{ text.textPanelLabel }}</h3>
          <label>
            <span>{{ text.fontFamilyLabel }}</span>
            <select v-model="fontFamily" class="font-select">
              <option v-for="item in fontFamilies" :key="item.id" :value="item.id">
                {{ t(item.name) }}
              </option>
            </select>
          </label>
          <label>
            <span>{{ text.fontLabel }}</span>
            <input v-model.number="fontScale" type="range" min="0.8" max="1.25" step="0.05" />
          </label>
          <div class="align-buttons" :aria-label="text.alignLabel">
            <button type="button" :class="{ 'is-active': textAlign === 'left' }" @click="textAlign = 'left'">左</button>
            <button type="button" :class="{ 'is-active': textAlign === 'center' }" @click="textAlign = 'center'">中</button>
            <button type="button" :class="{ 'is-active': textAlign === 'right' }" @click="textAlign = 'right'">右</button>
            <button type="button" :class="{ 'is-active': textAlign === 'justify' }" @click="textAlign = 'justify'">齐</button>
          </div>
        </section>

        <section class="property-section">
          <h3>{{ text.contentLabel }}</h3>
          <label>
            <span>{{ text.titleLabel }}</span>
            <input v-model="title" type="text" />
          </label>
          <label>
            <span>{{ text.contentLabel }}</span>
            <textarea v-model="content" rows="6"></textarea>
          </label>
          <label>
            <span>{{ text.authorLabel }}</span>
            <input v-model="author" type="text" />
          </label>
        </section>
      </aside>
    </div>
  </section>
</template>
