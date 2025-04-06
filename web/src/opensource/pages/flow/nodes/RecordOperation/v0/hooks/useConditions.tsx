import { useMemo } from "react"
import { Form, Select } from "antd"
import MagicSelect from "@dtyq/magic-flow/common/BaseUI/Select"
import { cloneDeep, set } from "lodash-es"
import ConditionContainer from "@/opensource/pages/flow/components/ConditionContainer"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import type { Sheet } from "@/types/sheet"
import { useTranslation } from "react-i18next"
import type { RecordType } from ".."
import type { ConditionTypes } from "../constants"
import { conditionsOptions, FilterTypes, getFilterOptions } from "../constants"
import styles from "../styles/condition.module.less"

type ConditionsProps = {
	type: RecordType
	dateTemplate: Record<string, Sheet.Detail>
	columns: Sheet.Content["columns"]
}

export default function useConditions({ type, dateTemplate, columns }: ConditionsProps) {
	const { t } = useTranslation()
	const { currentNode } = useCurrentNode()

	const { updateNodeConfig } = useFlow()

	const recordFilterOptions = useMemo(() => {
		return cloneDeep(getFilterOptions(type))
	}, [type])

	const ConditionComponent = useMemo(() => {
		return (
			<>
				<Form.Item
					name={["select_record_type"]}
					label={t("common.selectRecord", { ns: "flow" })}
				>
					<MagicSelect options={recordFilterOptions} />
				</Form.Item>
				{currentNode?.params?.select_record_type === FilterTypes.Conditions && (
					<Form.Item
						name={["filters"]}
						className={styles.filterCondition}
						label={
							<div>
								<span>{t("common.setFilterConditions", { ns: "flow" })}</span>
								<div>
									{t("common.meet", { ns: "flow" })}
									<Select
										value={currentNode?.params?.filter_type}
										onChange={(val: ConditionTypes) => {
											if (!currentNode) return
											set(currentNode, ["params", "filter_type"], val)
											updateNodeConfig({ ...currentNode })
										}}
										options={conditionsOptions}
										className="nodrag"
										getPopupContainer={() => document.body}
										popupClassName="nowheel"
									/>
									{t("common.conditions", { ns: "flow" })}
								</div>
							</div>
						}
					>
						<ConditionContainer
							sheetId={currentNode?.params?.sheet_id}
							columns={columns}
							dataTemplate={dateTemplate}
						/>
					</Form.Item>
				)}
			</>
		)
	}, [columns, currentNode, dateTemplate, recordFilterOptions, t, updateNodeConfig])

	return {
		ConditionComponent,
	}
}
