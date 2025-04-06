import { Button, Drawer, Tooltip } from "antd"
import type { MagicFlowInstance } from "@dtyq/magic-flow/MagicFlow"
import { useBoolean, useMemoizedFn } from "ahooks"
import { useMemo, useState, type MutableRefObject } from "react"
import { Form, Flex } from "antd"
import type { MagicFlow } from "@dtyq/magic-flow/MagicFlow/types/flow"
import { pick, cloneDeep, set } from "lodash-es"
import MagicJSONSchemaEditorWrap from "@dtyq/magic-flow/common/BaseUI/MagicJsonSchemaEditorWrap"
import { ShowColumns } from "@dtyq/magic-flow/MagicJsonSchemaEditor/constants"
import { ComponentTypes } from "@/types/flow"
import { useFlowStore } from "@/opensource/stores/flow"
import { useTranslation } from "react-i18next"
import styles from "./GlobalVariablesButton.module.less"
import { useCustomFlow } from "../../context/CustomFlowContext/useCustomFlow"
import { genDefaultComponent } from "../../nodes/RecordOperation/v0/helpers"

type GlobalVariablesButtonProps = {
	flowInstance?: MutableRefObject<MagicFlowInstance | null>
	flow?: MagicFlow.Flow
	Icon?: boolean
	hasEditRight: boolean
}

export default function GlobalVariablesButton({
	flowInstance,
	flow,
	Icon,
	hasEditRight,
}: GlobalVariablesButtonProps) {
	const { t } = useTranslation()
	const [form] = Form.useForm()

	const [open, { setTrue, setFalse }] = useBoolean(false)
	const [isChanged, setIsChanged] = useState(false)

	const { setCurrentFlow } = useCustomFlow()

	const { updateIsGlobalVariableChanged } = useFlowStore()

	const initialValues = useMemo(() => {
		const initValue = pick(flow, ["global_variable"])
		// @ts-ignore
		if (!initValue.global_variable) {
			return {
				global_variable: genDefaultComponent(ComponentTypes.Form, null),
			}
		}
		return initValue
	}, [flow])

	const saveGlobalVariablesToFlow = useMemoizedFn(() => {
		if (!flow) return

		const latestFlow = flowInstance?.current?.getFlow()
		if (latestFlow) {
			set(latestFlow, ["global_variable"], form.getFieldValue("global_variable"))
			updateIsGlobalVariableChanged(true)
			setCurrentFlow(cloneDeep(latestFlow))
		}
		setFalse()
	})

	const handleCancel = useMemoizedFn(() => {
		saveGlobalVariablesToFlow()
	})

	const Footer = useMemo(() => {
		return (
			<Flex justify="flex-end">
				<Tooltip title={t("common.environmentDesc", { ns: "flow" })} placement="topLeft">
					<Button
						type="primary"
						onClick={saveGlobalVariablesToFlow}
						disabled={!isChanged || !hasEditRight}
					>
						{t("common.save", { ns: "flow" })}
					</Button>
				</Tooltip>
			</Flex>
		)
	}, [hasEditRight, isChanged, saveGlobalVariablesToFlow, t])

	const DrawerTitle = useMemo(() => {
		return (
			<Flex align="center" gap={4}>
				<span>{t("common.environment", { ns: "flow" })}</span>
			</Flex>
		)
	}, [t])

	const onValuesChange = useMemoizedFn(() => {
		setIsChanged(true)
	})

	return (
		<>
			{!Icon && (
				<Button type="text" onClick={setTrue} className={styles.btn}>
					{t("common.environment", { ns: "flow" })}
				</Button>
			)}
			{Icon && (
				<Flex flex={1} onClick={setTrue}>
					{t("common.environment", { ns: "flow" })}
				</Flex>
			)}

			<Drawer
				className={styles.drawer}
				title={DrawerTitle}
				open={open}
				onClose={handleCancel}
				width="1000px"
				footer={Footer}
			>
				<Form
					form={form}
					className={styles.form}
					initialValues={initialValues}
					onValuesChange={onValuesChange}
				>
					<Form.Item name="global_variable">
						<MagicJSONSchemaEditorWrap
							oneChildAtLeast={false}
							allowExpression
							expressionSource={[]}
							displayColumns={[
								ShowColumns.Key,
								ShowColumns.Label,
								ShowColumns.Type,
								ShowColumns.Value,
								ShowColumns.Encryption,
							]}
							columnNames={{
								[ShowColumns.Key]: t("common.variableName", { ns: "flow" }),
								[ShowColumns.Type]: t("common.variableType", { ns: "flow" }),
								[ShowColumns.Value]: t("common.variableValue", { ns: "flow" }),
								[ShowColumns.Label]: t("common.showName", { ns: "flow" }),
								[ShowColumns.Encryption]: t("common.encryption", { ns: "flow" }),
								[ShowColumns.Description]: t("common.variableDesc", { ns: "flow" }),
								[ShowColumns.Required]: t("common.required", { ns: "flow" }),
							}}
						/>
					</Form.Item>
				</Form>
			</Drawer>
		</>
	)
}
