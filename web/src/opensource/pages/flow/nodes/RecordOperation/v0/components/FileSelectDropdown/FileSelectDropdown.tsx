/**
 * 通用型dropdown Renderer
 */
import type { DefaultOptionType } from "antd/lib/select"
import { IconCheck, IconFile } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import { castArray } from "lodash-es"
import type React from "react"
import SearchInput from "@dtyq/magic-flow/common/BaseUI/DropdownRenderer/SearchInput"
import "./FileSelectDropdown.less"
import type { Dispatch, SetStateAction } from "react"
import { useMemo } from "react"
import { File } from "@/types/sheet"
import MagicRadioButtons from "@/opensource/pages/flow/nodes/Variable/components/MagicRadioButtons"
import { useTranslation } from "react-i18next"
import useFileSelectDropdownRenderer from "./hooks/useFileSelectDropdownRenderer"

export type BaseDropdownOption = DefaultOptionType & { realLabel?: string; [key: string]: any }

type FileSelectDropdownRendererProps = {
	options: BaseDropdownOption[]
	onChange?: (value: DefaultOptionType["value"] | any[]) => void
	value?: DefaultOptionType["value"] | any[]
	selectRef?: any
	multiple?: boolean
	OptionWrapper?: React.FC<any>
	spaceType: File.SpaceType
	setSpaceType: React.Dispatch<React.SetStateAction<File.SpaceType>>
	fileType?: File.FileType
	fileOptions: DefaultOptionType[]
	setFileOptions: Dispatch<SetStateAction<DefaultOptionType[]>>
}

export default function FileSelectDropdownRenderer({
	onChange,
	value,
	multiple,
	// eslint-disable-next-line react/jsx-no-useless-fragment
	OptionWrapper = ({ children }) => <>{children}</>,
	spaceType = File.SpaceType.Official,
	fileType = File.FileType.MultiTable,
	setSpaceType,
	fileOptions,
	setFileOptions,
}: FileSelectDropdownRendererProps) {
	const { t } = useTranslation()
	const { keyword, onSearchChange } = useFileSelectDropdownRenderer({
		spaceType,
		setFileOptions,
		fileType,
	})

	const onSelectItem = useMemoizedFn((val: any) => {
		const cloneValue = castArray(value).filter((v) => !!v)
		/** 处理多选 */
		if (multiple) {
			if (cloneValue?.includes?.(val)) {
				return
			}
			onChange?.([...cloneValue, val])

			return
		}
		/** 处理单选 */
		onChange?.(val)
	})

	const spaceTypeList = useMemo(() => {
		return [
			{
				label: t("common.privateDrive", { ns: "flow" }),
				value: File.SpaceType.Personal,
			},
			{
				label: t("common.enterpriseDrive", { ns: "flow" }),
				value: File.SpaceType.Official,
			},
		]
	}, [t])

	return (
		<div className="file-select-dropdown" onClick={(e) => e.stopPropagation()}>
			<div className="search-wrapper">
				<SearchInput
					placeholder={t("common.inputFileName", { ns: "flow" })}
					value={keyword}
					onChange={onSearchChange}
				/>
			</div>
			<div className="space-type">{t("common.driveType", { ns: "flow" })}</div>
			<div className="space-type-selection">
				<MagicRadioButtons
					options={spaceTypeList}
					itemWidth="280px"
					value={spaceType}
					onChange={setSpaceType}
				/>
			</div>
			<div className="file-title">{t("common.fileList", { ns: "flow" })}</div>
			<div className="dropdown-list">
				{fileOptions.map((option) => {
					return (
						<OptionWrapper tool={option}>
							<div
								className="dropdown-item nodrag"
								onClick={() => {
									onSelectItem(option.value)
								}}
							>
								<IconFile color="#32c436" />
								<div className="label">{option.label}</div>
								{value === option.value && <IconCheck className="tick" />}
							</div>
						</OptionWrapper>
					)
				})}
			</div>
		</div>
	)
}
