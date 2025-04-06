import { RequestUrl } from "@/opensource/apis/constant"
import type {
	StructureUserItem,
	OrganizationData,
	StructureItem,
	WithIdAndDataType,
	StructureItemOnCache,
} from "@/types/organization"
import { StructureItemType } from "@/types/organization"
import useSWRImmutable from "swr/immutable"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createStore } from "idb-keyval"
import type { SWRConfiguration, SWRResponse } from "swr"
import { fetchPaddingData } from "@/utils/request"
import type { CommonResponse, PaginationResponse } from "@/types/request"
import type { Friend, SquareData } from "@/types/contact"
import { groupBy } from "lodash-es"
import type { SWRMutationResponse } from "swr/mutation"
import useSWRMutation from "swr/mutation"
import type { GroupConversationDetail } from "@/types/chat/conversation"
import useSWR from "swr"
import { immer } from "zustand/middleware/immer"
import { ContactApi } from "@/apis"
import { useOrganization } from "@/opensource/models/user/hooks"
import { userStore } from "@/opensource/models/user"
import {
	createIndexedDBPersistStorage,
	genIndexedDBPersistStorageName,
} from "../utils/indexedDBPersistStorage"
import type { ContactState } from "./types"
import userInfoService from "@/opensource/services/userInfo"

const defaultState: () => ContactState = () => ({
	organizations: new Map<string, OrganizationData>(),
	departmentInfos: new Map<string, StructureItemOnCache>(),
	userInfos: new Map<string, StructureUserItem>(),
})

const ContactStoreVersion = 0

export interface ContactStoreState extends ContactState {
	cacheDepartmentInfos: (data: StructureItem[], sum_type: 1 | 2) => void
	cacheOrganization: (department_id: string, data: StructureItem[]) => void
	useOrganizationTree: (
		params: {
			department_id?: string
			sum_type?: 1 | 2
			with_member?: boolean
		},
		swrOptions?: SWRConfiguration,
	) => SWRResponse<{
		departments: WithIdAndDataType<StructureItem, StructureItemType.Department>[]
		users: WithIdAndDataType<StructureUserItem, StructureItemType.User>[]
	}>
	useUserSearch: (
		data: { query?: string; page_token?: string },
		swrOptions?: SWRConfiguration,
	) => SWRResponse<PaginationResponse<StructureUserItem>>
	useUserSearchAll: (
		query?: string,
		swrOptions?: SWRConfiguration,
	) => SWRResponse<StructureUserItem[]>
	useSquarePrompts: () => SWRResponse<SquareData>
	useUserInfo: (
		uid?: string | null,
		query_type?: 1 | 2,
		alwaysFetch?: boolean,
		swrOptions?: SWRConfiguration,
	) => SWRResponse<StructureUserItem | undefined>
	useUserInfos: () => SWRMutationResponse<
		StructureUserItem[],
		any,
		RequestUrl.getUserInfoByIds,
		{ user_ids: string[]; query_type?: 1 | 2 }
	>
	useFriends: () => SWRMutationResponse<
		PaginationResponse<Friend>,
		any,
		string,
		{ page_token?: string }
	>
	useUserGroups: () => SWRMutationResponse<
		PaginationResponse<GroupConversationDetail & { conversation_id: string }>,
		any,
		string,
		{ page_token?: string }
	>
	useDepartmentInfos: (
		department_ids: string[],
		sum_type?: 1 | 2,
		alwaysFetch?: boolean,
	) => SWRResponse<StructureItemOnCache[]>

	useUserManual: () => SWRMutationResponse<
		CommonResponse<string>,
		any,
		string,
		{ user_id: string }
	>

	useDepartmentManual: () => SWRMutationResponse<
		CommonResponse<string>,
		any,
		string,
		{ department_id: string }
	>
}

export const createContactStore = (uid: string) =>
	create<ContactStoreState>()(
		immer(
			persist(
				(set, get) => ({
					...defaultState(),
					/**
					 * 缓存部门信息
					 * @param data
					 */
					cacheDepartmentInfos: (data: StructureItem[], sum_type: 1 | 2) => {
						const map = new Map(get().departmentInfos)
						const { organizations, organizationCode } = userStore.user
						data.forEach((item) => {
							// FIXME: 临时处理: 赋值根部门的name, 后续应该由后端修复
							if (item.department_id === "-1") {
								const organization = organizations.find(
									(i) => i.organization_code === organizationCode,
								)

								if (organization) {
									item.name = organization.organization_name
								}
							}

							map.set(item.department_id, {
								...map.get(item.department_id),
								...item,
								...(sum_type === 1
									? {
											employee_sum_deep:
												map.get(item.department_id)?.employee_sum_deep ?? 0,
									  }
									: { employee_sum_deep: item.employee_sum }),
							})
						})
						set((preState) => {
							preState.departmentInfos = map
						})
					},
					/**
					 * 缓存组织信息
					 * @param parent_id
					 * @param data
					 */
					cacheOrganization: (parent_id: string, data: OrganizationData) => {
						const map = new Map(get().organizations)
						map.set(parent_id, data)
						set((state) => {
							state.organizations = map
						})
					},
					/**
					 * 获取广场提示词
					 * @returns
					 */
					useSquarePrompts: () => {
						return useSWRImmutable(RequestUrl.getSquarePrompts, () =>
							ContactApi.getSquarePrompts(),
						)
					},
					/**
					 * 获取组织树
					 */
					useOrganizationTree: (
						{ department_id = "-1", with_member = false, sum_type = 2 },
						swrOptions?: SWRConfiguration,
					) => {
						const { organizationCode } = useOrganization()
						return useSWR(
							[department_id, with_member, sum_type, organizationCode],
							async ([depId, withMember, sumType]) => {
								const promises: [
									Promise<StructureItem[]>,
									Promise<StructureUserItem[]>,
								] = [
									// 获取部门
									fetchPaddingData((params) =>
										ContactApi.getOrganization({
											department_id: depId,
											sum_type: sumType,
											...params,
										}),
									),
									// 获取部门成员
									withMember
										? fetchPaddingData((params) =>
												ContactApi.getOrganizationMembers({
													department_id: depId,
													...params,
												}),
										  )
										: Promise.resolve([] as StructureUserItem[]),
								]

								const [departments, users] = await Promise.all(promises)

								// 缓存用户信息
								users.forEach((item) => {
									userInfoService.set(item.user_id, item)
								})

								get().cacheDepartmentInfos(departments, sum_type)

								return {
									departments: departments.map((item) => ({
										...get().departmentInfos.get(item.department_id),
										...item,
										dataType: StructureItemType.Department,
										id: item.department_id,
									})) as WithIdAndDataType<
										StructureItem,
										StructureItemType.Department
									>[],
									users: users.map((item) => ({
										...get().departmentInfos.get(item.user_id),
										...item,
										dataType: StructureItemType.User,
										id: item.user_id,
									})) as WithIdAndDataType<
										StructureUserItem,
										StructureItemType.User
									>[],
								}
							},
							swrOptions,
						)
					},
					/**
					 * 获取用户搜索
					 * @param data
					 * @param swrOptions
					 * @returns
					 */
					useUserSearch: (
						data: { query?: string; page_token?: string },
						swrOptions?: SWRConfiguration,
					) => {
						const { organizationCode } = useOrganization()
						return useSWRImmutable(
							[data.query ?? "", data.page_token, organizationCode],
							([query, page_token]) => ContactApi.searchUser({ query, page_token }),
							swrOptions,
						)
					},
					/**
					 * 获取所有用户搜索
					 * @param query
					 * @param swrOptions
					 * @returns
					 */
					useUserSearchAll: (query = "", swrOptions?: SWRConfiguration) => {
						const { organizationCode } = useOrganization()
						return useSWRImmutable(
							query ? [query, organizationCode] : false,
							([q]) =>
								fetchPaddingData<StructureUserItem>((params) =>
									ContactApi.searchUser({ query: q, ...params }),
								),
							swrOptions,
						)
					},
					/**
					 * 获取用户信息
					 * @param uid
					 * @param query_type
					 * @param swrOptions
					 * @returns
					 */
					useUserInfo: (
						user_id?: string | null,
						query_type: 1 | 2 = 2,
						alwaysFetch: boolean = false,
						swrOptions?: SWRConfiguration,
					) => {
						return useSWR(
							user_id ? [user_id, query_type] : false,
							([userId, queryType]) => {
								const user = get().userInfos.get(userId)
								if (!alwaysFetch && user) return user

								return fetchPaddingData((params) =>
									ContactApi.getUserInfos({
										user_ids: [userId],
										query_type: queryType,
										...params,
									}),
								).then((res) => {
									res.forEach((item) => {
										userInfoService.set(item.user_id, item)
									})
									return res?.[0]
								})
							},
							{
								revalidateOnMount: true,
								revalidateOnFocus: true,
								...swrOptions,
							},
						)
					},
					/**
					 * 获取用户信息
					 * @param user_ids
					 * @param query_type
					 * @returns
					 */
					useUserInfos: () => {
						return useSWRMutation(RequestUrl.getUserInfoByIds, async (_, { arg }) => {
							if (!arg.user_ids || arg.user_ids.length === 0) return []

							return fetchPaddingData((params) =>
								ContactApi.getUserInfos({
									...arg,
									query_type: arg.query_type ?? 2,
									...params,
								}),
							).then((data) => {
								data.forEach((item) => {
									userInfoService.set(item.user_id, item)
								})
								return data
							})
						})
					},
					/**
					 * 获取好友列表
					 * @returns
					 */
					useFriends: () => {
						const { organizationCode } = useOrganization()
						return useSWRMutation(
							`[${organizationCode}]${RequestUrl.getFriends}`,
							(_, { arg }) => ContactApi.getFriends(arg),
						)
					},

					/**
					 * 获取用户加入的群组列表
					 * @returns
					 */
					useUserGroups: () => {
						const { organizationCode } = useOrganization()

						return useSWRMutation(
							`[${organizationCode}]${RequestUrl.getUserGroups}`,
							(_, { arg }) => ContactApi.getUserGroups(arg),
						)
					},
					/**
					 * 获取组织信息
					 * @returns
					 */
					useDepartmentInfos: (
						ids: string[],
						sum_type: 1 | 2 = 2,
						alwaysFetch: boolean = false,
					) => {
						return useSWRImmutable(ids.join("/"), async () => {
							if (!ids || ids.length === 0) return []

							if (alwaysFetch) {
								const promises = ids.map((id) =>
									ContactApi.getDepartmentInfo({
										department_id: id,
									}),
								)
								const data = await Promise.all(promises)
								get().cacheDepartmentInfos(data, sum_type)
								return ids.map((id) => get().departmentInfos.get(id)!)
							}

							const { true: cacheInfos = [], false: notCacheInfos = [] } = groupBy(
								ids,
								(id) => {
									const info = get().departmentInfos.get(id)
									if (!info) return false
									return sum_type === 1
										? info.employee_sum !== undefined
										: info.employee_sum_deep !== undefined
								},
							)

							const users = cacheInfos.map((id) => get().departmentInfos.get(id)!)
							console.log("useDepartmentInfos users ======> ", users)
							if (notCacheInfos.length > 0) {
								const promises = notCacheInfos.map((id) =>
									ContactApi.getDepartmentInfo({
										department_id: id,
									}),
								)

								const data = await Promise.all(promises)

								get().cacheDepartmentInfos(data, sum_type)

								users.push(
									...notCacheInfos.map((id) => get().departmentInfos.get(id)!),
								)
							}

							return users
						})
					},
					/**
					 * 用户说明书
					 * @param id
					 * @returns
					 */
					useUserManual: () => {
						return useSWRMutation(RequestUrl.getUserManual, (_, { arg }) =>
							ContactApi.getUserManual(arg),
						)
					},

					/**
					 * 部门说明书
					 * @param id 部门id
					 * @returns
					 */
					useDepartmentManual: () => {
						return useSWRMutation(RequestUrl.getDepartmentDocument, (_, { arg }) =>
							ContactApi.getDepartmentDocument(arg),
						)
					},
				}),
				{
					name: uid,
					version: ContactStoreVersion,
					storage: createIndexedDBPersistStorage(
						createStore(...genIndexedDBPersistStorageName("contact")),
						{ state: defaultState(), version: ContactStoreVersion },
					),
					partialize: (state) => ({
						userInfos: state.userInfos,
						organizations: state.organizations,
						departmentInfos: state.departmentInfos,
					}),
				},
			),
		),
	)
