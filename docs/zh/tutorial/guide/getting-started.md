# 快速开始

本指南将帮助您设置第一个 Magic Docs 项目。

## 前置条件

在开始之前，请确保您已安装以下内容：

- Node.js（版本 16 或更高）
- npm 或 yarn 包管理器
- Git（可选，用于版本控制）

## 安装

1. 创建新项目目录：

```bash
mkdir my-magic-docs
cd my-magic-docs
```

2. 初始化新的 npm 项目：

```bash
npm init -y
```

3. 安装 Magic Docs：

```bash
npm install @magic-docs/core
```

## 基本配置

1. 创建配置文件：

```bash
touch .vitepress/config.mts
```

2. 添加以下基本配置：

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "我的 Magic Docs",
  description: "我的第一个 Magic Docs 项目",
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' }
          ]
        }
      ]
    }
  }
})
```

## 运行开发服务器

1. 在 `package.json` 中添加以下脚本：

```json
{
  "scripts": {
    "docs:dev": "vitepress dev",
    "docs:build": "vitepress build",
    "docs:preview": "vitepress preview"
  }
}
```

2. 启动开发服务器：

```bash
npm run docs:dev
```

您的文档站点将在 `http://localhost:5173` 上可用。

## 下一步

- 了解更多[配置选项](/zh/guide/configuration)
- 查看我们的[示例](/zh/examples/)
- 在 GitHub 上加入我们的社区 