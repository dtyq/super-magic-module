import MagicSearch from "@/opensource/components/base/MagicSearch"
import MagicInfiniteScrollList from "@/opensource/components/MagicInfiniteScrollList"
import type { StructureUserItem } from "@/types/organization"
import { StructureItemType } from "@/types/organization"
import type { PaginationResponse } from "@/types/request"
import { useControllableValue, useDebounce, useMemoizedFn } from "ahooks"
import { useCallback, memo, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import useSWRMutation from "swr/mutation"
import type { MagicListItemData } from "@/opensource/components/MagicList/types"
import MagicScrollBar from "@/opensource/components/base/MagicScrollBar"
import { Flex, Spin } from "antd"
import type { CSSProperties } from "react"
import { ContactApi } from "@/apis"
import type { UserSelectItem } from "../MemberDepartmentSelectPanel/types"
import type { CheckboxOptions } from "../OrganizationPanel/types"

export interface MemberSearchProps {
	onSelect?: (member: UserSelectItem) => void
	checkboxOptions?: CheckboxOptions
	noSearchFallback?: React.ReactNode
	onChangeSearchValue?: (value: string) => void
	searchValue?: string
	listClassName?: string
	className?: string
	onFocusChange?: (isFocused: boolean) => void
	showSearchResults?: boolean
	style?: CSSProperties
	containerHeight?: number
	filterResult?: (result: any) => any
}

type Data = UserSelectItem & MagicListItemData

// 定义搜索结果列表组件的Props
interface SearchResultListProps {
	debounceSearchValue: string
	listClassName?: string
	data?: PaginationResponse<StructureUserItem>
	trigger: (args: { page_token?: string }) => Promise<PaginationResponse<StructureUserItem>>
	onItemClick?: (item: UserSelectItem) => void
	checkboxOptions?: CheckboxOptions
	isSearching: boolean
	showSearchResults?: boolean
	containerHeight?: number
}

// 转换搜索结果项为列表项
const transformUserToListItem = (user: StructureUserItem): Data => {
	return {
		...user,
		dataType: StructureItemType.User,
		id: user.user_id,
		title: user.real_name,
		avatar: user.avatar_url || {
			children: user.real_name,
		},
	}
}

// 优化：将搜索结果列表拆分为单独的组件
const SearchResultList = memo(function SearchResultList({
	debounceSearchValue,
	listClassName,
	data,
	trigger,
	onItemClick,
	checkboxOptions,
	isSearching,
	showSearchResults,
	containerHeight,
}: SearchResultListProps) {
	// 如果没有搜索词，不显示搜索结果
	if (!debounceSearchValue) return null

	// 搜索已完成且没有结果才返回null
	// 初次搜索或正在加载时仍然渲染组件以触发搜索
	const hasNoResults = data && data.items && data.items.length === 0

	// 调整容器高度，确保在有搜索结果时占满剩余空间
	const containerStyle = {
		height: showSearchResults ? "calc(100% - 38px)" : "0", // 38px 是搜索框的高度
		opacity: showSearchResults ? 1 : 0,
		overflow: "hidden",
		transition: "height 0.3s ease, opacity 0.3s ease",
		flex: showSearchResults ? 1 : "none", // 让容器在显示时能占满空间
		marginBottom: 0,
		paddingBottom: 0,
		display: "flex", // 添加flex布局
		flexDirection: "column" as const, // 使用列方向排列
	}

	// 显示加载状态或搜索结果
	return (
		<div style={containerStyle}>
			<MagicScrollBar
				className={listClassName}
				style={{
					height: "100%",
					overflowY: "auto",
					flex: 1, // 让滚动容器占满空间
					display: "flex",
					flexDirection: "column",
				}}
			>
				{isSearching && !data ? (
					<Flex
						justify="center"
						align="center"
						style={{ height: "100px", width: "100%" }}
					>
						<Spin />
					</Flex>
				) : (
					<MagicInfiniteScrollList
						data={data}
						trigger={trigger}
						itemsTransform={transformUserToListItem}
						onItemClick={onItemClick}
						// @ts-ignore - MagicInfiniteScrollList 组件期望的泛型类型与我们提供的不匹配
						// 但在运行时会正常工作，因为所需属性都存在
						checkboxOptions={
							checkboxOptions
								? {
										checked: checkboxOptions.checked,
										onChange: checkboxOptions.onChange,
										disabled: checkboxOptions.disabled,
										dataType: StructureItemType.User,
								  }
								: undefined
						}
						noDataFallback={hasNoResults ? null : undefined}
						// 不设置固定高度，让列表高度自适应容器
						style={{ flex: 1 }} // 让列表占满容器空间
						containerHeight={containerHeight}
					/>
				)}
			</MagicScrollBar>
		</div>
	)
})

const MemberSearch = (props: MemberSearchProps) => {
	const { t } = useTranslation("interface")

	const {
		onSelect,
		checkboxOptions,
		listClassName,
		className,
		onFocusChange,
		showSearchResults,
		style,
		containerHeight,
	} = props

	const [searchValue, setSearchValue] = useControllableValue(props, {
		defaultValue: "",
		trigger: "onChangeSearchValue",
		valuePropName: "searchValue",
	})

	// 添加焦点状态管理
	const [isFocused, setIsFocused] = useState(false)

	// 当焦点状态变化时通知父组件
	useEffect(() => {
		onFocusChange?.(isFocused)
	}, [isFocused, onFocusChange])

	// 优化：增加防抖时间至800ms，减少搜索请求频率
	const debounceSearchValue = useDebounce(searchValue, {
		wait: 800,
	})

	// 添加搜索状态管理
	const [isSearching, setIsSearching] = useState(false)
	// 存储当前搜索结果
	const [searchResults, setSearchResults] = useState<
		PaginationResponse<StructureUserItem> | undefined
	>()

	// 使用 useSWRMutation 但不直接使用其返回的 data
	const { trigger: searchUser } = useSWRMutation<
		PaginationResponse<StructureUserItem>,
		any,
		string | false,
		{ page_token?: string; query: string; query_type: 1 | 2 }
	>(debounceSearchValue ? `searchUser/${debounceSearchValue}` : false, (_, { arg }) => {
		return ContactApi.searchUser(arg)
	})

	// 搜索值变化时重置搜索结果并触发新搜索
	useEffect(() => {
		if (debounceSearchValue) {
			// 设置搜索状态为正在搜索
			setIsSearching(true)
			// 清空当前结果，避免显示上次的搜索结果
			setSearchResults(undefined)

			searchUser({
				query: debounceSearchValue,
				query_type: 1,
				page_token: "",
			})
				.then((result) => {
					if (props.filterResult) {
						result.items = props.filterResult(result.items)
					}
					setSearchResults(result)
					setIsSearching(false)
				})
				.catch(() => {
					setIsSearching(false)
				})
		} else {
			// 无搜索词时清空结果
			setSearchResults(undefined)
			setIsSearching(false)
		}
	}, [debounceSearchValue, searchUser])

	const trigger = useCallback(
		({ page_token = "" }: { page_token?: string }) => {
			if (!debounceSearchValue)
				return Promise.resolve({ items: [], has_more: false, page_token: "" })

			// 如果请求更多页，不重置当前结果
			if (page_token) {
				return searchUser({
					query: debounceSearchValue,
					query_type: 1,
					page_token,
				}).then((result) => {
					// 更新搜索结果
					setSearchResults((prev) => {
						if (!prev) return result
						return {
							...result,
							items: [...prev.items, ...result.items],
						}
					})
					return result
				})
			}

			// 首页请求逻辑
			setIsSearching(true)
			return searchUser({
				query: debounceSearchValue,
				query_type: 1,
				page_token,
			})
				.then((result) => {
					setSearchResults(result)
					setIsSearching(false)
					return result
				})
				.catch((err) => {
					setIsSearching(false)
					throw err
				})
		},
		[debounceSearchValue, searchUser],
	)

	const handleSearchChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value)
	})

	// 处理搜索框焦点事件
	const handleFocus = useMemoizedFn(() => {
		setIsFocused(true)
	})

	// 处理搜索框失焦事件
	const handleBlur = useMemoizedFn(() => {
		setIsFocused(false)
	})

	// 处理点击列表项
	const handleItemClick = useMemoizedFn((item: UserSelectItem) => {
		onSelect?.(item)
	})

	return (
		<Flex vertical gap={10} className={className} style={style}>
			<MagicSearch
				value={searchValue}
				onChange={handleSearchChange}
				onFocus={handleFocus}
				onBlur={handleBlur}
				allowClear
				placeholder={t("memberSearch.searchMembers")}
			/>
			<SearchResultList
				debounceSearchValue={debounceSearchValue}
				listClassName={listClassName}
				data={searchResults}
				trigger={trigger}
				onItemClick={handleItemClick}
				checkboxOptions={checkboxOptions}
				isSearching={isSearching}
				showSearchResults={showSearchResults}
				containerHeight={containerHeight}
			/>
		</Flex>
	)
}

const MemoizedMemberSearch = memo(MemberSearch)
export default MemoizedMemberSearch
