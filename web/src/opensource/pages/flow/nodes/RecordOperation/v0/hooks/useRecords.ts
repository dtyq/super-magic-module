import { get, cloneDeep, set } from "lodash-es"
import { useMemo } from "react"
import { useMemoizedFn, useMount, useResetState } from "ahooks"
import type { FormInstance } from "antd"
import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import type { Sheet } from "@/types/sheet"
import { getDefaultConstValue } from "@/opensource/pages/flow/components/ConditionContainer/constants"
import type { WidgetExpressionValue } from "@dtyq/magic-flow/common/BaseUI/MagicExpressionWrap"
import { NOT_SUPPORT_COLUMNS } from "../constants"

type RecordsProps = {
	form: FormInstance<any>
	dateTemplate: Record<string, Sheet.Detail>
}

export default function useRecords({ form, dateTemplate }: RecordsProps) {
	const { updateNodeConfig } = useFlow()

	const { currentNode } = useCurrentNode()

	const [displayValue, setDisplayValue, resetDisplayValue] = useResetState(
		{} as Record<string, WidgetExpressionValue>,
	)

	const columns = useMemo(() => {
		const sheetId = currentNode?.params?.sheet_id
		return get(dateTemplate, [sheetId, "content", "columns"], {} as Sheet.Content["columns"])
	}, [currentNode?.params?.sheet_id, dateTemplate])

	const addRecord = useMemoizedFn(({ key }) => {
		if (!currentNode) return
		const { id } = columns[key]
		const copyValue = cloneDeep(displayValue)
		const updatedDisplayValue = {
			...copyValue,
			[id]: getDefaultConstValue(),
		}
		setDisplayValue(updatedDisplayValue)
		form.setFieldsValue({
			params: {
				columns: updatedDisplayValue,
			},
		})
		set(currentNode, ["params", "columns"], updatedDisplayValue)
		updateNodeConfig({
			...currentNode,
		})
	})

	const menuOptions: Sheet.Column[] = useMemo(() => {
		if (!columns) return []
		const checkedColumnIds = Object.keys(displayValue)
		return Object.keys(columns)
			.filter(
				(colId) =>
					!NOT_SUPPORT_COLUMNS.includes(columns[colId]?.columnType) &&
					!checkedColumnIds.includes(colId),
			)
			.map((colId) => columns[colId])
	}, [columns, displayValue])

	const delRecord = useMemoizedFn((colId: string) => {
		if (!currentNode) return
		const copyValue = cloneDeep(displayValue)
		delete copyValue[colId]
		setDisplayValue({
			...copyValue,
		})
		form.setFieldsValue({
			params: {
				columns: copyValue,
			},
		})
		set(currentNode, ["params", "columns"], copyValue)
		updateNodeConfig({
			...currentNode,
		})
	})

	// 初始化列配置渲染回显
	useMount(() => {
		setDisplayValue(get(currentNode, ["params", "columns"], {}))
	})

	return {
		columns,
		displayValue,
		setDisplayValue,
		addRecord,
		menuOptions,
		delRecord,
		resetDisplayValue,
	}
}
