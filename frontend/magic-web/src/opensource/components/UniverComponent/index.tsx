/* eslint-disable import/no-unresolved */
import React, { useEffect, useRef, useState } from "react"
import { Button, Typography, Spin } from "antd"
import "./styles.css"

// 引入预设包
import { Univer, LocaleType, merge } from "@univerjs/core"
import { defaultTheme } from "@univerjs/design"

import { UniverUIPlugin } from "@univerjs/ui"
import { UniverSheetsPlugin } from "@univerjs/sheets"
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui"
import { UniverDocsPlugin } from "@univerjs/docs"
import { UniverDocsUIPlugin } from "@univerjs/docs-ui"
import { FUniver } from "@univerjs/core/facade"

// 引入中文语言包

// 引入CSS样式
// import "@univerjs/presets/lib/styles/preset-slides-core.css"

import DesignZhCN from "@univerjs/design/locale/zh-CN"
import UIZhCN from "@univerjs/ui/locale/zh-CN"
import SheetsZhCN from "@univerjs/sheets/locale/zh-CN"
import SheetsUIZhCN from "@univerjs/sheets-ui/locale/zh-CN"
import DocsUIZhCN from "@univerjs/docs-ui/locale/zh-CN"

// 工具函数导入
import { transformData } from "./utils"
import { useAsyncEffect } from "ahooks"
import overrideLocales from "./locales"

import "@univerjs/sheets/facade"
// 核心样式
import "@univerjs/design/lib/index.css"
import "@univerjs/ui/lib/index.css"

// 根据fileType选择导入
import "@univerjs/sheets-ui/lib/index.css" // 表格样式
import "@univerjs/docs-ui/lib/index.css" // 文档样式
// import "@univerjs/slides-ui/lib/index.css"  // 幻灯片样式(如果需要)

const { Text } = Typography

// 导出组件接口
export interface UniverComponentProps {
	data: any
	fileType: "sheet" | "slide" | "doc"
	fileName: string
	width?: number | string
	height?: number | string
	mode?: "readonly" | "edit"
}

/**
 * UniverComponent - 基于Univer库的文档、表格和幻灯片查看/编辑组件
 */
export const UniverComponent: React.FC<UniverComponentProps> = ({
	data,
	fileType,
	fileName = "未命名文件",
	width = "100%",
	height = "100%",
}) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const univerAPIRef = useRef<any>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		// 组件卸载时清理资源
		return () => {
			if (univerAPIRef.current) {
				univerAPIRef.current.dispose()
				univerAPIRef.current = null
			}
		}
	}, [])

	useAsyncEffect(async () => {
		if (!containerRef.current) return

		setLoading(true)
		setError(null)

		// 如果已经有实例，先销毁
		if (univerAPIRef.current) {
			univerAPIRef.current.dispose()
			univerAPIRef.current = null
		}

		try {
			// 转换数据为Univer支持的格式
			const univerData = await transformData(data, fileType, fileName)

			console.log(
				"univerData",
				univerData,
				fileType,
				"fileType",
				fileName,
				"fileNamefileName",
				data,
				"data",
			)

			const univer = new Univer({
				locale: LocaleType.ZH_CN,
				locales: {
					[LocaleType.ZH_CN]: merge(
						{},
						DesignZhCN,
						UIZhCN,
						SheetsZhCN,
						SheetsUIZhCN,
						DocsUIZhCN,
						overrideLocales["zh-CN"],
					),
				},
				theme: defaultTheme,
			})
			const univerAPI = FUniver.newAPI(univer)

			univer.registerPlugin(UniverUIPlugin, {
				container: containerRef.current,
			})
			univer.registerPlugin(UniverDocsPlugin)
			univer.registerPlugin(UniverDocsUIPlugin)

			univer.registerPlugin(UniverSheetsPlugin)
			univer.registerPlugin(UniverSheetsUIPlugin, {
				menu: {
					"sheet.command.set-range-bold": {
						hidden: true,
					},
					"sheet.command.set-range-italic": {
						hidden: true,
					},
					"sheet.menu.paste-special": {
						hidden: true,
					},
					"sheet.command.paste": {
						hidden: true,
					},
					"sheet.menu.clear-selection": {
						hidden: true,
					},
					"sheet.contextMenu.permission": {
						hidden: true,
					},
					"sheet.operation.insert-hyper-link": {
						hidden: true,
					},
					"sheet.menu.sheet-frozen": {
						hidden: true,
					},
				},
			})

			switch (fileType) {
				case "sheet":
					break

				case "doc":
					break

				case "slide":
					// presets.push(
					// 	UniverSlidesCorePreset({
					// 		container: containerRef.current,
					// 	}),
					// )
					// locales = {
					// 	[LocaleType.ZH_CN]: merge({}, UniverPresetSlidesCoreZhCN),
					// }
					break

				default:
					throw new Error(`不支持的文件类型: ${fileType}`)
			}

			// 保存API引用
			univerAPIRef.current = univerAPI

			// 创建对应类型的文档实例
			if (fileType === "sheet") {
				univerAPI.createWorkbook(univerData)

				if (univerData) {
					const permission = univerAPI.getWorkbook(univerData.id)?.getPermission()
					const workbookId = univerAPI.getWorkbook(univerData.id)?.getId()
					if (workbookId) {
						permission?.setWorkbookPermissionPoint(
							workbookId,
							permission.permissionPointsDefinition.WorkbookEditablePermission,
							false,
						)
					}
				}
			} else if (fileType === "doc") {
				// univerAPI.createDocument(univerData)
			} else if (fileType === "slide") {
				// univerAPI.createPresentation(univerData)
			}

			// 实例创建完成后，设置初始只读状态
			setLoading(false)

			// 设置全局标志，表示Univer库已加载
			if (typeof window !== "undefined") {
				;(window as any).__UNIVER_LIBRARIES_LOADED__ = true
			}
		} catch (err: any) {
			console.error("初始化Univer组件失败:", err)
			setError(err.message || "加载文件失败")
			setLoading(false)
		}
	}, [data])

	useEffect(() => {
		// 组件挂载时添加 overscroll-behavior-x: none
		document.documentElement.style.overscrollBehaviorX = "none"

		// 组件卸载时移除 overscroll-behavior-x
		return () => {
			document.documentElement.style.overscrollBehaviorX = ""
		}
	}, []) // 空依赖数组确保只在组件挂载和卸载时执行

	// 渲染错误状态
	if (error) {
		return (
			<div className="univer-error-container" style={{ width, height }}>
				<Text type="danger">加载失败: {error}</Text>
				<Button type="primary" onClick={() => window.location.reload()}>
					重新加载
				</Button>
			</div>
		)
	}

	// 渲染加载状态或Univer容器
	return (
		<div className="univer-component-wrapper" style={{ width, height }}>
			{loading && (
				<div className="univer-loading-container">
					<Spin tip="加载中..." />
				</div>
			)}
			<div
				ref={containerRef}
				className="univer-container"
				style={{
					width: "100%",
					height: "100%",
					visibility: loading ? "hidden" : "visible",
				}}
			/>
		</div>
	)
}

export default UniverComponent
