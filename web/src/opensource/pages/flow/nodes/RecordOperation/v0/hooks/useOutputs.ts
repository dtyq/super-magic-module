/**
 * 根据不同的多维表格类型以及字段生成对应的节点output
 *
 * column类型 -> schema类型:
 * 	成员 -> object
 *  多选 -> Array<string>
 *  单选 -> Array<string>
 *  多行文本 -> string
 *  链接 -> string
 *  数值 -> number
 *  日期 -> string
 *  Checkbox -> boolean
 */

import { useMemoizedFn } from "ahooks"
import type { Sheet } from "@/types/sheet"
import type Schema from "@dtyq/magic-flow/MagicJsonSchemaEditor/types/Schema"
import { FormItemType } from "@dtyq/magic-flow/MagicExpressionWidget/types"
import type { RecordType } from ".."
import {
	convertColumnsToJSONSchema,
	generateArrayForm,
	genFormComponent,
	getDefaultSchemaWithDefaultProps,
} from "../helpers"

type OutputsProps = {
	type: RecordType
}

export default function useOutputs({ type }: OutputsProps) {
	const handleMultiple = useMemoizedFn((schema: Schema) => {
		const wrapper = getDefaultSchemaWithDefaultProps(FormItemType.Object, {
			title: "",
			// @ts-ignore
			key: "root",
		})
		const countField = getDefaultSchemaWithDefaultProps(FormItemType.Number, {
			title: "字段条数",
			// @ts-ignore
			key: "count",
		})
		// console.log("generateArrayForm(schema)", generateArrayForm(schema))
		const columnsField = getDefaultSchemaWithDefaultProps(FormItemType.Object, {
			title: "列记录",
			// @ts-ignore
			key: "columns",
			properties: generateArrayForm(schema),
		})

		// console.log("generateArrayForm(schema)", generateArrayForm(schema))
		const recordsField = getDefaultSchemaWithDefaultProps(FormItemType.Object, {
			title: "行记录",
			// @ts-ignore
			key: "records",
			properties: {},
		})
		wrapper.properties = {
			count: countField,
			columns: columnsField,
			records: recordsField,
		}
		return wrapper
	})

	const generateOutput = useMemoizedFn((columns: Sheet.Content["columns"]) => {
		if (type === "delete") return null
		let schema = convertColumnsToJSONSchema(columns)

		// 除了新增，其他的output可能是多条
		if (type === "update" || type === "search") {
			schema = handleMultiple(schema)
		}

		const output = {
			widget: null,
			form: genFormComponent(schema),
		}

		return output
	})

	return {
		generateOutput,
	}
}
