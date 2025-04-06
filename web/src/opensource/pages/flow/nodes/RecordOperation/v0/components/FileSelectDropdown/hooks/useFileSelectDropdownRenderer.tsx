import { useDebounceEffect, useMemoizedFn } from "ahooks"
import type React from "react"
import type { Dispatch, SetStateAction } from "react"
import { useState } from "react"
import type { File } from "@/types/sheet"
import type { DefaultOptionType } from "antd/lib/select"
import { FlowApi } from "@/apis"

type DropdownRenderProps = {
	spaceType: File.SpaceType
	setFileOptions: Dispatch<SetStateAction<DefaultOptionType[]>>
	fileType: File.FileType
}

export default function useFileSelectDropdownRenderer({
	spaceType,
	fileType,
	setFileOptions,
}: DropdownRenderProps) {
	// 搜索关键词
	const [keyword, setKeyword] = useState("")

	// 创建一个防抖函数，避免频繁执行
	const debouncedSearch = useMemoizedFn(async (value) => {
		if (!value) return
		const response = await FlowApi.getFiles({
			name: value,
			file_type: fileType,
			space_type: spaceType,
		})
		if (response?.list) {
			setFileOptions(
				response.list.map((f) => ({
					label: f.name,
					value: f.id,
				})),
			)
		}
	})

	// 使用 useMemoizedFn 包装 onSearchChange，保持引用稳定
	const onSearchChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target
		setKeyword(value)
	})

	useDebounceEffect(
		() => {
			debouncedSearch(keyword)
		},
		[keyword],
		{
			wait: 200,
		},
	)

	return {
		keyword,
		setKeyword,
		onSearchChange,
		debouncedSearch,
	}
}
