/* eslint-disable jsx-a11y/label-has-associated-control */

import { useCallback, useMemo, useState } from "react"
import styles from "./index.module.less"

type Props = {
	onChange?: Function
	checked?: boolean
}
const genRandomId = () => {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
export default function MagicCheckFavor({ checked, onChange }: Props) {
	const checkId = useMemo(() => genRandomId(), [])
	const [checkedComp, setCheckedComp] = useState(checked)
	const handleChange = useCallback(
		(changeValue: any) => {
			if (onChange) {
				onChange(changeValue)
			}
		},
		[onChange],
	)
	return (
		<div className={styles.checkBox}>
			<input
				onChange={(e) => {
					setCheckedComp(e.target.checked)
					handleChange(e.target.checked)
				}}
				checked={checkedComp}
				style={{
					visibility: "hidden",
				}}
				type="checkbox"
				id={`checkBoxInput_${checkId}`}
			/>
			<label htmlFor={`checkBoxInput_${checkId}`} />
		</div>
	)
}
