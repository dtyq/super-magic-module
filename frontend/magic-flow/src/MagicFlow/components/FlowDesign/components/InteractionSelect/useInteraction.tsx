/**
 * 用户偏好设置相关状态和行为管理
 */
import { localStorageKeyMap } from "@/MagicFlow/constants"
import { useMemoizedFn, useMount, useUpdateEffect } from "ahooks"
import { useState } from "react"
import { Interactions } from "."

type InteractionProps = {
	nodeClick: boolean
}

export default function useInteraction({ nodeClick }: InteractionProps) {
	const [interaction, setInteraction] = useState(Interactions.TouchPad)

	const [openInteractionSelect, setOpenInteractionSelect] = useState(false)

	const onInteractionChange = useMemoizedFn((updatedInteraction: Interactions) => {
		localStorage.setItem(localStorageKeyMap.InteractionMode, updatedInteraction)
		setInteraction(updatedInteraction)
	})

	const getInteractionMode = useMemoizedFn(() => {
		const storageInteraction = localStorage.getItem(localStorageKeyMap.InteractionMode)
		if (storageInteraction) {
			return storageInteraction as any
		}
		return Interactions.TouchPad
	})

	useMount(() => {
		setInteraction(getInteractionMode())
	})

	useUpdateEffect(() => {
		setOpenInteractionSelect(false)
	}, [nodeClick])

	return {
		interaction,
		onInteractionChange,
		setOpenInteractionSelect,
		openInteractionSelect,
	}
}
