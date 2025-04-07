import { memo } from "react"
// import type { DotLottieWorkerReactProps } from "@lottiefiles/dotlottie-react"
// import { DotLottieWorkerReact } from "@lottiefiles/dotlottie-react"
// import json from "./stream.json?raw"
import streamLoadingIcon from "@/assets/resources/stream-loading-2.png"

// const url = URL.createObjectURL(new Blob([json], { type: "application/json" }))

const StreamTextAnimation = memo(({ style, ...props }: React.HTMLAttributes<HTMLImageElement>) => {
	return (
		<img
			src={streamLoadingIcon}
			alt=""
			style={{ width: 16.5, height: 16.5, scale: 1.3, display: "inline-block", ...style }}
			{...props}
		/>
	)
	// return (
	// 	<DotLottieWorkerReact
	// 		loop
	// 		autoplay
	// 		style={{ width: 18, height: 18, display: "inline-block", ...style }}
	// 		src={url}
	// 		{...props}
	// 	/>
	// )
})

export default StreamTextAnimation
