import type { DotLottieReactProps } from "@lottiefiles/dotlottie-react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { memo } from "react"
import loadingJson from "./loading.json?raw"

const url = URL.createObjectURL(new Blob([loadingJson], { type: "application/json" }))

interface MagicLoadingProps extends DotLottieReactProps {
	section?: boolean
	size?: number
}

const MagicLoading = memo(function MagicLoading({ section, ...props }: MagicLoadingProps) {
	return (
		<DotLottieReact
			src={section ? url : url}
			loop
			speed={section ? 2 : 1}
			autoplay
			{...props}
		/>
	)
})

export default MagicLoading
