import type { ComponentType } from "react"
import { lazy, Suspense } from "react"
import { isDingTalk } from "@/opensource/layouts/middlewares/withThirdPartyAuth/Strategy/DingTalkStrategy"

const MobilePage = lazy(() => import("./MobilePage"))

const isMobilePhone =
	/Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile/.test(
		window.navigator.userAgent,
	)

export const withApp = (WrapperComponent: ComponentType) => {
	return (props: any) => {
		const dingTalk = isDingTalk()

		if (dingTalk && isMobilePhone) {
			return (
				<Suspense fallback="加载中">
					<MobilePage />
				</Suspense>
			)
		}
		return <WrapperComponent {...props} />
	}
}

export { MobilePage }
