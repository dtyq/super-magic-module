import { type SelectProps } from "antd"
import { useMemo } from "react"
import { useAreaCodes, useGlobalLanguage } from "@/opensource/models/config/hooks"
import MagicSelect from "@/opensource/components/base/MagicSelect"

function PhoneStateCodeSelect({ value, onChange }: SelectProps) {
	const { areaCodes } = useAreaCodes()
	const language = useGlobalLanguage(false)

	const phoneOptions = useMemo(() => {
		return areaCodes.map((item) => {
			return {
				value: item.code,
				label: item.translations?.[language] || item.name,
				desc: item.name,
			}
		})
	}, [areaCodes, language])

	return (
		<MagicSelect
			options={phoneOptions}
			defaultValue="+86"
			value={value}
			onChange={onChange}
			style={{ width: "75px", border: "none" }}
			dropdownStyle={{ width: "fit-content" }}
			onClick={(e) => e.stopPropagation()}
			labelRender={(option) => <div>{option.value}</div>}
			optionRender={(option) => (
				<div key={option.value}>
					{option.label} ({option.value})
				</div>
			)}
		/>
	)
}

export default PhoneStateCodeSelect
