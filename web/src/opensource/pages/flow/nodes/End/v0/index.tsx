import { Form } from "antd"
import { useForm } from "antd/lib/form/Form"
import { useMemo } from "react"
import { useMemoizedFn } from "ahooks"
import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { set, cloneDeep } from "lodash-es"
import MagicJsonSchemaEditor from "@dtyq/magic-flow/MagicJsonSchemaEditor"
import { ShowColumns } from "@dtyq/magic-flow/MagicJsonSchemaEditor/constants"
import { FormItemType } from "@dtyq/magic-flow/MagicExpressionWidget/types"
import type Schema from "@dtyq/magic-flow/MagicJsonSchemaEditor/types/Schema"
import styles from "./index.module.less"
import usePrevious from "../../../common/hooks/usePrevious"
import useCurrentNodeUpdate from "../../../common/hooks/useCurrentNodeUpdate"
import { v0Template } from "./template"

export default function End() {
	const [form] = useForm()
	const { nodeConfig, updateNodeConfig } = useFlow()

	const { currentNode } = useCurrentNode()

	const { expressionDataSource } = usePrevious()

	const onValuesChange = useMemoizedFn((changeValues) => {
		if (!currentNode || !nodeConfig || !nodeConfig[currentNode?.node_id]) return
		const currentNodeConfig = nodeConfig[currentNode?.node_id]

		Object.entries(changeValues).forEach(([changeKey, changeValue]) => {
			if (changeKey === "output") {
				set(currentNodeConfig, ["output", "form", "structure"], changeValue as Schema)
				return
			}
			set(currentNodeConfig, ["params", changeKey], changeValue)
		})

		updateNodeConfig({
			...currentNodeConfig,
		})
	})

	const initialValues = useMemo(() => {
		return {
			output: currentNode?.output?.form?.structure || v0Template.output?.form?.structure,
		}
	}, [currentNode?.output?.form?.structure])

	useCurrentNodeUpdate({
		form,
		initialValues,
	})

	return (
		<div className={styles.endWrapper}>
			<Form
				form={form}
				layout="vertical"
				initialValues={initialValues}
				onValuesChange={onValuesChange}
			>
				<Form.Item name={["output"]} className={styles.output} valuePropName="data">
					<MagicJsonSchemaEditor
						allowExpression
						expressionSource={expressionDataSource}
						displayColumns={[
							ShowColumns.Key,
							ShowColumns.Label,
							ShowColumns.Type,
							ShowColumns.Value,
						]}
						customOptions={{
							root: [FormItemType.Object],
							normal: [
								FormItemType.Number,
								FormItemType.String,
								FormItemType.Boolean,
								FormItemType.Array,
								FormItemType.Object,
							],
						}}
					/>
				</Form.Item>
			</Form>
		</div>
	)
}
