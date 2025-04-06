import { Login } from "@/types/login"
import { DingTalkLoginStrategy, isDingTalk } from "./DingTalkStrategy"
import { LarkStrategy, isLark } from "./LarkkStrategy"

export async function getAuthCode(
	deployCode: string,
): Promise<{ authCode: string; platform: Login.LoginType }> {
	try {
		if (isDingTalk()) {
			return {
				authCode: await DingTalkLoginStrategy.getAuthCode(deployCode),
				platform: Login.LoginType.DingTalkAvoid,
			}
		}
		if (isLark()) {
			return {
				authCode: await LarkStrategy.getAuthCode(deployCode),
				platform: Login.LoginType.LarkAvoid,
			}
		}
	} catch (error: any) {
		throw new Error(error?.message)
	}
	throw new Error("There is currently no login free access in the current environment")
}
