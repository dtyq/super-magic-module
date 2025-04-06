import type React from "react"
import type { PaginationResponse } from "@/types/request"
import type { StructureItemType, WithIdAndDataType } from "@/types/organization"
import type { Props as InfiniteScrollProps } from "react-infinite-scroll-component"
import type { MagicListItemData as MagicListItemType } from "../MagicList/types"

/**
 * MagicInfiniteScrollList 组件的属性类型
 */
export interface MagicInfiniteScrollListProps<
	D,
	ItemR extends MagicListItemType = MagicListItemType,
	DataType extends StructureItemType = StructureItemType,
> extends Omit<Partial<InfiniteScrollProps>, "children" | "dataLength" | "next" | "hasMore"> {
	/** 初始数据 */
	data?: PaginationResponse<D>
	/** 用于加载更多数据的触发函数 */
	trigger: (params: { page_token: string }) => Promise<PaginationResponse<D>>
	/** 将原始数据项转换为列表项的函数 */
	itemsTransform: (item: D) => ItemR
	/** 点击列表项时的回调函数 */
	onItemClick?: (item: ItemR) => void
	/** 复选框选项配置 */
	checkboxOptions?: {
		/** 当前选中的项目 */
		checked?: WithIdAndDataType<ItemR, DataType>[]
		/** 选中状态变化的回调函数 */
		onChange?: (checked: WithIdAndDataType<ItemR, DataType>[]) => void
		/** 禁用的项目 */
		disabled?: WithIdAndDataType<ItemR, DataType>[]
		/** 数据类型 */
		dataType: DataType
	}
	/** 无数据时的回退内容 */
	noDataFallback?: React.ReactNode
	/** 容器高度，单位像素，默认为400 */
	containerHeight?: number
	/** 是否禁用加载更多功能 */
	disableLoadMore?: boolean
	/** 每个项目的高度，默认为60 */
	itemHeight?: number
	/** 滚动阈值，默认为50 */
	scrollThreshold?: number
	/** 自定义加载指示器 */
	loadingIndicator?: React.ReactNode
}
