export const siteConfig = {
  // 全站基础信息、导航、动作按钮和主题都集中在这里，后续扩展无需改组件。
  name: "Garen's site",
  defaultLanguage: 'zh',
  languages: [
    { id: 'zh', label: '中文', shortLabel: '中' },
    { id: 'en', label: 'English', shortLabel: 'EN' },
  ],
  copy: {
    zh: {
      tagline: '把常用小工具整理成一个安静、顺手的角落。',
      copyright: '© 2026 麦冬°C. All Rights Reserved.',
      personalTools: 'personal tools',
      toolsDirectory: '工具目录',
    },
    en: {
      tagline: 'A quiet, handy corner for the small tools you use often.',
      copyright: '© 2026 Maidong°C. All Rights Reserved.',
      personalTools: 'personal tools',
      toolsDirectory: 'Tools directory',
    },
  },
  menus: [
    { label: { zh: '首页', en: 'Home' }, href: '#home' },
    // { label: { zh: '工具', en: 'Tools' }, href: '#tools' },
    // { label: { zh: '更新', en: 'Updates' }, href: '#updates' },
  ],
  actions: [
    { id: 'theme', label: { zh: '选择主题', en: 'Choose theme' }, icon: 'palette' },
    { id: 'language', label: { zh: '切换语言', en: 'Switch language' }, icon: 'language' },
    {
      id: 'github',
      label: { zh: 'GitHub 主页', en: 'GitHub profile' },
      icon: 'github',
      href: 'https://github.com/hackful5281',
    },
  ],
  themes: [
    {
      id: 'morning',
      name: { zh: '晨雾', en: 'Morning' },
      description: { zh: '温和米白，适合默认阅读。', en: 'Soft warm white for everyday reading.' },
      swatches: ['#faf8f4', '#69b7a8', '#20201d'],
    },
    {
      id: 'tea',
      name: { zh: '茶绿', en: 'Tea' },
      description: { zh: '清爽自然，页面更安静。', en: 'Fresh, natural, and calm.' },
      swatches: ['#f4f7f1', '#6fa27a', '#253126'],
    },
    {
      id: 'dusk',
      name: { zh: '暮蓝', en: 'Dusk' },
      description: { zh: '低饱和蓝灰，适合长时间浏览。', en: 'Low-saturation blue gray for long sessions.' },
      swatches: ['#f2f5f8', '#7895b2', '#1e2732'],
    },
    {
      id: 'night',
      name: { zh: '墨夜', en: 'Night' },
      description: { zh: '深色柔和，夜间更舒服。', en: 'A softer dark theme for night use.' },
      swatches: ['#151719', '#8fb9a8', '#f4f0e8'],
    },
  ],
};
