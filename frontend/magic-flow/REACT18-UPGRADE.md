# React 18 升级指南

本文档描述了将 magic-flow 包从 React 17 升级到 React 18 的主要变更和注意事项。

## 主要变更

1. React 和 ReactDOM 版本从 17.0.2 升级到 18.3.1
2. mobx-react 依赖被替换为 mobx-react-lite 4.0.3
3. 添加了 React 18 兼容的类型声明和辅助函数

## 代码修改

1. 导入方式变更：
   - 所有从 `mobx-react` 的导入都被替换为 `common/compat/mobx-compat`
   - 提供了兼容层，确保现有代码可以平滑过渡

2. 渲染方式变更：
   - React 18 使用 `createRoot` API 替代 `ReactDOM.render`
   - 提供了示例文件 `src/common/examples/React18Entry.tsx` 展示如何使用新 API

## 注意事项

1. **批量更新**：React 18 将批量自动对所有更新，以提高性能。这会影响代码中依赖 DOM 立即更新的部分。

2. **严格模式变化**：`<StrictMode>` 在开发中会进行额外的双重渲染，以便检查组件的纯度。这可能会暴露组件中的副作用问题。

3. **自动批处理**：所有状态更新都会被自动批处理，这可能会改变组件的更新行为。

4. **新的 Suspense 功能**：可以利用 React 18 的新 Suspense 功能进行数据加载和代码分割。

5. **并发渲染**：可以使用 React 18 的并发特性，如 `useTransition` 和 `useDeferredValue`。

## 迁移路径

1. 所有使用 `mobx-react` 的组件都应该改为使用 `mobx-react-lite`。
2. 所有使用 `ReactDOM.render` 的代码都应该改为使用 `createRoot`。
3. 检查使用了 `React.FC` 类型的组件，移除默认的 `children` 属性。

## 推荐阅读

1. [React 18 官方文档](https://reactjs.org/docs/getting-started.html)
2. [React 18 升级指南](https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html)
3. [MobX React Lite 文档](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite) 