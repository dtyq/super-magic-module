import { createStyles } from "antd-style"
import type { IMarkmapOptions } from "markmap-common"
import { Markmap } from "markmap-view"
import type { HTMLAttributes, Ref, RefObject } from "react"
import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from "react"
import { transformer } from "../../markmap"

const useStyles = createStyles(({ css, token }) => ({
	svg: css`
		width: 100%;
		height: 100%;
		min-height: 280px;
		background: ${token.colorBgContainer};
		background-image: radial-gradient(circle, rgba(0, 0, 0, 0.1), 1px, transparent 1px);
		background-size: 20px 20px;
		user-select: none;
		white-space: normal;
		--markmap-text-color: iniherit !important;
	`,
}))

export type MarkmapBaseProps = HTMLAttributes<SVGSVGElement> & {
	options: Partial<IMarkmapOptions>
	data?: string
}

export type MarkmapBaseRef = {
	instance: RefObject<Markmap | null>
	dom: RefObject<SVGSVGElement | null>
}

const MarkmapBase = memo(
	forwardRef(
		(
			{ options, data = "", className, ...rest }: MarkmapBaseProps,
			ref: Ref<MarkmapBaseRef>,
		) => {
			const { styles, cx } = useStyles()

			// Ref for SVG element
			const refSvg = useRef<SVGSVGElement | null>(null)
			// Ref for markmap object
			const refMm = useRef<Markmap | null>(null)

			useImperativeHandle(ref, () => ({
				instance: refMm,
				dom: refSvg,
			}))

			useEffect(() => {
				const svg = refSvg.current
				if (svg) {
					refMm.current = Markmap.create(svg, options)
				}

				return () => {
					if (refMm.current) {
						refMm.current?.destroy()
						refMm.current = null
					}
				}
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [refSvg.current, options])

			useEffect(() => {
				const { root } = transformer.transform(data)
				refMm.current?.setData(root)
				refMm.current?.fit()
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [data, refMm.current])

			return <svg ref={refSvg} className={cx(styles.svg, className)} {...rest} />
		},
	),
)

export default MarkmapBase
