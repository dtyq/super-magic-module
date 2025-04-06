import { IconChevronDown } from "@tabler/icons-react"
import type { SelectProps } from "antd"
import { Select } from "antd"
import MagicIcon from "../MagicIcon"
import { memo } from "react"

const suffixIcon = <MagicIcon component={IconChevronDown} size={16} />

const MagicSelect = memo(({ ...props }: SelectProps) => {
	return <Select suffixIcon={suffixIcon} {...props} />
})

MagicSelect.displayName = "MagicSelect"

export default MagicSelect
