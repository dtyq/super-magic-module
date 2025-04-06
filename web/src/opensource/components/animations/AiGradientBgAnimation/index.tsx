import type { VideoHTMLAttributes } from "react"
import { memo } from "react"
// import type { DotLottieWorkerReactProps } from "@lottiefiles/dotlottie-react"
// import { DotLottieWorkerReact } from "@lottiefiles/dotlottie-react"
// import json from "./gradient.json?raw"
import video from "@/assets/resources/ai-generate-loading.mp4?url"

// const url = URL.createObjectURL(new Blob([json], { type: "application/json" }))

const AiGradientBgAnimation = memo((props: VideoHTMLAttributes<HTMLVideoElement>) => {
	return (
		<video autoPlay muted loop {...props}>
			<source src={video} type="video/mp4" />
		</video>
	)
	// return <DotLottieWorkerReact loop autoplay src={url} {...props} />
})

export default AiGradientBgAnimation
