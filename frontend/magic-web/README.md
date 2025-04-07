# Magic

## 开发环境

-   Node.js : 使用最新稳定版本(v18+)
-   pnpm: v9+

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行测试
pnpm test
```

## 技术栈

-   React
-   Vite
-   Zustance
-   SWR
-   Antd

## 开发规范

### 代码风格

-   项目使用 ESLint 和 Prettier 进行代码格式化
-   提交代码前请确保通过所有 lint 检查
-   组件文件使用 PascalCase 命名
-   工具函数文件使用 camelCase 命名

### 组件开发规范

#### 样式编写

项目样式遵循 `ant-design@5.x` 中 `CSS-in-JS` 的使用与设计，在不了解相关规范使用前提下请阅读 [`antd-style` 使用规范](https://ant-design.github.io/antd-style/guide/create-styles)，其中结合项目的规范应该遵守以下规则：

-   单个组件、视图下样式与组件分离，以组件为案例样式与组件分离：`useStyle.ts`、`Component.tsx`。
-   关于样式编写，禁止使用 `less`、`styled-components` 等其他第三方样式插件/样式模块化方案。
-   关于样式插件，禁止使用 `classnames`、`clsx` 等插件，统一使用 `const { styles, cx } = useStyle();` 中的 `cx` 完成样式的激活。

#### 公共组件

-   基础组件：基于 antd 封装了部分基础组件，完善了组件样式，或扩展了参数接口，文件目录位于 `src/components/base`, 请优先使用
-   业务组件：封装了日常业务中常用的组件，文件目录位于 `src/components/business`

#### 组件开发原则

-   组件应该是可复用的，避免过度耦合业务逻辑
-   组件应该有完整的类型定义
-   复杂组件需要编写使用文档
-   组件应遵循单一职责原则

### Git 工作流

-   主分支：`released`（TODO）
-   预发布分支：`pre-release`（TODO）
-   测试分支：`master`
-   功能分支：`feature/功能名称`
-   修复分支：`hotfix/问题描述`

提交信息格式：

```
type(scope): commit message

- type: feat|fix|docs|style|refactor|test|chore
- scope: 影响范围
- message: 提交说明
```

### 单元测试

测试框架：[Vitest](https://cn.vitest.dev/)

在满足功能开发的基础上，尤其对于工具函数，尽可能的补充足够多的代码单元测试用例，以提交代码健壮性，减少后续重构的维护成本。

单元测试文件放置在该函数所在文件目录下的 `__tests__` 文件夹中，以 `{filename}.test.ts` 的方式命名。

#### 测试规范

-   每个工具函数都应该有对应的测试用例
-   测试用例应该覆盖正常流程和异常流程
-   测试描述应该清晰明了
-   使用 `describe` 和 `it` 组织测试用例

### 开发建议

1. 在开始开发前，请确保已经阅读完本文档
2. 遇到问题先查看项目文档和相关依赖的官方文档
3. 开发新功能时，建议先写好类型定义
4. 代码提交前进行自测，确保功能正常且测试用例通过

## Vscode 插件安装推荐

-   i18n Ally
-   Vitest, Vitest Runner
-   Git Graph
