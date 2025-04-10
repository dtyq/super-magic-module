# 配置

了解 Magic Docs 中所有可用的配置选项。

## 站点配置

主配置文件位于 `.vitepress/config.mts`。以下是所有可用选项的完整示例：

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  // 站点标题
  title: "Magic Docs",
  
  // 站点描述
  description: "新一代企业级AI应用创新引擎",
  
  // 站点基础 URL
  base: '/',
  
  // 语言设置
  lang: 'zh-CN',
  
  // 头部标签
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
  ],
  
  // 最后更新时间
  lastUpdated: true,
  
  // 主题配置
  themeConfig: {
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' }
    ],
    
    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '配置', link: '/guide/configuration' }
          ]
        }
      ]
    },
    
    // 页脚
    footer: {
      message: '基于 Apache 2.0 许可发布',
      copyright: 'Copyright © 2025-present Magic Docs'
    },
    
    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],
    
    // 搜索
    search: {
      provider: 'local'
    }
  }
})
```

## 主题配置

### 导航栏

导航栏可以配置链接和下拉菜单：

```typescript
nav: [
  { text: '首页', link: '/' },
  { text: '指南', link: '/guide/' },
  {
    text: '下拉菜单',
    items: [
      { text: '选项 A', link: '/item-a' },
      { text: '选项 B', link: '/item-b' }
    ]
  }
]
```

### 侧边栏

可以为不同路径配置侧边栏：

```typescript
sidebar: {
  '/guide/': [
    {
      text: '指南',
      items: [
        { text: '介绍', link: '/guide/' },
        { text: '快速开始', link: '/guide/getting-started' }
      ]
    }
  ],
  '/api/': [
    {
      text: 'API',
      items: [
        { text: '概述', link: '/api/' },
        { text: '参考', link: '/api/reference' }
      ]
    }
  ]
}
```

### 页脚

自定义页脚信息和版权声明：

```typescript
footer: {
  message: '基于 Apache 2.0 许可发布',
  copyright: 'Copyright © 2025-present Magic Docs'
}
```

## 高级配置

### Markdown 配置

您可以配置 Markdown 选项：

```typescript
markdown: {
  // 启用代码块行号
  lineNumbers: true,
  
  // 配置外部链接
  externalLinks: {
    open: '_blank',
    rel: 'noopener noreferrer'
  }
}
```

### 构建配置

配置构建选项：

```typescript
build: {
  // 输出目录
  outDir: 'dist',
  
  // 资源目录
  assetsDir: 'assets',
  
  // 源码映射
  sourcemap: true
}
```

## 环境变量

您可以在配置中使用环境变量：

```typescript
export default defineConfig({
  title: process.env.SITE_TITLE || 'Magic Docs',
  description: process.env.SITE_DESCRIPTION || '默认描述'
})
``` 