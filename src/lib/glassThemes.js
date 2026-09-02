// Accent palette for the glass skin. Each entry carries the colour twice:
// `hex` because DotGrid and MetallicPaint parse hex only, `hsl` as bare
// components so CSS can build the translucent variants with hsl(... / a).
//
// Every colour is saturated and light enough to stay legible on the #0a0a0a
// background; hues are spread around the wheel so two loads rarely look alike.
export const GLASS_THEMES = [
  { name: 'neon green', hex: '#27ff64', hsl: '137 100% 58%' },
  { name: 'mint', hex: '#1fffbc', hsl: '162 100% 56%' },
  { name: 'cyan', hex: '#1ae4ff', hsl: '187 100% 55%' },
  { name: 'azure', hex: '#3da5ff', hsl: '208 100% 62%' },
  { name: 'indigo', hex: '#6b6bff', hsl: '240 100% 71%' },
  { name: 'violet', hex: '#bc70ff', hsl: '272 100% 72%' },
  { name: 'magenta', hex: '#ff5ce4', hsl: '310 100% 68%' },
  { name: 'rose', hex: '#ff5c92', hsl: '340 100% 68%' },
  { name: 'coral', hex: '#ff7247', hsl: '14 100% 64%' },
  { name: 'amber', hex: '#ffb029', hsl: '38 100% 58%' },
]

// Cosmetic only. Math.random() must never touch password material — that comes
// from crypto.getRandomValues in passwordCore.js and nowhere else.
export const randomGlassTheme = () => GLASS_THEMES[Math.floor(Math.random() * GLASS_THEMES.length)]
