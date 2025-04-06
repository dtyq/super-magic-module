/**
 * file、sheet、columns的数据源状态
 */
import { useMemoizedFn, useMount } from "ahooks"
import { useState } from "react"
import type { DefaultOptionType } from "antd/lib/select"
import { File, type Sheet } from "@/types/sheet"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { FlowApi } from "@/apis"

export default function useSheetDataSource() {
	const { currentNode } = useCurrentNode()

	const [sheetOptions, setSheetOptions] = useState([] as DefaultOptionType[])

	const [dateTemplate, setDateTemplate] = useState({} as { [key: string]: Sheet.Detail })

	const [spaceType, setSpaceType] = useState(File.SpaceType.Official)

	const [fileOptions, setFileOptions] = useState([] as DefaultOptionType[])

	const generateSheetOptions = useMemoizedFn(async (fileId: string) => {
		if (!fileId) return
		const response = await FlowApi.getSheets(fileId)
		const { sheets } = response

		const newOptions = Object.entries(sheets).map(([sheetId, sheet]) => {
			return {
				label: sheet.name,
				value: sheetId,
			}
		})
		setDateTemplate(sheets)
		setSheetOptions(newOptions)
	})

	useMount(() => {
		generateSheetOptions(currentNode?.params?.file_id)
	})

	const initFileInfo = useMemoizedFn(async () => {
		const fileData = await FlowApi.getFile(currentNode?.params?.file_id)
		setFileOptions([
			{
				value: fileData.id,
				label: fileData.name,
			},
		])
	})

	useMount(() => {
		if (currentNode?.params?.file_id) {
			// 如果存在file_id，应该手动新增一个option用于回显
			initFileInfo()
		}
	})

	return {
		generateSheetOptions,
		sheetOptions,
		dateTemplate,
		spaceType,
		setSpaceType,
		fileOptions,
		setFileOptions,
	}
}
