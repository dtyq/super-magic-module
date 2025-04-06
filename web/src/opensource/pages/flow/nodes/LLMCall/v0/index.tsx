import { Form } from "antd"
import { useForm } from "antd/lib/form/Form"
import DropdownCard from "@dtyq/magic-flow/common/BaseUI/DropdownCard"

import { useMemoizedFn } from "ahooks"
import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { set } from "lodash-es"
import { useMemo } from "react"
import MagicJSONSchemaEditorWrap from "@dtyq/magic-flow/common/BaseUI/MagicJsonSchemaEditorWrap"
import { ShowColumns } from "@dtyq/magic-flow/MagicJsonSchemaEditor/constants"
import { DisabledField } from "@dtyq/magic-flow/MagicJsonSchemaEditor/types/Schema"
import { cx } from "antd-style"
import { ExpressionMode } from "@dtyq/magic-flow/MagicExpressionWidget/constant"

import MagicExpression from "../../../common/Expression"
import usePrevious from "../../../common/hooks/usePrevious"
import LLMParameters from "./components/LLMParameters"
import useLLM from "./hooks/useLLM"
import styles from "./index.module.less"
import { getLLMModelOptions, getLLMRoleConstantOptions } from "./constants"
import ToolSelect from "../../../components/ToolsSelect/ToolSelect"
import NodeOutputWrap from "../../../components/NodeOutputWrap/NodeOutputWrap"
import useCurrentNodeUpdate from "../../../common/hooks/useCurrentNodeUpdate"
import useToolsChangeHandlerV0 from "../../LLM/v0/hooks/useToolsChangeHandler"

export default function LLMCallV0() {
	const [form] = useForm()
	const { nodeConfig, notifyNodeChange } = useFlow()

	const { currentNode } = useCurrentNode()

	const { LLMOptions, LLMValue, onLLMValueChange, initialValues } = useLLM({ form })

	const { expressionDataSource } = usePrevious()

	const { handleToolsChanged } = useToolsChangeHandlerV0()

	const onValuesChange = useMemoizedFn((changeValues) => {
		if (!currentNode || !nodeConfig || !nodeConfig[currentNode?.node_id]) return
		const currentNodeConfig = nodeConfig[currentNode?.node_id]

		// 特殊处理llm字段
		if (changeValues.llm) {
			const { model, ...rest } = changeValues.llm
			set(currentNodeConfig, ["params", "model"], model)
			if (rest && Object.keys(rest).length)
				set(currentNodeConfig, ["params", "model_config"], rest)
		} else if (changeValues.option_tools) {
			handleToolsChanged(changeValues)
		} else {
			Object.entries(changeValues).forEach(([changeKey, changeValue]) => {
				set(currentNodeConfig, ["params", changeKey], changeValue)
			})
		}

		notifyNodeChange?.()
		// updateNodeConfig({
		// 	...currentNodeConfig,
		// })
	})

	const formValues = form.getFieldsValue()

	const modelExpressionSource = useMemo(() => {
		const constantModelSource = getLLMModelOptions(LLMOptions)
		return [...constantModelSource, ...expressionDataSource]
	}, [LLMOptions, expressionDataSource])

	useCurrentNodeUpdate({
		form,
		initialValues,
	})

	return (
		<NodeOutputWrap className={styles.llm}>
			<Form
				form={form}
				layout="vertical"
				onValuesChange={onValuesChange}
				initialValues={initialValues}
			>
				<MagicExpression
					label="模型选择"
					name="model"
					dataSource={modelExpressionSource}
					mode={ExpressionMode.Common}
					showCount={false}
					minHeight="auto"
					className={styles.modelSelect}
					multiple={false}
					placeholder="请输入@选择变量"
				/>
				<Form.Item name="llm" label="模型配置" className={styles.formItem}>
					<LLMParameters
						LLMValue={LLMValue}
						onChange={onLLMValueChange}
						options={LLMOptions}
						formValues={formValues}
					/>
					{/* <LLMSelect value={inputValue} onChange={onChange} options={LLMOptions} /> */}
				</Form.Item>
				<ToolSelect form={form} />
				<div className={styles.inputHeader}>输入</div>
				<div className={styles.inputBody}>
					<DropdownCard
						title="消息记忆加载"
						headerClassWrapper={cx(styles.promptWrapper, styles.promptWrapperTop)}
						height="auto"
						style={{ marginBottom: "12px" }}
					>
						<Form.Item name={["messages"]}>
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
					</DropdownCard>
					<DropdownCard
						title="提示词"
						headerClassWrapper={styles.promptWrapper}
						height="auto"
					>
						<MagicExpression
							label="System"
							name="system_prompt"
							placeholder={`大模型固定的引导词，通过调整内容引导大模型聊天方向，提示词内容会被固定在上下文的开头，支持使用"@"添加变量`}
							dataSource={expressionDataSource}
						/>

						<MagicExpression
							label="User"
							name="user_prompt"
							placeholder={`大模型固定的引导词，通过调整内容引导大模型聊天方向，提示词内容会被固定在上下文的开头，支持使用"@"添加变量`}
							className={styles.LLMInput}
							dataSource={expressionDataSource}
						/>
					</DropdownCard>
				</div>
			</Form>
		</NodeOutputWrap>
	)
}
