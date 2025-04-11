import MagicModal from "@/opensource/components/base/MagicModal"
import { Flex } from "antd"
import { useTranslation } from "react-i18next"
import { memo, useMemo, useState } from "react"
import MagicSegmented from "@/opensource/components/base/MagicSegmented"
import MagicButton from "@/opensource/components/base/MagicButton"
import { resolveToString } from "@dtyq/es6-template-strings"
import { groupBy } from "lodash-es"
import { StructureItemType } from "@/types/organization"
import { useControllableValue, useMemoizedFn, useUpdateEffect } from "ahooks"
import MagicScrollBar from "@/opensource/components/base/MagicScrollBar"
import OrganizationPanel from "../OrganizationPanel"
import type { MemberDepartmentSelectPanelProps, OrganizationSelectItem } from "./types"
import GroupSelectPanel from "../GroupSelectPanel"
import SelectItemTag from "./components/SelectItemTag"
import { useStyles } from "./styles"
import MemberSearch from "../SearchMember"

const enum PanelKey {
	Recent = "recent",
	ByOrganization = "byOrganization",
	ByGroup = "byGroup",
	ByPartner = "byPartner",
}

type CheckboxOptions = {
	checked?: Array<OrganizationSelectItem>
	onChange?: (checked: Array<OrganizationSelectItem>) => void
	disabled?: Array<OrganizationSelectItem>
}

/**
 * 成员混合选择面板
 *
 * 支持选择成员、部门、群组、合作伙伴
 */
const MemberDepartmentSelectPanel = memo((props: MemberDepartmentSelectPanelProps) => {
	const { title, onOk, onCancel, disabledValues, filterResult, withoutGroup, ...modalProps } = props

	const { styles } = useStyles()
	const { t } = useTranslation("interface")

	const [segment, setSegment] = useState<PanelKey>(PanelKey.ByOrganization)

	const [selected, setSelected] = useControllableValue<OrganizationSelectItem[]>(props, {
		defaultValue: [],
		valuePropName: "selectValue",
		trigger: "onSelectChange",
		defaultValuePropName: "initialSelectValue",
	})

	useUpdateEffect(() => {
		if (modalProps.open) {
			setSelected(modalProps.initialSelectValue ?? [])
		}
	}, [modalProps.open])

	const organizationCheckboxOptions = useMemo<CheckboxOptions>(
		() => ({
			checked: selected,
			onChange: setSelected,
			disabled: disabledValues,
		}),
		[selected, setSelected, disabledValues],
	)

	const {
		[StructureItemType.Department]: departmentSelected = [],
		[StructureItemType.User]: userSelected = [],
		[StructureItemType.Group]: groupSelected = [],
		[StructureItemType.Partner]: partnerSelected = [],
	} = useMemo(() => {
		return groupBy(selected, (item) => item.dataType)
	}, [selected])

	const segmentOptions = useMemo(
		() => {
			const options = [
				// {
				// 	label: t("memberDepartmentSelectPanel.recentContacts"),
				// 	value: PanelKey.Recent,
				// },
				{
					label: t("memberDepartmentSelectPanel.byOrganization"),
					value: PanelKey.ByOrganization,
				},
				
				// {
				// 	label: t("memberDepartmentSelectPanel.byPartner"),
				// 	value: PanelKey.ByPartner,
				// },
		]
		// if (!withoutGroup) {
		// 	options.push({
		// 		label: t("memberDepartmentSelectPanel.byGroup"),
		// 		value: PanelKey.ByGroup,
		// 	})
		// }

		return options
	}, [t])

	const handleOk = useMemoizedFn(() => {
		onOk?.({
			department: departmentSelected,
			user: userSelected,
			group: groupSelected,
			partner: partnerSelected,
		})
	})

	const [searchValue, setSearchValue] = useState("")

	const DefaultEmptyFallback = useMemo(() => {
		return (
			<Flex vertical style={{ height: "100%", overflow: "hidden" }}>
				<MagicSegmented<PanelKey>
					circle={false}
					value={segment}
					block
					style={{ width: "100%", marginBottom: "4px" }}
					onChange={setSegment}
					options={segmentOptions}
				/>
				<div
					style={{
						position: "relative",
						flex: 1,
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
						height: "calc(100% - 32px)", // 减去 MagicSegmented 的高度
					}}
				>
					<MagicScrollBar
						className={styles.panelWrapper}
						style={{
							display: segment === PanelKey.ByOrganization ? "flex" : "none",
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							height: "100%",
							flexDirection: "column",
						}}
					>
						<OrganizationPanel checkboxOptions={organizationCheckboxOptions} />
					</MagicScrollBar>
					<MagicScrollBar
						className={styles.panelWrapper}
						style={{
							display: segment === PanelKey.ByGroup ? "flex" : "none",
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							height: "100%",
							flexDirection: "column",
						}}
					>
						<GroupSelectPanel
							value={selected}
							onChange={setSelected}
							style={{ flex: 1, height: "100%" }}
						/>
					</MagicScrollBar>
				</div>
			</Flex>
		)
	}, [
		segment,
		segmentOptions,
		styles.panelWrapper,
		organizationCheckboxOptions,
		selected,
		setSelected,
	])

	const shouldShowDefaultEmptyFallback = !searchValue

	return (
		<MagicModal
			open
			title={title ?? t("common.select", { ns: "interface" })}
			width={860}
			footer={null}
			centered
			styles={{ body: { padding: 0 } }}
			onCancel={onCancel}
			{...modalProps}
		>
			<Flex className={styles.container}>
				<Flex
					vertical
					gap={5}
					flex={1}
					className={styles.left}
					style={{ position: "relative", overflow: "hidden" }}
				>
					<MemberSearch
						searchValue={searchValue}
						onChangeSearchValue={setSearchValue}
						checkboxOptions={organizationCheckboxOptions}
						listClassName={styles.panelWrapper}
						showSearchResults={!shouldShowDefaultEmptyFallback}
						style={{ display: "flex", flexDirection: "column", height: "100%" }}
						containerHeight={470}
						filterResult={filterResult}
					/>
					<div
						className={styles.fadeWrapper}
						style={{
							opacity: shouldShowDefaultEmptyFallback ? 1 : 0,
							visibility: shouldShowDefaultEmptyFallback ? "visible" : "hidden",
							position: "absolute",
							width: "100%",
							top: "42px", // 搜索框高度
							left: "0",
							right: "0",
							bottom: "0",
							padding: "0",
							margin: "0",
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							zIndex: shouldShowDefaultEmptyFallback ? 1 : -1,
						}}
					>
						{DefaultEmptyFallback}
					</div>
				</Flex>
				<div className={styles.divider} />
				<Flex flex={1} vertical>
					<Flex vertical flex={1} className={styles.selectedWrapper} gap={12}>
						<Flex align="center" gap={8}>
							<span className={styles.selected}>
								{t("memberDepartmentSelectPanel.selected")}
							</span>
							<span>
								{resolveToString(t("memberDepartmentSelectPanel.selectedMembers"), {
									count: userSelected.length,
								})}
							</span>
							{/* <span>
								{resolveToString(t("memberDepartmentSelectPanel.selectedGroups"), {
									count: groupSelected.length,
								})}
							</span> */}
							<span>
								{resolveToString(
									t("memberDepartmentSelectPanel.selectedDepartments"),
									{
										count: departmentSelected.length,
									},
								)}
							</span>
							{/* <span>
								{resolveToString(t("memberDepartmentSelectPanel.selectedPartner"), {
									count: partnerSelected.length,
								})}
							</span> */}
						</Flex>
						<Flex wrap="wrap">
							{selected.map((item) => {
								const key = `${item.dataType}-${item.id}`
								return (
									<SelectItemTag
										key={key}
										data={item}
										className={styles.selectItemTag}
										onClose={() => {
											setSelected(
												selected.filter(
													(i) =>
														i.dataType !== item.dataType ||
														i.id !== item.id,
												),
											)
										}}
									/>
								)
							})}
						</Flex>
					</Flex>
					<Flex align="center" gap={10} justify="flex-end" className={styles.footer}>
						<MagicButton type="default" onClick={onCancel}>
							{t("common.cancel", { ns: "interface" })}
						</MagicButton>
						<MagicButton type="primary" onClick={handleOk}>
							{t("common.confirm", { ns: "interface" })}
						</MagicButton>
					</Flex>
				</Flex>
			</Flex>
		</MagicModal>
	)
})

export default MemberDepartmentSelectPanel
