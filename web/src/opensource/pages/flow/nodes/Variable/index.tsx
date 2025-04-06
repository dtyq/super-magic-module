import { useState } from "react"
import MagicJsonSchemaEditor from "@dtyq/magic-flow/MagicJsonSchemaEditor"
import SourceHandle from "@dtyq/magic-flow/MagicFlow/nodes/common/Handle/Source"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import DropdownCard from "@dtyq/magic-flow/common/BaseUI/DropdownCard"
import MagicExpressionWrap from "@dtyq/magic-flow/common/BaseUI/MagicExpressionWrap"
import { ExpressionMode } from "@dtyq/magic-flow/MagicExpressionWidget/constant"
import { ShowColumns } from "@dtyq/magic-flow/MagicJsonSchemaEditor/constants"
import MagicRadioButtons from "./components/MagicRadioButtons"
import styles from "./index.module.less"
import useVariable from "./useVariable"
import { VariableTypes } from "./constants"
import usePrevious from "../../common/hooks/usePrevious"

export default function Variable() {
	const {
		variableTypeList,
		newVariables,
		setNewVariables,
		popExpression,
		setPopExpression,
		pushValues,
		setPushValues,
	} = useVariable()

	const { currentNode } = useCurrentNode()

	const [variableType, setVariableType] = useState(VariableTypes.NewVariable)

	const { expressionDataSource } = usePrevious()

	return (
		<div className={styles.variables}>
			<div className={styles.variableType}>
				<MagicRadioButtons
					options={variableTypeList}
					itemWidth="285px"
					value={variableType}
					onChange={setVariableType}
				/>
			</div>
			<div className={styles.variableBody}>
				<DropdownCard title="输入" height="auto">
					{variableType === VariableTypes.NewVariable && (
						<MagicJsonSchemaEditor
							data={newVariables}
							onChange={setNewVariables}
							allowExpression
							expressionSource={expressionDataSource}
						/>
					)}
					{variableType === VariableTypes.PopFirst && (
						<MagicExpressionWrap
							onlyExpression
							mode={ExpressionMode.Common}
							dataSource={expressionDataSource}
							placeholder="请选择"
							value={popExpression}
							onChange={setPopExpression}
						/>
					)}

					{variableType === VariableTypes.Push && (
						<MagicJsonSchemaEditor
							data={pushValues}
							onChange={setPushValues}
							allowExpression
							expressionSource={expressionDataSource}
							displayColumns={[ShowColumns.Key, ShowColumns.Value]}
						/>
					)}
				</DropdownCard>
				{/* <SourceHandle
					type="target"
					isConnectable
					nodeId={currentNode?.node_id || ""}
					isSelected
				/> */}
			</div>
			<div className={styles.variableFooter}>
				<span className={styles.outputLabel}>输出</span>
				<SourceHandle
					type="source"
					isConnectable
					nodeId={currentNode?.node_id || ""}
					isSelected
				/>
			</div>
		</div>
	)
}
