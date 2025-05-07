/**
 * 表达式组件的自定义渲染属性
 */

import { useMemoizedFn } from "ahooks"
import type { EXPRESSION_VALUE } from "@dtyq/magic-flow/dist/MagicExpressionWidget/types"
import { LabelTypeMap } from "@dtyq/magic-flow/dist/MagicExpressionWidget/types"
import AuthManagerModal from "@/opensource/pages/flow/components/AuthControlButton/AuthManagerModal/AuthManagerModal"
import type { DepartmentExtraData } from "@/opensource/pages/flow/components/AuthControlButton/AuthManagerModal/types"
import { ManagerModalType } from "@/opensource/pages/flow/components/AuthControlButton/AuthManagerModal/types"
import type { DepartmentSelectItem } from "@/opensource/components/business/MemberDepartmentSelectPanel/types"
import { get } from "lodash-es"
import { useTranslation } from "react-i18next"
import { FilterTargetTypes } from "../constants"

export default function useRenderConfig() {
	const { t } = useTranslation()

	const getRenderConfig = useMemoizedFn(
		(filterItem: { left: FilterTargetTypes; right: LabelTypeMap; operator: string }) => {
			if (filterItem?.left === FilterTargetTypes.DepartmentName) {
				let departmentValues = get(filterItem, ["right", "structure", "const_value"], [])
				departmentValues =
					departmentValues?.find?.(
						(departmentValue: EXPRESSION_VALUE) =>
							departmentValue.type === LabelTypeMap.LabelDepartmentNames,
					)?.department_names_value || []
				return {
					type: LabelTypeMap.LabelDepartmentNames,
					props: {
						editComponent: ({
							onChange,
							closeModal,
							isOpen,
						}: {
							isOpen: boolean
							closeModal: () => void
							onChange: (
								departmentNames: Pick<DepartmentSelectItem, "id" | "name">[],
							) => void
						}) => {
							return (
								<AuthManagerModal<DepartmentExtraData>
									open={isOpen}
									type={ManagerModalType.Department}
									title={t("searchMembers.selectDepartment", { ns: "flow" })}
									closeModal={closeModal}
									extraConfig={{
										onOk: (departments) => {
											// console.log("departments", departments)
											onChange(departments)
										},
										value: departmentValues,
									}}
								/>
							)
						},
					},
				}
			}
			return undefined
		},
	)

	const getExtraConfig = useMemoizedFn((leftKey: FilterTargetTypes) => {
		if (leftKey === FilterTargetTypes.DepartmentName) {
			return {
				multiple: false,
			}
		}
		return {}
	})

	return {
		getRenderConfig,
		getExtraConfig,
	}
}
