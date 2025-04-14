import { useEffect, useMemo, useRef } from "react"
import userInfoStore from "@/opensource/stores/userInfo"
import userInfoService from "@/opensource/services/userInfo"
import { computed } from "mobx"

/**
 * 获取多个用户信息
 * @param uid 用户ID
 */
const useUserInfo = (uid?: string | null, force: boolean = false) => {
	const userInfo = useMemo(() => {
		return computed(() => (uid ? userInfoStore.get(uid) : undefined))
	}, [uid]).get()

	const forced = useRef(false)
	useEffect(() => {
		if (force && uid && !forced.current) {
			userInfoService.fetchUserInfos([uid], 2).then(() => {
				forced.current = true
			})
		}
	}, [force, uid, userInfo])

	return { userInfo }
}

export default useUserInfo
