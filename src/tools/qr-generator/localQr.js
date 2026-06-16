// 轻量本地二维码生成器。
// 设计目标是替代运行时 CDN：普通链接、短文本和中文内容都可以在浏览器本地生成。
// 当前实现覆盖 QR Code Byte 模式、版本 1-5、L/M/Q/H 四档纠错率；如果后续要支持更长文本，
// 可以继续扩展 VERSION_TABLE 中的版本容量和分块参数。

const VERSION_TABLE = [
  null,
  {
    size: 21,
    totalCodewords: 26,
    alignments: [],
    levels: {
      L: { blocks: 1, ecCodewords: 7 },
      M: { blocks: 1, ecCodewords: 10 },
      Q: { blocks: 1, ecCodewords: 13 },
      H: { blocks: 1, ecCodewords: 17 },
    },
  },
  {
    size: 25,
    totalCodewords: 44,
    alignments: [6, 18],
    levels: {
      L: { blocks: 1, ecCodewords: 10 },
      M: { blocks: 1, ecCodewords: 16 },
      Q: { blocks: 1, ecCodewords: 22 },
      H: { blocks: 1, ecCodewords: 28 },
    },
  },
  {
    size: 29,
    totalCodewords: 70,
    alignments: [6, 22],
    levels: {
      L: { blocks: 1, ecCodewords: 15 },
      M: { blocks: 1, ecCodewords: 26 },
      Q: { blocks: 2, ecCodewords: 18 },
      H: { blocks: 2, ecCodewords: 22 },
    },
  },
  {
    size: 33,
    totalCodewords: 100,
    alignments: [6, 26],
    levels: {
      L: { blocks: 1, ecCodewords: 20 },
      M: { blocks: 2, ecCodewords: 18 },
      Q: { blocks: 2, ecCodewords: 26 },
      H: { blocks: 4, ecCodewords: 16 },
    },
  },
  {
    size: 37,
    totalCodewords: 134,
    alignments: [6, 30],
    levels: {
      L: { blocks: 1, ecCodewords: 26 },
      M: { blocks: 2, ecCodewords: 24 },
      Q: { blocks: 4, ecCodewords: 18 },
      H: { blocks: 4, ecCodewords: 22 },
    },
  },
];

// QR Code 格式信息中的纠错等级编码：M=00、L=01、H=10、Q=11。
const ERROR_LEVEL_FORMAT_BITS = { M: 0, L: 1, H: 2, Q: 3 };
// 固定掩码 pattern 0 能让实现保持轻量；对普通文本、链接和短中文内容已经足够稳定。
const MASK_PATTERN = 0;
const BYTE_MODE = 0b0100;
const PAD_CODEWORDS = [0xec, 0x11];

let gfExp = null;
let gfLog = null;

// 把字符串编码成 UTF-8 字节，Byte 模式下二维码实际存储的就是这些字节。
function encodeUtf8(value) {
  return Array.from(new TextEncoder().encode(value));
}

// 根据版本和纠错率计算可用数据码字数量。
function getDataCodewordCount(versionInfo, levelInfo) {
  return versionInfo.totalCodewords - levelInfo.blocks * levelInfo.ecCodewords;
}

// 选择能容纳当前字节数的最小版本，保证二维码尽量紧凑。
function pickVersion(byteLength, errorCorrection, requestedVersion = 'auto') {
  const fits = (versionInfo, version) => {
    const levelInfo = versionInfo.levels[errorCorrection];
    const dataCodewords = getDataCodewordCount(versionInfo, levelInfo);
    const payloadBits = 4 + 8 + byteLength * 8;
    return version <= 9 && payloadBits <= dataCodewords * 8;
  };

  if (requestedVersion !== 'auto') {
    const version = Number(requestedVersion);
    const versionInfo = VERSION_TABLE[version];
    if (!versionInfo) return 0;
    return fits(versionInfo, version) ? version : -1;
  }

  return VERSION_TABLE.findIndex((item, version) => {
    if (!item) return false;
    return fits(item, version);
  });
}

// 写入指定长度的二进制位，高位在前，符合 QR Code 的数据流顺序。
function pushBits(bits, value, length) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push((value >>> index) & 1);
  }
}

// 生成数据码字：模式标识、字节长度、正文、终止符、补齐位和交替填充码字。
function createDataCodewords(bytes, dataCodewordCount) {
  const bits = [];
  const capacityBits = dataCodewordCount * 8;

  pushBits(bits, BYTE_MODE, 4);
  pushBits(bits, bytes.length, 8);
  bytes.forEach((byte) => pushBits(bits, byte, 8));

  const terminatorLength = Math.min(4, capacityBits - bits.length);
  pushBits(bits, 0, terminatorLength);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(Number.parseInt(bits.slice(index, index + 8).join(''), 2));
  }

  let padIndex = 0;
  while (codewords.length < dataCodewordCount) {
    codewords.push(PAD_CODEWORDS[padIndex % PAD_CODEWORDS.length]);
    padIndex += 1;
  }

  return codewords;
}

// 初始化 GF(256) 指数表和对数表，Reed-Solomon 纠错计算会用到。
function initGaloisField() {
  if (gfExp && gfLog) return;

  gfExp = Array.from({ length: 512 }, () => 0);
  gfLog = Array.from({ length: 256 }, () => 0);

  let value = 1;
  for (let index = 0; index < 255; index += 1) {
    gfExp[index] = value;
    gfLog[value] = index;
    value <<= 1;
    if (value & 0x100) {
      value ^= 0x11d;
    }
  }

  for (let index = 255; index < 512; index += 1) {
    gfExp[index] = gfExp[index - 255];
  }
}

// GF(256) 乘法，0 需要单独处理，否则对数表没有定义。
function gfMultiply(left, right) {
  if (left === 0 || right === 0) return 0;
  return gfExp[gfLog[left] + gfLog[right]];
}

// 多项式乘法，用于生成 Reed-Solomon 的生成多项式。
function multiplyPolynomials(left, right) {
  const result = Array.from({ length: left.length + right.length - 1 }, () => 0);
  left.forEach((leftValue, leftIndex) => {
    right.forEach((rightValue, rightIndex) => {
      result[leftIndex + rightIndex] ^= gfMultiply(leftValue, rightValue);
    });
  });
  return result;
}

// 生成指定纠错码字数量对应的 Reed-Solomon 生成多项式。
function createGeneratorPolynomial(degree) {
  initGaloisField();

  let polynomial = [1];
  for (let index = 0; index < degree; index += 1) {
    polynomial = multiplyPolynomials(polynomial, [1, gfExp[index]]);
  }
  return polynomial;
}

// 根据数据码字计算 Reed-Solomon 纠错码字。
function createErrorCorrectionCodewords(dataCodewords, ecCodewords) {
  const generator = createGeneratorPolynomial(ecCodewords);
  const remainder = Array.from({ length: ecCodewords }, () => 0);

  dataCodewords.forEach((codeword) => {
    const factor = codeword ^ remainder.shift();
    remainder.push(0);

    generator.slice(1).forEach((coefficient, index) => {
      remainder[index] ^= gfMultiply(coefficient, factor);
    });
  });

  return remainder;
}

// 按 QR Code 标准把数据拆成多个纠错块，再交错排列数据码字和纠错码字。
// 多块结构在 Q/H 高容错率下很常见，不能简单把全部数据当成一个 Reed-Solomon 块。
function createFinalCodewords(dataCodewords, versionInfo, levelInfo) {
  const blocks = [];
  const blockCount = levelInfo.blocks;
  const ecCodewords = levelInfo.ecCodewords;
  const shortBlockCount = blockCount - (versionInfo.totalCodewords % blockCount);
  const shortBlockTotalLength = Math.floor(versionInfo.totalCodewords / blockCount);
  let offset = 0;

  for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
    const dataLength = shortBlockTotalLength - ecCodewords + (blockIndex < shortBlockCount ? 0 : 1);
    const data = dataCodewords.slice(offset, offset + dataLength);
    offset += dataLength;

    blocks.push({
      data,
      errorCorrection: createErrorCorrectionCodewords(data, ecCodewords),
    });
  }

  const result = [];
  const maxDataLength = Math.max(...blocks.map((block) => block.data.length));

  for (let index = 0; index < maxDataLength; index += 1) {
    blocks.forEach((block) => {
      if (index < block.data.length) result.push(block.data[index]);
    });
  }

  for (let index = 0; index < ecCodewords; index += 1) {
    blocks.forEach((block) => {
      result.push(block.errorCorrection[index]);
    });
  }

  return result;
}

// 创建二维码矩阵和功能区标记。功能区不能写入数据，也不会被掩码反转。
function createMatrix(size) {
  return {
    modules: Array.from({ length: size }, () => Array.from({ length: size }, () => false)),
    reserved: Array.from({ length: size }, () => Array.from({ length: size }, () => false)),
  };
}

// 写入功能图形模块，同时把位置标记为保留区。
function setFunctionModule(matrix, x, y, dark) {
  if (x < 0 || y < 0 || y >= matrix.modules.length || x >= matrix.modules.length) return;
  matrix.modules[y][x] = dark;
  matrix.reserved[y][x] = true;
}

// 绘制三个定位图形及外侧空白分隔线。
function drawFinderPattern(matrix, startX, startY) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const xx = startX + x;
      const yy = startY + y;
      const inPattern = x >= 0 && x <= 6 && y >= 0 && y <= 6;
      const isOuter = x === 0 || x === 6 || y === 0 || y === 6;
      const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      setFunctionModule(matrix, xx, yy, inPattern && (isOuter || isCenter));
    }
  }
}

// 绘制校准图形，版本 2 起用于降低扫描时的形变影响。
function drawAlignmentPattern(matrix, centerX, centerY) {
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      const distance = Math.max(Math.abs(x), Math.abs(y));
      setFunctionModule(matrix, centerX + x, centerY + y, distance === 2 || distance === 0);
    }
  }
}

// 绘制横向和纵向时序线，扫描器会用它判断二维码模块间距。
function drawTimingPatterns(matrix) {
  const size = matrix.modules.length;
  for (let index = 8; index < size - 8; index += 1) {
    const dark = index % 2 === 0;
    setFunctionModule(matrix, index, 6, dark);
    setFunctionModule(matrix, 6, index, dark);
  }
}

// 计算 15 位格式信息，包含纠错等级、掩码编号和 BCH 校验。
function createFormatBits(errorCorrection) {
  let value = (ERROR_LEVEL_FORMAT_BITS[errorCorrection] << 3) | MASK_PATTERN;
  let data = value << 10;
  const generator = 0x537;

  for (let bit = 14; bit >= 10; bit -= 1) {
    if ((data >>> bit) & 1) {
      data ^= generator << (bit - 10);
    }
  }

  value = ((value << 10) | data) ^ 0x5412;
  return value;
}

// 格式信息需要写两份，分别靠近左上和右上/左下定位图形。
function drawFormatBits(matrix, errorCorrection) {
  const size = matrix.modules.length;
  const bits = createFormatBits(errorCorrection);
  const bitAt = (index) => Boolean((bits >>> index) & 1);

  for (let index = 0; index <= 5; index += 1) setFunctionModule(matrix, 8, index, bitAt(index));
  setFunctionModule(matrix, 8, 7, bitAt(6));
  setFunctionModule(matrix, 8, 8, bitAt(7));
  setFunctionModule(matrix, 7, 8, bitAt(8));
  for (let index = 9; index < 15; index += 1) setFunctionModule(matrix, 14 - index, 8, bitAt(index));

  for (let index = 0; index < 8; index += 1) setFunctionModule(matrix, size - 1 - index, 8, bitAt(index));
  for (let index = 8; index < 15; index += 1) setFunctionModule(matrix, 8, size - 15 + index, bitAt(index));

  setFunctionModule(matrix, 8, size - 8, true);
}

// 绘制二维码所有固定功能图形，并提前标记保留区。
function drawFunctionPatterns(matrix, versionInfo, errorCorrection) {
  const size = matrix.modules.length;
  drawFinderPattern(matrix, 0, 0);
  drawFinderPattern(matrix, size - 7, 0);
  drawFinderPattern(matrix, 0, size - 7);
  drawTimingPatterns(matrix);

  versionInfo.alignments.forEach((x) => {
    versionInfo.alignments.forEach((y) => {
      const overlapsFinder =
        (x === 6 && y === 6) ||
        (x === 6 && y === size - 7) ||
        (x === size - 7 && y === 6);
      if (!overlapsFinder) drawAlignmentPattern(matrix, x, y);
    });
  });

  drawFormatBits(matrix, errorCorrection);
}

// 掩码 pattern 0 的规则。只作用于数据区，用来打散大面积连续色块。
function shouldMask(x, y) {
  return (x + y) % 2 === 0;
}

// 按二维码标准的竖向蛇形路径写入数据位。
function placeDataBits(matrix, codewords) {
  const size = matrix.modules.length;
  const bits = codewords.flatMap((codeword) => {
    const codewordBits = [];
    pushBits(codewordBits, codeword, 8);
    return codewordBits;
  });

  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;

    for (let vertical = 0; vertical < size; vertical += 1) {
      const upward = ((right + 1) & 2) === 0;
      const y = upward ? size - 1 - vertical : vertical;

      for (let columnOffset = 0; columnOffset < 2; columnOffset += 1) {
        const x = right - columnOffset;
        if (matrix.reserved[y][x]) continue;

        const bit = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        matrix.modules[y][x] = shouldMask(x, y) ? !bit : bit;
        bitIndex += 1;
      }
    }
  }
}

// 生成二维码矩阵，返回模块二维数组和版本信息，方便 Canvas 层决定绘制尺寸。
export function createQrMatrix(value, options = {}) {
  const errorCorrection = ERROR_LEVEL_FORMAT_BITS[options.errorCorrection] !== undefined ? options.errorCorrection : 'H';
  const bytes = encodeUtf8(value);
  const version = pickVersion(bytes.length, errorCorrection, options.version ?? 'auto');

  if (version === -1) {
    throw new Error('QR_VERSION_TOO_SMALL');
  }

  if (version <= 0) {
    throw new Error('QR_CONTENT_TOO_LONG');
  }

  const versionInfo = VERSION_TABLE[version];
  const levelInfo = versionInfo.levels[errorCorrection];
  const dataCodewords = createDataCodewords(bytes, getDataCodewordCount(versionInfo, levelInfo));
  const finalCodewords = createFinalCodewords(dataCodewords, versionInfo, levelInfo);
  const matrix = createMatrix(versionInfo.size);

  drawFunctionPatterns(matrix, versionInfo, errorCorrection);
  placeDataBits(matrix, finalCodewords);

  return {
    errorCorrection,
    modules: matrix.modules,
    version,
    size: versionInfo.size,
    dataCodewords: dataCodewords.length,
    totalCodewords: versionInfo.totalCodewords,
  };
}

// 把二维码矩阵绘制到 Canvas。外边距固定 4 个模块，符合扫描器常见识别要求。
export function drawQrToCanvas(canvas, value, targetSize, options = {}) {
  const qr = createQrMatrix(value, options);
  const quietZone = Math.max(0, Math.min(8, Number(options.margin) || 0));
  const moduleCount = qr.size + quietZone * 2;
  const outputSize = Math.max(120, Math.min(640, Number(targetSize) || 220));
  const scale = Math.floor(outputSize / moduleCount);
  const canvasSize = moduleCount * scale;
  const ctx = canvas.getContext('2d');

  canvas.width = canvasSize;
  canvas.height = canvasSize;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = '#111827';

  qr.modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (!dark) return;
      ctx.fillRect((x + quietZone) * scale, (y + quietZone) * scale, scale, scale);
    });
  });

  return qr;
}
