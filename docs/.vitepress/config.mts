import { defineConfig } from 'vitepress'
import en from './locales/en'
import zh from './locales/zh'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Magic Docs",
  description: "The New Generation Enterprise-level AI Application Innovation Engine",
  locales: {
    root: en,
    zh: zh
  },
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dtyq/magic' }
    ],
    search: {
      provider: 'local'
    },
    outline: {
      level: 'deep',
    }
  }
}) 