<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ language: { type: String, required: true } });
defineEmits(['back']);

const quality = ref(0.78);
const outputType = ref('image/jpeg');
const previewUrl = ref('');
const outputUrl = ref('');
const sourceInfo = ref('');
const outputInfo = ref('');

const copy = {
  zh: {
    back: '返回首页',
    eyebrow: 'Image Compressor',
    title: '图片压缩',
    description: '在浏览器中压缩图片，调整质量并导出新文件。',
    upload: '选择图片',
    quality: '质量',
    type: '格式',
    download: '下载图片',
    source: '原图',
    output: '压缩后',
  },
  en: {
    back: 'Back home',
    eyebrow: 'Image Compressor',
    title: 'Image Compressor',
    description: 'Compress images in the browser, adjust quality, and export a new file.',
    upload: 'Choose image',
    quality: 'Quality',
    type: 'Format',
    download: 'Download image',
    source: 'Original',
    output: 'Compressed',
  },
};

// 页面文案按当前语言读取，缺失语言时回落到中文。
const text = computed(() => copy[props.language] ?? copy.zh);

// 统一把字节数展示成 KB，便于比较压缩前后体积。
function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// 图片压缩完全在浏览器内完成：File -> Image -> Canvas -> Blob。
function compress(file) {
  sourceInfo.value = `${text.value.source}: ${formatSize(file.size)}`;
  const img = new Image();
  img.onload = () => {
    // Canvas 尺寸沿用原图，当前工具只压缩质量和格式，不改变分辨率。
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      outputUrl.value = URL.createObjectURL(blob);
      outputInfo.value = `${text.value.output}: ${formatSize(blob.size)}`;
    }, outputType.value, quality.value);
  };
  // Object URL 用于本地预览，不会把图片上传到服务器。
  previewUrl.value = URL.createObjectURL(file);
  img.src = previewUrl.value;
}

// 读取用户选择的第一张图片并立即压缩。
function handleFile(event) {
  const file = event.target.files?.[0];
  if (file) compress(file);
}
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
        <label class="utility-field"><span>{{ text.upload }}</span><input class="utility-input" type="file" accept="image/*" @change="handleFile" /></label>
        <label class="utility-field"><span>{{ text.quality }} {{ quality }}</span><input v-model.number="quality" type="range" min="0.1" max="1" step="0.05" /></label>
        <label class="utility-field"><span>{{ text.type }}</span><select v-model="outputType" class="utility-select"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></label>
        <p class="utility-message">{{ sourceInfo }} {{ outputInfo }}</p>
        <a v-if="outputUrl" class="utility-button primary" :href="outputUrl" download="compressed-image"> {{ text.download }} </a>
      </div>
      <div class="utility-panel image-preview-wrap">
        <img v-if="outputUrl" :src="outputUrl" alt="compressed preview" />
      </div>
    </section>
  </section>
</template>
