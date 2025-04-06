import { Form } from "antd"
import { useMemo } from "react"
import { useMemoizedFn } from "ahooks"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import { set } from "lodash-es"
import type { Knowledge } from "@/types/knowledge"
import MagicExpressionWrap from "@dtyq/magic-flow/common/BaseUI/MagicExpressionWrap"
import { ExpressionMode } from "@dtyq/magic-flow/MagicExpressionWidget/constant"
import { customNodeType, templateMap } from "@/opensource/pages/flow/constants"
import NodeOutputWrap from "@/opensource/pages/flow/components/NodeOutputWrap/NodeOutputWrap"
import usePrevious from "@/opensource/pages/flow/common/hooks/usePrevious"
import useCurrentNodeUpdate from "@/opensource/pages/flow/common/hooks/useCurrentNodeUpdate"
import { useTranslation } from "react-i18next"
import { getExpressionPlaceholder } from "@/opensource/pages/flow/utils/helpers"
import styles from "./KnowledgeSearch.module.less"
import { getDefaultKnowledge } from "./helpers"
import KnowledgeDataList from "./components/KnowledgeDataList/KnowledgeDataList"

export default function KnowledgeSearchV0() {
	const { t } = useTranslation()
	const [form] = Form.useForm()

	const { currentNode } = useCurrentNode()

	const { updateNodeConfig } = useFlow()

	const initialValues = useMemo(() => {
		return {
			...templateMap[customNodeType.KnowledgeSearch].v0.params,
			...currentNode?.params,
		}
	}, [currentNode?.params])

	const onValuesChange = useMemoizedFn(() => {
		if (!currentNode) return
		Object.entries(form.getFieldsValue()).forEach(([changeKey, changeValue]) => {
			if (changeKey === "knowledge_list") {
				changeValue = (changeValue as Knowledge.TeamshareKnowledgeItem[]).filter((v) => !!v)
			}
			set(currentNode, ["params", changeKey], changeValue)
		})
		updateNodeConfig({ ...currentNode })
	})

	const handleAdd = useMemoizedFn(() => {
		const newKnowledge = getDefaultKnowledge() // 获取默认的知识项
		form.setFieldsValue({
			knowledge_list: [...(currentNode?.params?.knowledge_list || []), newKnowledge],
		})
		// 手动触发 onValuesChange
		onValuesChange()
	})

	const { expressionDataSource } = usePrevious()

	useCurrentNodeUpdate({
		form,
		initialValues,
	})

	return (
		<NodeOutputWrap className={styles.knowledgeSearch}>
			<Form
				layout="vertical"
				form={form}
				initialValues={initialValues}
				onValuesChange={onValuesChange}
			>
				<Form.Item
					name="query"
					label={t("common.searchKeywords", { ns: "flow" })}
					className={styles.formItem}
				>
					<MagicExpressionWrap
						placeholder={getExpressionPlaceholder(
							t("knowledgeSearch.keywordDesc", { ns: "flow" }),
						)}
						dataSource={expressionDataSource}
						onlyExpression
						mode={ExpressionMode.TextArea}
					/>
				</Form.Item>
				<KnowledgeDataList handleAdd={handleAdd} />
			</Form>
		</NodeOutputWrap>
	)
}
