import { useMemoizedFn } from "ahooks"
import { useState } from "react"
import { AuthApi } from "@/apis"
import { unionBy } from "lodash-es"
import { OperationTypes, TargetTypes, type AuthMember } from "../../types"
import type { AuthExtraData, DepartmentExtraData, ExtraData } from "../types"
import { ManagerModalType } from "../types"

type AuthListProps = {
	extraConfig: ExtraData
	type: ManagerModalType
}

export default function useAuthList({ extraConfig, type }: AuthListProps) {
	// 当前已授权的列表
	const [authList, setAuthList] = useState([] as AuthMember[])
	// 原始的授权列表（用来做比对）
	const [originalAuthList, setOriginalAuthList] = useState<AuthMember[]>(authList || [])

	// 新增授权成员
	const addAuthMembers = useMemoizedFn((members: AuthMember[]) => {
		// 取并集，避免重复新增
		setAuthList((prevAuthList) => unionBy(prevAuthList, members, "target_id"))
	})

	// 删除授权成员
	const deleteAuthMembers = useMemoizedFn((members: AuthMember[]) => {
		const delMemberIds = members
			.filter((member) => member.operation !== OperationTypes.Owner)
			.map((member) => member.target_id)
		setAuthList(authList.filter((auth) => !delMemberIds.includes(auth.target_id)))
	})

	// 更新授权成员权限信息
	const updateAuthMember = useMemoizedFn((member: AuthMember) => {
		setAuthList((prevAuthList) => {
			const newAuthList = prevAuthList.map((auth) => {
				if (auth.target_id !== member.target_id) return auth
				return member
			})
			return newAuthList
		})
	})

	const initAuthList = useMemoizedFn(async () => {
		if (type === ManagerModalType.Auth) {
			const { resourceId, resourceType } = extraConfig as AuthExtraData
			if (!resourceId || !resourceType) return
			const authResult = await AuthApi.getResourceAccess(resourceType, resourceId)
			if (authResult.targets) {
				setAuthList(authResult.targets)
				setOriginalAuthList(authResult.targets)
			}
			return
		}
		if (type === ManagerModalType.Department) {
			const { value } = extraConfig as DepartmentExtraData
			const newAuthList = value.map((item) => ({
				target_type: TargetTypes.Department,
				target_id: item.id,
				operation: OperationTypes.Read,
				target_info: {
					id: item.id,
					name: item.name,
					description: "",
					icon: "",
				},
			}))
			setAuthList(newAuthList)
			setOriginalAuthList(newAuthList)
		}
	})

	return {
		authList,
		addAuthMembers,
		deleteAuthMembers,
		updateAuthMember,
		initAuthList,
		setAuthList,
		originalAuthList,
		setOriginalAuthList,
	}
}
