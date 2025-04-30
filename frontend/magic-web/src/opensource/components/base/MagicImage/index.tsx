import type { ImgHTMLAttributes } from "react"
import { memo, useState } from "react"

interface MagicImageProps extends ImgHTMLAttributes<HTMLImageElement> {
	errorSrc?: string
}
export default memo(function MagicImage(props: MagicImageProps) {
	const { errorSrc, ...imgProps } = props

	const [src, setSrc] = useState<string>(imgProps.src || "")

	return (
		<img
			{...imgProps}
			src={imgProps.src ? src : errorSrc}
			onError={(event) => {
				setSrc(errorSrc || "")
				imgProps.onError?.(event)
			}}
		/>
	)
})
