import { cx } from "antd-style"
import { useState } from "react"
import { Flex } from "antd"
import { IconCheck } from "@tabler/icons-react"
import { useMemoizedFn, useUpdateEffect } from "ahooks"
import styles from "./index.module.less"

type MagicRadioButtonsProps<ValueType> = {
	options: {
		icon?: React.ReactElement
		label: string
		value: ValueType
	}[]
	value?: ValueType
	onChange?: (value: ValueType) => void
	itemWidth?: string
	itemHeight?: string
}

export default function MagicRadioButtons<ValueType>({
	options,
	value,
	onChange,
	itemWidth,
	itemHeight,
}: MagicRadioButtonsProps<ValueType>) {
	const [currentValue, setCurrentValue] = useState(value)

	useUpdateEffect(() => {
		setCurrentValue(value)
	}, [value])

	const onValueChange = useMemoizedFn((val: ValueType) => {
		setCurrentValue(val)
		onChange?.(val)
	})

	return (
		<Flex className={styles.magicRadioButton} align="center" gap={10}>
			{options.map((option) => {
				return (
					<Flex
						className={cx(styles.radioItem, {
							[styles.checked]: currentValue === option.value,
						})}
						onClick={() => onValueChange?.(option.value)}
						align="center"
						justify="space-between"
						style={{ width: itemWidth ?? "auto", height: itemHeight ?? "40px" }}
					>
						<Flex gap={4} align="center">
							{option?.icon}
							<span className={styles.label}>{option.label}</span>
						</Flex>

						<Flex gap={4} align="center">
							{currentValue === option.value && (
								<IconCheck stroke={1} size={18} color="#315CEC" />
							)}
						</Flex>
					</Flex>
				)
			})}
		</Flex>
	)
}
