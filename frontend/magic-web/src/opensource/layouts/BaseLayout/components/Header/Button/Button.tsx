import { forwardRef } from "react"
import type { PropsWithChildren, HTMLAttributes } from "react"
import { useStyles } from "./styles"

const Button = forwardRef<HTMLDivElement, PropsWithChildren<HTMLAttributes<HTMLDivElement>>>(
	({children, ...props}, ref) => {
		const {styles, cx} = useStyles()
		
		return (
			<div { ...props } ref={ ref } className={ cx(styles.button, props?.className) }>
				{ children }
			</div>
		)
	})

export default Button
