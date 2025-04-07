/**
 * MobX React 兼容层 - 从 mobx-react 迁移到 mobx-react-lite
 * 为了与 React 17 兼容
 */

import React from 'react'
import { observer as baseObserver } from 'mobx-react-lite'

/**
 * 为了兼容React18，此处改为使用mobx-react-lite
 * mobx-react已不维护
 * @see https://github.com/mobxjs/mobx-react#mobx-react-lite
 */

// 导出observer以支持现有代码
export const observer = baseObserver

/**
 * 简单的Provider，支持 <Provider store={store}> 语法
 */
export const Provider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  return React.createElement(React.Fragment, null, children)
}

// 导出更多可能需要的API
export default {
  observer,
  Provider
}; 