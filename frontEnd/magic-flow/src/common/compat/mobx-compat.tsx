/**
 * MobX React 兼容层
 * 允许从 mobx-react 迁移到 mobx-react-lite，以便与 React 18 兼容
 */
import React from "react"
import { observer } from "mobx-react-lite"

// 导出 mobx-react-lite 中的 observer，让现有代码可以继续使用
export { observer }

// 兼容其他可能使用的API
export const Provider = ({ children }: { children: React.ReactNode }) => <>{children}</>
