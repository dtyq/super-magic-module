import { IconVariable, IconVariableMinus, IconVariablePlus } from "@tabler/icons-react"
import { useMemo, useState } from "react"
import type Schema from "@dtyq/magic-flow/MagicJsonSchemaEditor/types/Schema"
import type { WidgetExpressionValue } from "@dtyq/magic-flow/common/BaseUI/MagicExpressionWrap"
import { VariableTypes } from "./constants"

export default function useVariable() {
	const variableTypeList = useMemo(() => {
		return [
			{
				icon: (
					<IconVariable
						stroke={1}
						color="white"
						size={16}
						style={{ background: "#315CEC", padding: "2px" }}
					/>
				),
				label: "赋值",
				value: VariableTypes.NewVariable,
			},

			{
				icon: (
					<IconVariableMinus
						stroke={1}
						color="white"
						size={16}
						style={{ background: "#FF7D00", padding: "2px" }}
					/>
				),
				label: "弹出第一个值",
				value: VariableTypes.PopFirst,
			},

			{
				icon: (
					<IconVariablePlus
						stroke={1}
						color="white"
						size={16}
						style={{ background: "#7E57EA", padding: "2px" }}
					/>
				),
				label: "追加新值",
				value: VariableTypes.Push,
			},
		]
	}, [])

	/** 新变量 */
	const [newVariables, setNewVariables] = useState<Schema>()

	/** 弹出数组第一个元素 */
	const [popExpression, setPopExpression] = useState<WidgetExpressionValue>({
		id: "dd",
		version: "1",
		type: "form",
		// @ts-ignore
		structure: null,
	})

	/** 新添元素 */
	const [pushValues, setPushValues] = useState<Schema>()

	return {
		variableTypeList,
		newVariables,
		setNewVariables,
		popExpression,
		setPopExpression,
		pushValues,
		setPushValues,
	}
}
