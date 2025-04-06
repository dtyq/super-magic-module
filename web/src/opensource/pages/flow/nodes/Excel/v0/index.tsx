import DropdownCard from "@dtyq/magic-flow/common/BaseUI/DropdownCard"
import { useMemo } from "react"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { Form } from "antd"
import { set, cloneDeep } from "lodash-es"
import { useMemoizedFn } from "ahooks"
import MagicJSONSchemaEditorWrap from "@dtyq/magic-flow/common/BaseUI/MagicJsonSchemaEditorWrap"
import { ShowColumns } from "@dtyq/magic-flow/MagicJsonSchemaEditor/constants"
import { DisabledField } from "@dtyq/magic-flow/MagicJsonSchemaEditor/types/Schema"
import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import usePrevious from "@/opensource/pages/flow/common/hooks/usePrevious"
import { customNodeType } from "@/opensource/pages/flow/constants"
import useCurrentNodeUpdate from "@/opensource/pages/flow/common/hooks/useCurrentNodeUpdate"
import NodeOutputWrap from "@/opensource/pages/flow/components/NodeOutputWrap/NodeOutputWrap"
import { useTranslation } from "react-i18next"
import styles from "./index.module.less"
import { v0Template } from "./template"

export default function ExcelV0() {
	const { t } = useTranslation()
	const [form] = Form.useForm()
	const { currentNode } = useCurrentNode()

	const { updateNodeConfig } = useFlow()

	const { expressionDataSource } = usePrevious()

	const initialValues = useMemo(() => {
		const currentNodeParams = currentNode?.params || {}
		const cloneTemplateParams = cloneDeep(v0Template.params)
		return {
			...cloneTemplateParams,
			...currentNodeParams,
		}
	}, [currentNode?.params])

	const onValuesChange = useMemoizedFn((changeValues) => {
		if (!currentNode) return
		Object.entries(changeValues).forEach(([changeKey, changeValue]) => {
			set(currentNode, ["params", changeKey], changeValue)
		})
		updateNodeConfig({
			...currentNode,
		})
	})

	useCurrentNodeUpdate({
		form,
		initialValues,
	})

	return (
		<NodeOutputWrap className={styles.excel}>
			<Form
				form={form}
				className={styles.input}
				initialValues={initialValues}
				onValuesChange={onValuesChange}
				layout="vertical"
			>
				<DropdownCard title={t("common.input", { ns: "flow" })} height="auto">
					<Form.Item name="files">
						<MagicJSONSchemaEditorWrap
							allowExpression
							expressionSource={expressionDataSource}
							displayColumns={[
								ShowColumns.Label,
								ShowColumns.Type,
								ShowColumns.Value,
							]}
							showImport={false}
							disableFields={[DisabledField.Title, DisabledField.Type]}
							allowAdd={false}
							showTopRow
							oneChildAtLeast={false}
							customFieldsConfig={{
								// @ts-ignore
								file_name: {
									allowOperation: false,
								},
								file_url: {
									allowOperation: false,
								},
								root: {
									allowOperation: true,
									allowAdd: true,
								},
							}}
						/>
					</Form.Item>
				</DropdownCard>
			</Form>
		</NodeOutputWrap>
	)
}
