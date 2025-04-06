import { useEffect, useState } from "react"
import { reaction } from "mobx"
import { userStore } from "@/opensource/models/user"
import { userService } from "@/services"
import { useMemoizedFn } from "ahooks"
import { userTransformer } from "@/opensource/models/user/transformers"
import type { StructureUserItem } from "@/types/organization"

/**
 * 获取当前用户信息
 */
export function useUserInfo() {
	const [userInfo, setUserInfo] = useState(userStore.user.userInfo)

	useEffect(() => {
		return reaction(
			() => userStore.user.userInfo,
			(info) => setUserInfo(info),
		)
	}, [])

	const set = useMemoizedFn((info: StructureUserItem | null) => {
		userService.setUserInfo(info ? userTransformer(info) : null)
	})

	return { userInfo, setUserInfo: set }
}

export interface GetTeamshareUserDepartmentsResponse {
	id: string
	departments: {
		name: string
		level: number
		id: string
	}[][]
}
