<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { drawQrToCanvas } from './localQr';

const props = defineProps({ language: { type: String, required: true } });
defineEmits(['back']);

const content = ref('https://github.com/hackful5281');
const size = ref(220);
const margin = ref(4);
const errorCorrection = ref('H');
const version = ref('auto');
const canvasRef = ref(null);
const error = ref('');
const qrMeta = ref(null);

const errorLevels = [
  { id: 'L', label: 'L - 7%' },
  { id: 'M', label: 'M - 15%' },
  { id: 'Q', label: 'Q - 25%' },
  { id: 'H', label: 'H - 30%' },
];

const versionOptions = ['auto', 1, 2, 3, 4, 5];
const downloadSizes = [240, 360, 480, 640];

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'QR Code',
    title: '二维码生成器',
    description: '输入文本或链接生成二维码，并下载 PNG。',
    content: '内容',
    size: '尺寸',
    margin: '码边距',
    errorCorrection: '容错率',
    version: '码版本',
    autoVersion: '自动',
    quickDownload: '快捷下载',
    metaTitle: '二维码信息',
    codeType: '码制',
    modules: '模块数',
    dataCapacity: '码字',
    download: '下载 PNG',
    empty: '请输入要生成二维码的内容。',
    tooLong: '当前内容太长，请缩短后再生成。',
    versionTooSmall: '当前版本容量不足，请改为自动或选择更高版本。',
    renderFailed: '二维码生成失败，请检查内容后重试。',
  },
  en: {
    back: 'Back home',
    eyebrow: 'QR Code',
    title: 'QR Code Generator',
    description: 'Generate a QR code from text or links and download it as a PNG.',
    content: 'Content',
    size: 'Size',
    margin: 'Margin',
    errorCorrection: 'Error correction',
    version: 'Code version',
    autoVersion: 'Auto',
    quickDownload: 'Quick download',
    metaTitle: 'QR information',
    codeType: 'Code type',
    modules: 'Modules',
    dataCapacity: 'Codewords',
    download: 'Download PNG',
    empty: 'Enter content to generate a QR code.',
    tooLong: 'The content is too long. Please shorten it and try again.',
    versionTooSmall: 'The selected version is too small. Use Auto or choose a higher version.',
    renderFailed: 'QR generation failed. Check the content and try again.',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);

// 输入内容或尺寸变化后重新绘制 canvas。二维码生成完全在本地完成，不依赖 CDN 或外网。
async function renderQr() {
  await nextTick();
  if (!canvasRef.value) return;

  const value = content.value.trim();
  if (!value) {
    error.value = text.value.empty;
    qrMeta.value = null;
    return;
  }

  try {
    qrMeta.value = drawQrToCanvas(canvasRef.value, value, size.value, {
      margin: margin.value,
      errorCorrection: errorCorrection.value,
      version: version.value,
    });
    error.value = '';
  } catch (reason) {
    qrMeta.value = null;
    if (reason?.message === 'QR_CONTENT_TOO_LONG') {
      error.value = text.value.tooLong;
    } else if (reason?.message === 'QR_VERSION_TOO_SMALL') {
      error.value = text.value.versionTooSmall;
    } else {
      error.value = text.value.renderFailed;
    }
  }
}

// 把 canvas 导出成 PNG 下载；没有成功生成时禁用按钮，避免下载空白图。
function downloadQr(downloadSize = size.value) {
  if (!canvasRef.value || error.value) return;

  // 快捷尺寸下载会临时绘制到离屏 canvas，不影响页面当前预览尺寸。
  const exportCanvas = document.createElement('canvas');
  drawQrToCanvas(exportCanvas, content.value.trim(), downloadSize, {
    margin: margin.value,
    errorCorrection: errorCorrection.value,
    version: version.value,
  });

  const link = document.createElement('a');
  link.download = `qrcode-${downloadSize}px.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
}

// 首次进入页面时先生成默认二维码。
onMounted(renderQr);
// 内容、尺寸、边距、纠错率、版本和语言都会影响二维码状态或错误提示，任意变化都重新生成。
watch([content, size, margin, errorCorrection, version, () => props.language], renderQr);
</script>

<template>
  <section class="utility-page">
    <button class="tool-back" type="button" @click="$emit('back')">{{ text.back }}</button>
    <div class="utility-hero">
      <p class="eyebrow">{{ text.eyebrow }}</p>
      <h1>{{ text.title }}</h1>
      <p>{{ text.description }}</p>
    </div>
    <section class="utility-grid">
      <div class="utility-panel">
        <label class="utility-field">
          <span>{{ text.content }}</span>
          <textarea v-model="content" class="utility-textarea"></textarea>
        </label>
        <div class="utility-grid">
          <label class="utility-field">
            <span>{{ text.size }}</span>
            <input v-model.number="size" class="utility-input" type="number" min="120" max="640" />
          </label>
          <label class="utility-field">
            <span>{{ text.margin }}</span>
            <input v-model.number="margin" class="utility-input" type="number" min="0" max="8" />
          </label>
        </div>
        <div class="utility-grid">
          <label class="utility-field">
            <span>{{ text.errorCorrection }}</span>
            <select v-model="errorCorrection" class="utility-select">
              <option v-for="item in errorLevels" :key="item.id" :value="item.id">{{ item.label }}</option>
            </select>
          </label>
          <label class="utility-field">
            <span>{{ text.version }}</span>
            <select v-model="version" class="utility-select">
              <option v-for="item in versionOptions" :key="item" :value="item">
                {{ item === 'auto' ? text.autoVersion : `V${item}` }}
              </option>
            </select>
          </label>
        </div>
        <button class="utility-button primary" type="button" :disabled="Boolean(error)" @click="downloadQr()">{{ text.download }}</button>
      </div>
      <div class="utility-panel qr-canvas-wrap">
        <canvas ref="canvasRef"></canvas>
        <p v-if="error" class="utility-error">{{ error }}</p>
        <section v-else-if="qrMeta" class="qr-meta">
          <h2>{{ text.metaTitle }}</h2>
          <p><span>{{ text.codeType }}</span><strong>QR Code</strong></p>
          <p><span>{{ text.errorCorrection }}</span><strong>{{ qrMeta.errorCorrection }}</strong></p>
          <p><span>{{ text.version }}</span><strong>V{{ qrMeta.version }}</strong></p>
          <p><span>{{ text.modules }}</span><strong>{{ qrMeta.size }} x {{ qrMeta.size }}</strong></p>
          <p><span>{{ text.dataCapacity }}</span><strong>{{ qrMeta.dataCodewords }} / {{ qrMeta.totalCodewords }}</strong></p>
          <div class="qr-download-sizes" :aria-label="text.quickDownload">
            <button
              v-for="item in downloadSizes"
              :key="item"
              type="button"
              @click="downloadQr(item)"
            >
              {{ item }}px
            </button>
          </div>
        </section>
      </div>
    </section>
  </section>
</template>
