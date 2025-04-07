import type { SpinProps } from "antd"
import { Spin } from "antd"
import { cx } from "antd-style"
import { memo } from "react"
import { useMagicSpinProps } from "./useMagicSpinProps"

interface MagicSpinProps extends SpinProps {
	section?: boolean
}

const MagicSpin = memo(function MagicSpin({
	children,
	size,
	section = false,
	className,
	...props
}: MagicSpinProps) {
	const magicSpinProps = useMagicSpinProps(section, size)
	return (
		<Spin
			{...magicSpinProps}
			wrapperClassName={cx(magicSpinProps.wrapperClassName, className)}
			{...props}
		>
			{children}
		</Spin>
	)
})

export default MagicSpin
