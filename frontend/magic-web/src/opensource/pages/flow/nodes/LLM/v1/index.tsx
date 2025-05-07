import { Form } from "antd"
import { useForm } from "antd/lib/form/Form"
import DropdownCard from "@dtyq/magic-flow/dist/common/BaseUI/DropdownCard"

import { useMemoizedFn } from "ahooks"
import { useNodeConfigActions } from "@dtyq/magic-flow/dist/MagicFlow/context/FlowContext/useFlow"
import { useCurrentNode } from "@dtyq/magic-flow/dist/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { set } from "lodash-es"
import MagicJSONSchemaEditorWrap from "@dtyq/magic-flow/dist/common/BaseUI/MagicJsonSchemaEditorWrap"
import { ShowColumns } from "@dtyq/magic-flow/dist/MagicJsonSchemaEditor/constants"
import { DisabledField } from "@dtyq/magic-flow/dist/MagicJsonSchemaEditor/types/Schema"
import usePrevious from "@/opensource/pages/flow/common/hooks/usePrevious"
import useCurrentNodeUpdate from "@/opensource/pages/flow/common/hooks/useCurrentNodeUpdate"
import NodeOutputWrap from "@/opensource/pages/flow/components/NodeOutputWrap/NodeOutputWrap"
import ToolSelect from "@/opensource/pages/flow/components/ToolsSelect/ToolSelect"
import MagicExpression from "@/opensource/pages/flow/common/Expression"
import { useTranslation } from "react-i18next"
import { getExpressionPlaceholder } from "@/opensource/pages/flow/utils/helpers"
import useLLM from "./hooks/useLLM"
import styles from "./index.module.less"
import useToolsChangeHandler from "./hooks/useToolsChangeHandler"
import useKnowledge from "./hooks/useKnowledge"
import useMessage from "./hooks/useMessage"
import LLMParameters from "./components/LLMParameters"
import useParameterHandler from "./hooks/useParameterHandler"
import KnowledgeDataListV1 from "./components/KnowledgeDataList/KnowledgeDataList"
import { getLLMRoleConstantOptions } from "./helpers"
import { isOnlyKnowledgeTypeChange } from "./utils/knowledgeTypeHelper"

export default function LLMV1() {
	const { t } = useTranslation()
	const [form] = useForm()
	const { updateNodeConfig } = useNodeConfigActions()

	const { currentNode } = useCurrentNode()

	const { initialValues } = useLLM()

	const { expressionDataSource } = usePrevious()

	const { handleToolsChanged } = useToolsChangeHandler()

	const { handleModelConfigChange } = useParameterHandler()

	const onValuesChange = useMemoizedFn((changeValues) => {
		console.log("🚀 ~ onValuesChange ~ changeValues:", changeValues)

		console.log("form", form.getFieldsValue(true))

		if (changeValues.model_config) {
			handleModelConfigChange(changeValues)
		} else if (changeValues.option_tools) {
			handleToolsChanged(changeValues)
		} else if (changeValues.knowledge_config) {
			// 检查是否仅变更了knowledge_type
			const [isOnlyTypeChange, typeChangeIndex] = isOnlyKnowledgeTypeChange(changeValues)
			if (isOnlyTypeChange && typeChangeIndex !== undefined) {
				// 只有knowledge_type变化，重置对应的knowledge_code
				// 延迟执行以避免与当前更新冲突
				form.setFieldValue(
					["knowledge_config", "knowledge_list", typeChangeIndex, "knowledge_code"],
					"",
				)
			}
			// 继续执行原有的知识库变更处理
			knowledgeValueChangeHandler()
		} else {
			Object.entries(changeValues).forEach(([changeKey, changeValue]) => {
				set(currentNode, ["params", changeKey], changeValue)
			})
		}

		updateNodeConfig({
			...currentNode,
		})
	})

	const { handleAdd, knowledgeValueChangeHandler } = useKnowledge({ form, onValuesChange })

	const { MessageLoadSwitch } = useMessage()

	useCurrentNodeUpdate({
		form,
		initialValues,
	})

	return (
		<NodeOutputWrap className={styles.llm}>
			<Form
				layout="vertical"
				form={form}
				onValuesChange={onValuesChange}
				initialValues={initialValues}
			>
				<LLMParameters />
				<ToolSelect form={form} />
				<KnowledgeDataListV1
					handleAdd={handleAdd}
					knowledgeListName={["knowledge_config", "knowledge_list"]}
					limitName={["knowledge_config", "limit"]}
					scoreName={["knowledge_config", "score"]}
				/>
				<div className={styles.inputBody}>
					<DropdownCard
						title={t("common.input", { ns: "flow" })}
						headerClassWrapper={styles.promptWrapper}
						height="auto"
						suffixIcon={MessageLoadSwitch}
					>
						{!currentNode?.params?.model_config?.auto_memory && (
							<Form.Item
								name={["messages"]}
								label={t("llm.loadMemory", { ns: "flow" })}
								className={styles.messageFormItem}
							>
								<MagicJSONSchemaEditorWrap
									allowExpression
									value={currentNode?.params?.messages}
									expressionSource={expressionDataSource}
									displayColumns={[
										ShowColumns.Label,
										ShowColumns.Type,
										ShowColumns.Value,
									]}
									showImport={false}
									disableFields={[DisabledField.Title, DisabledField.Type]}
									allowAdd={false}
									onlyExpression
									showTopRow
									oneChildAtLeast={false}
									customFieldsConfig={{
										// @ts-ignore
										role: {
											allowOperation: false,
											constantsDataSource: getLLMRoleConstantOptions(),
											onlyExpression: false,
										},
										content: {
											allowOperation: false,
										},
										root: {
											allowOperation: true,
											allowAdd: true,
										},
									}}
								/>
							</Form.Item>
						)}
						<MagicExpression
							label="System"
							name="system_prompt"
							placeholder={getExpressionPlaceholder(
								t("llm.systemPromptPlaceholder", { ns: "flow" }),
							)}
							dataSource={expressionDataSource}
							showExpand
						/>

						<MagicExpression
							label="User"
							name="user_prompt"
							placeholder={getExpressionPlaceholder(
								t("llm.userPromptPlaceholder", { ns: "flow" }),
							)}
							className={styles.LLMInput}
							dataSource={expressionDataSource}
							showExpand
						/>
					</DropdownCard>
				</div>
			</Form>
		</NodeOutputWrap>
	)
}
