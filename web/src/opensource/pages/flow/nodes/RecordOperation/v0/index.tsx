import { Dropdown, Form, Menu, Tag } from "antd"
import MagicSelect from "@dtyq/magic-flow/common/BaseUI/Select"
import { cloneDeep, set, get } from "lodash-es"
import { useMemoizedFn, useUpdateEffect } from "ahooks"
import TSIcon from "@dtyq/magic-flow/common/BaseUI/TSIcon"
import { IconPlus } from "@tabler/icons-react"
import { cx } from "antd-style"
import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { useMemo } from "react"
import DropdownCard from "@dtyq/magic-flow/common/BaseUI/DropdownCard"
import JSONSchemaRenderer from "@dtyq/magic-flow/common/BaseUI/JSONSchemaRenderer"
import { useTranslation } from "react-i18next"
import styles from "./styles/index.module.less"
import { NOT_SUPPORT_COLUMNS, schemaType2Icon } from "./constants"
import RecordItem from "./components/RecordItem"
import useRecords from "./hooks/useRecords"
import useConditions from "./hooks/useConditions"
import useType from "./hooks/useType"
import useOutputs from "./hooks/useOutputs"
import useSheetDataSource from "./hooks/useSheetDataSource"
import FileSelectDropdownRenderer from "./components/FileSelectDropdown/FileSelectDropdown"
import useCurrentNodeUpdate from "../../../common/hooks/useCurrentNodeUpdate"

export type RecordType = "add" | "update" | "search" | "delete"

type RecordProps = {
	type: RecordType
}

export default function RecordOperationV0({ type }: RecordProps) {
	const { t } = useTranslation()
	const [form] = Form.useForm()

	const { updateNodeConfig } = useFlow()

	const { currentNode } = useCurrentNode()

	const { hasColumns, hasFilter } = useType({ type })

	const { generateOutput } = useOutputs({ type })

	const {
		generateSheetOptions,
		sheetOptions,
		dateTemplate,
		spaceType,
		setSpaceType,
		fileOptions,
		setFileOptions,
	} = useSheetDataSource()

	const { displayValue, resetDisplayValue, columns, delRecord, addRecord, menuOptions } =
		useRecords({ form, dateTemplate })

	useUpdateEffect(() => {
		const cloneCurrentNode = cloneDeep(currentNode)
		if (!cloneCurrentNode) return
		set(cloneCurrentNode, ["params", "columns"], displayValue)
	}, [displayValue])

	const onValuesChange = useMemoizedFn(async (changeValues) => {
		// console.log("changeValues", changeValues)
		if (!currentNode) return
		// 更新了文件, 需要清空字段配置
		if (changeValues?.file_id) {
			set(currentNode, ["params"], {
				...get(currentNode, ["params"], {}),
				file_id: changeValues.file_id,
				sheet_id: null,
				columns: {},
			})
			updateNodeConfig({ ...currentNode })
			resetDisplayValue()
			generateSheetOptions(changeValues?.file_id)
			return
		}
		// 更新了数据表, 需要清空字段配置
		if (changeValues?.sheet_id) {
			set(currentNode, ["params", "columns"], {})
			set(currentNode, ["params", "sheet_id"], changeValues.sheet_id)
			const targetSheetColumns = get(
				dateTemplate,
				[changeValues.sheet_id, "content", "columns"],
				{},
			)
			const currentSheetColumns = await Promise.resolve(targetSheetColumns)
			const output = generateOutput(currentSheetColumns)
			set(currentNode, ["output"], output)
			updateNodeConfig({ ...currentNode })
			resetDisplayValue()
			return
		}
		// 修改了某个字段的值
		if (changeValues?.columns) {
			Object.entries(changeValues?.columns).forEach(([columnId, columnValue]) => {
				set(currentNode, ["params", "columns", columnId], columnValue)
			})
			updateNodeConfig({ ...currentNode })
			return
		}
		Object.entries(changeValues).forEach(([key, value]) => {
			set(currentNode, ["params", key], value)
			updateNodeConfig({ ...currentNode })
		})
	})

	const initialValues = useMemo(() => {
		return {
			...currentNode?.params,
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const { ConditionComponent } = useConditions({ type, dateTemplate, columns })

	useCurrentNodeUpdate({
		form,
		initialValues,
	})

	return (
		<div className={styles.addRecord}>
			<Form
				form={form}
				layout="vertical"
				onValuesChange={onValuesChange}
				initialValues={initialValues}
			>
				<Form.Item name={["file_id"]} label={t("common.selectFiles", { ns: "flow" })}>
					<MagicSelect
						options={fileOptions}
						dropdownRenderProps={{
							placeholder: t("common.searchFiles", { ns: "flow" }),
							component: FileSelectDropdownRenderer,
							spaceType,
							setSpaceType,
							fileOptions,
							setFileOptions,
						}}
					/>
				</Form.Item>

				<Form.Item name={["sheet_id"]} label={t("common.selectSheets", { ns: "flow" })}>
					<MagicSelect options={sheetOptions} />
				</Form.Item>

				{hasFilter && ConditionComponent}

				{hasColumns && (
					<div className="form-label">{t("common.setValue", { ns: "flow" })}</div>
				)}
				{hasColumns &&
					columns &&
					Object.keys(displayValue).map((colId) => {
						return (
							!NOT_SUPPORT_COLUMNS.includes(columns?.[colId]?.columnType) &&
							(columns?.[colId] ? (
								<Form.Item
									name={["columns", colId]}
									key={colId}
									initialValue={displayValue[colId]}
								>
									<RecordItem
										column={columns?.[colId] || {}}
										delRecord={delRecord}
										// columns={columns}
									/>
								</Form.Item>
							) : (
								<div className="delete-col">
									<Tag color="error">
										{t("common.invalidColumn", { ns: "flow" })}
									</Tag>
									<TSIcon type="ts-trash" onClick={() => delRecord(colId)} />
								</div>
							))
						)
					})}
				{hasColumns && menuOptions.length !== 0 && (
					<Dropdown
						trigger={["click"]}
						className="nodrag"
						disabled={!menuOptions.length}
						overlayClassName={styles.dropdown}
						dropdownRender={() => (
							<Menu onClick={addRecord}>
								{menuOptions.map((item) => {
									return (
										<Menu.Item key={item.id}>
											<div style={{ display: "flex", alignItems: "center" }}>
												<TSIcon
													style={{ marginRight: "5px" }}
													type={schemaType2Icon[item.columnType]}
												/>
												<span
													style={{
														maxWidth: "150px",
														textOverflow: "ellipsis",
														overflow: "hidden",
														whiteSpace: "nowrap",
														display: "inline-block",
													}}
												>
													{item.label}
												</span>
											</div>
										</Menu.Item>
									)
								})}
							</Menu>
						)}
					>
						<div className={cx(styles.addField)}>
							<IconPlus stroke={2} size={16} />
							<span>{t("common.setRecordValue", { ns: "flow" })}</span>
						</div>
					</Dropdown>
				)}
			</Form>
			{currentNode?.output?.form?.structure && (
				<DropdownCard
					title={t("common.output", { ns: "flow" })}
					height="auto"
					style={{ marginTop: "10px" }}
				>
					{/* @ts-ignore */}
					<JSONSchemaRenderer form={currentNode?.output?.form?.structure} />
				</DropdownCard>
			)}
		</div>
	)
}
