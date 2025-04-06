import { useCallback, useMemo } from "react"
import { get } from "lodash-es"
import usePrevious from "@/opensource/pages/flow/common/hooks/usePrevious"
import TSIcon from "@dtyq/magic-flow/common/BaseUI/TSIcon"
import { Schema, type Sheet } from "@/types/sheet"
import type { WidgetExpressionValue } from "@dtyq/magic-flow/common/BaseUI/MagicExpressionWrap"
import MagicExpressionWrap from "@dtyq/magic-flow/common/BaseUI/MagicExpressionWrap"
import { schemaType2Icon } from "../constants"
import "./RecordItem.less"
import { getExpressionRenderConfig } from "../helpers"

type RecordItemProps = {
	column: Sheet.Column
	delRecord: (colId: string) => void
	value?: WidgetExpressionValue
	onChange?: (val: WidgetExpressionValue) => void
}

const RecordItem = ({ column, value, delRecord, onChange }: RecordItemProps) => {
	const displayValue = useMemo(() => {
		return value
	}, [value])

	const updateValue = useCallback(
		(val: WidgetExpressionValue) => {
			onChange?.(val)
		},
		[onChange],
	)

	const isMultiple = useMemo(() => {
		// 多选、文本字段 可以多选
		if ([Schema.MULTIPLE, Schema.TEXT].includes(column.columnType)) return true

		// 成员开启多选 可以多选
		if (column.columnType === Schema.MEMBER && get(column, ["columnProps", "multiple"], false))
			return true

		// 单、双向关联开启多选 可多选
		if (
			[Schema.QUOTE_RELATION, Schema.MUTUAL_RELATION, Schema.MEMBER].includes(
				column?.columnType,
			) &&
			get(column, ["columnProps", "multiple"], false)
		) {
			return true
		}

		return false
	}, [column])

	const { expressionDataSource } = usePrevious()

	const renderConfig = useMemo(() => {
		return getExpressionRenderConfig(column)
	}, [column])

	return (
		<div className="magic-flow-record-item">
			<div className="title">
				<div>
					<TSIcon type={schemaType2Icon[column.columnType] || ""} />
					<span className="text">{column.label}</span>
				</div>
				<TSIcon type="ts-trash" onClick={() => delRecord(column.id)} />
			</div>
			<MagicExpressionWrap
				value={displayValue}
				columnType={column.columnType}
				onChange={updateValue}
				multiple={isMultiple}
				// @ts-ignore
				renderConfig={renderConfig}
				dataSource={expressionDataSource}
			/>
		</div>
	)
}

export default RecordItem
