import { useDebounceEffect, useMemoizedFn, useResetState, useUpdateEffect } from "ahooks"
import { UserType } from "@/types/user"
import { ContactApi } from "@/apis"
import { OperationTypes, TargetTypes, type AuthMember } from "../../../types"
import { defaultOperation } from "../../../constants"
import useContacts from "./useContacts"
import { AuthSearchTypes } from "./useTabs"
import { useAuthControl } from "../../../AuthManagerModal/context/AuthControlContext"

type UseMemberProps = {
	tab: AuthSearchTypes
	keyword: string
}

export default function useMembers({ tab, keyword }: UseMemberProps) {
	const { users } = useContacts()

	const { addAuthMembers, deleteAuthMembers, authList } = useAuthControl()

	const [members, setMembers, resetMembers] = useResetState([...users] as AuthMember[])

	const generateMembersByTab = useMemoizedFn(async () => {
		let authMembers = [] as AuthMember[]
		if (keyword === "") return authMembers
		switch (tab) {
			case AuthSearchTypes.Member:
				const searchedUsers = await ContactApi.searchUser({
					query: keyword,
					page_token: "",
					// @ts-ignore
					query_type: 2,
				})
				if (searchedUsers?.items?.length) {
					const filterUsers = searchedUsers?.items?.filter(
						(user) => user.user_type !== UserType.AI,
					)
					authMembers = filterUsers.map((user) => {
						return {
							target_type: TargetTypes.User,
							target_id: user.user_id,
							operation: defaultOperation,
							target_info: {
								id: user.user_id,
								name: user.nickname || user.real_name,
								icon: user.avatar_url,
								description: user.job_title,
							},
						}
					})
					// 将已有权限合并进来，避免删掉创建者的权限
					authMembers = authMembers.map((member) => {
						const owner = authList?.find(
							(auth) => auth.operation === OperationTypes.Owner,
						)
						if (member.target_id === owner?.target_id) {
							return {
								...member,
								operation: OperationTypes.Owner,
							}
						}
						return member
					})
				}
				break
			case AuthSearchTypes.Organization:
				const departmentList = await ContactApi.searchOrganizations({
					name: keyword,
				})
				authMembers = departmentList?.items?.map?.((department) => {
					return {
						target_type: TargetTypes.Department,
						target_id: department.department_id,
						operation: defaultOperation,
						target_info: {
							id: department.department_id,
							name: department.name,
							description: "",
							icon: "",
						},
					}
				})
				break
				// case AuthSearchTypes.Group:
				//     authMembers = [...groups]
				//     break
				// case AuthSearchTypes.Partner:
				//     authMembers = []
				break
			default:
				authMembers = []
		}
		return authMembers
	})

	const searchMembers = useMemoizedFn(async () => {
		if (keyword === "") {
			resetMembers()
			return
		}
		const authMembers = await generateMembersByTab()
		setMembers(authMembers)
	})

	const checkMember = useMemoizedFn((member: AuthMember) => {
		const isIncludeMember = authList.find((auth) => auth.target_id === member.target_id)
		if (!isIncludeMember) {
			addAuthMembers([member])
		} else {
			deleteAuthMembers([member])
		}
	})

	const checkAllMember = useMemoizedFn((checked: boolean) => {
		if (checked) {
			addAuthMembers([...members])
		} else {
			deleteAuthMembers([...members])
		}
	})

	useUpdateEffect(() => {
		searchMembers()
	}, [tab])

	useDebounceEffect(
		() => {
			searchMembers()
		},
		[keyword],
		{
			wait: 400,
		},
	)

	return {
		members,
		checkMember,
		checkAllMember,
	}
}
