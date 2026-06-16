import difficultyPicker from './difficulty-picker';
import dailyNote from './daily-note';
import fireflyCard from './firefly-card';
import videoParser from './video-parser';
import videoPlayer from './video-player';
import passwordGenerator from './password-generator';
import jsonFormatter from './json-formatter';
import timestampConverter from './timestamp-converter';
import pomodoroTimer from './pomodoro-timer';
import spinWheel from './spin-wheel';
import colorTool from './color-tool';
import markdownPreview from './markdown-preview';
import qrGenerator from './qr-generator';
import imageCompressor from './image-compressor';
import textToolbox from './text-toolbox';

// 首页工具目录的唯一注册入口；新增工具时在这里导入并加入数组即可。
export const tools = [
  difficultyPicker,
  dailyNote,
  fireflyCard,
  videoParser,
  videoPlayer,
  passwordGenerator,
  jsonFormatter,
  timestampConverter,
  pomodoroTimer,
  spinWheel,
  colorTool,
  markdownPreview,
  qrGenerator,
  imageCompressor,
  textToolbox,
];

// 按当前语言把工具聚合成分组，供首页工具列表渲染。
export function createToolGroups(language) {
  return tools.reduce((groups, tool) => {
    const groupName = tool.group[language] ?? tool.group.zh;
    const groupId = groupName.toLowerCase().replace(/\s+/g, '-');
    const group = groups.find((item) => item.id === groupId);

    if (group) {
      group.items.push(tool);
    } else {
      groups.push({
        id: groupId,
        name: groupName,
        items: [tool],
      });
    }

    return groups;
  }, []);
}
