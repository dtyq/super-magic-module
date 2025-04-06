import { Flex } from "antd"
import type { HTMLAttributes } from "react"
import { memo, useMemo, useState } from "react"
import { useMemoizedFn } from "ahooks"
import { nanoid } from "nanoid"
import chatTopicService from "@/opensource/services/chat/topic"
import ConversationStore from "@/opensource/stores/chatNew/conversation"
import MessageEditor from "../MessageEditor"
import { useStyles } from "./style"
import Header from "./components/Header"
import WaterfallList from "./components/WaterfallList"
import { data } from "./image_prompt.json"

export interface Image {
	id: string
	url: string
	prompt: string
	height?: number
}

interface AiImageStartPageProps extends HTMLAttributes<HTMLDivElement> {
	disabled: boolean
}

const AiImageStartPage = memo(({ disabled }: AiImageStartPageProps) => {
	const { styles } = useStyles()


	const dataset = useMemo(() => {
		return data.map((item) => ({
			...item,
			images: item.images.map((image) => {
				return {
					...image,
					id: nanoid(),
				}
			}),
		}))
	}, [])

	const [currentType, setCurrentType] = useState<string>(dataset[0].id)

	const tags = useMemo(() => {
		return dataset.map((item) => ({ id: item.id, type: item.type }))
	}, [dataset])

	const selectType = useMemoizedFn((id: string) => {
		setCurrentType(id)
	})
	const images = useMemo(
		() => dataset.find((item) => item.id === currentType)?.images || [],
		[currentType, dataset],
	)

	const onImageClick = useMemoizedFn((prompt: string) => {
		chatTopicService.createTopic?.().then(() => {
			ConversationStore.setSelectText(prompt)
		})
	})

	return (
		<Flex className={styles.container} vertical flex={1}>
			<div className={styles.topMask} />
			<Header tags={tags} selectType={selectType} currentType={currentType} />
			<WaterfallList data={images} onImageClick={onImageClick} />
			<MessageEditor
				className={styles.editor}
				inputClassName={styles.mainInput}
				disabled={disabled}
			/>
			<div className={styles.bottomMask} />
		</Flex>
	)
})

export default AiImageStartPage
