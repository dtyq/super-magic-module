import { useContactStore } from "@/opensource/stores/contact/hooks"
import { useEffect, useRef } from "react"
import userInfoStore from "@/opensource/stores/userInfo"
/**
 * 获取多个用户信息
 * @param uid 用户ID
 */
const useUserInfo = (uid?: string | null, force: boolean = false) => {
	const userInfo = uid ? userInfoStore.get(uid) : undefined

	const { trigger: getUserInfo, isMutating } = useContactStore((s) => s.useUserInfos)()

	const forced = useRef(false)
	useEffect(() => {
		if ((!userInfo || force) && uid && !isMutating && !forced.current) {
			getUserInfo({ user_ids: [uid], query_type: 2 }).then(() => {
				forced.current = true
			})
		}
	}, [force, getUserInfo, isMutating, uid, userInfo])

	return { userInfo, refreshUserInfo: getUserInfo, isMutating }
}

export default useUserInfo
