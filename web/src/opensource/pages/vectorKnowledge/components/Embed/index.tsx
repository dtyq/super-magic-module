import { IconLoader, IconCircleCheck, IconCircleX } from "@tabler/icons-react"
import { Flex, Button, Spin } from "antd"
import { useState, useEffect, useRef } from "react"
import { LoadingOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { RoutePath } from "@/const/routes"
import { useMemoizedFn } from "ahooks"
import { fileTypeIconsMap, documentSyncStatusMap } from "../../constant"
import { useVectorKnowledgeEmbedStyles } from "./styles"
import type { CreatedKnowledge } from "../Create"
import { KnowledgeApi } from "@/apis"
import type { Knowledge } from "@/types/knowledge"

interface Props {
	createdKnowledge: CreatedKnowledge
}

export default function VectorKnowledgeEmbed({ createdKnowledge }: Props) {
	const { styles } = useVectorKnowledgeEmbedStyles()

	const navigate = useNavigate()

	/** 是否嵌入完成 */
	const [isEmbed, setIsEmbed] = useState(false)
	/** 知识库文档列表 */
	const [documentList, setDocumentList] = useState<Knowledge.EmbedDocumentDetail[]>(
		createdKnowledge.fileList || [],
	)
	/** 轮询定时器引用 */
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	/** 查看知识库 - 跳转至详情页 */
	const handleViewKnowledge = useMemoizedFn(() => {
		navigate(RoutePath.VectorKnowledgeDetail, {
			state: {
				code: createdKnowledge.code,
			},
		})
	})

	/** 获取文档同步状态图标 */
	const getStatusIcon = (syncStatus: documentSyncStatusMap) => {
		switch (syncStatus) {
			case documentSyncStatusMap.Pending:
			case documentSyncStatusMap.Processing:
				return <Spin indicator={<LoadingOutlined spin />} />
			case documentSyncStatusMap.Success:
				return <IconCircleCheck className={styles.icon} color="#32C436" size={24} />
			case documentSyncStatusMap.Failed:
				return <IconCircleX color="#FF4D4F" size={24} />
		}
	}

	/** 更新知识库文档列表的嵌入状态 */
	const updateKnowledgeDocumentList = useMemoizedFn(async () => {
		const res = await KnowledgeApi.getKnowledgeDocumentList({
			code: createdKnowledge.code,
		})
		if (res) {
			setDocumentList(res.list)
			setIsEmbed(
				res.list.length > 0 &&
					res.list.every((item) => item.sync_status === documentSyncStatusMap.Success),
			)
		}
	})

	/** 开始轮询 */
	const startPolling = useMemoizedFn(() => {
		// 随机2-5秒
		const randomTime = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000
		timerRef.current = setTimeout(async () => {
			await updateKnowledgeDocumentList()
			// 如果还没嵌入完成，继续轮询
			if (!isEmbed) {
				startPolling()
			}
		}, randomTime)
	})

	/** 停止轮询 */
	const stopPolling = useMemoizedFn(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
	})

	// 组件挂载时开始轮询，组件卸载或isEmbed为true时停止轮询
	useEffect(() => {
		// 初始调用一次接口
		updateKnowledgeDocumentList()
		// 开始轮询
		startPolling()

		// 组件卸载时清除定时器
		return () => {
			stopPolling()
		}
	}, [])

	// 当isEmbed状态变为true时，停止轮询
	useEffect(() => {
		if (isEmbed) {
			stopPolling()
		}
	}, [isEmbed])

	return (
		<Flex vertical justify="space-between" className={styles.container}>
			<div className={styles.header}>
				<div className={styles.headerTitle}>🎉 向量知识库已创建</div>
				<Flex align="center" justify="space-between">
					<div className={styles.knowledgeInfo}>
						<img className={styles.knowledgeIcon} src={createdKnowledge.icon} alt="" />
						<div className={styles.knowledgeDetail}>
							<div className={styles.knowledgeLabel}>知识库名称</div>
							<div className={styles.knowledgeName}>{createdKnowledge.name}</div>
						</div>
					</div>

					<Button type="primary" onClick={handleViewKnowledge}>
						查看知识库
					</Button>
				</Flex>
			</div>

			<div className={styles.fileList}>
				<div className={styles.fileListContent}>
					{documentList.length > 0 ? (
						<>
							<div className={styles.statusSection}>
								{isEmbed ? (
									<div className={styles.statusInfo}>
										<IconCircleCheck color="#32C436" size={24} />
										<div>嵌入已完成</div>
									</div>
								) : (
									<div className={styles.statusInfo}>
										<IconLoader size={24} />
										<div>嵌入处理中...</div>
									</div>
								)}
							</div>
							<div>
								{documentList.map((file) => (
									<Flex
										key={file.id}
										align="center"
										justify="space-between"
										className={styles.fileItem}
									>
										<div className={styles.fileInfo}>
											{fileTypeIconsMap[file.name.split(".").pop()!]}
											<div>{file.name}</div>
										</div>
										<div>{getStatusIcon(file.sync_status)}</div>
									</Flex>
								))}
							</div>
						</>
					) : (
						<div className={styles.empty}>
							<div>暂无文档</div>
						</div>
					)}
				</div>
			</div>
		</Flex>
	)
}
