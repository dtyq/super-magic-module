import { useEffect, useMemo, useRef, useState } from "react"
import { Table, Input, Button, Flex, Tag, message, Dropdown, Modal } from "antd"
import { IconPlus, IconChevronLeft, IconChevronDown, IconDots } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import { replaceRouteParams } from "@/utils/route"
import { RoutePath } from "@/const/routes"
import { FlowRouteType } from "@/types/flow"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { useSearchParams } from "react-router-dom"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import { genFileData } from "@/opensource/pages/chatNew/components/MessageEditor/MagicInput/components/InputFiles/utils"
import { useUpload } from "@/opensource/hooks/useUploadFiles"
import { useTranslation } from "react-i18next"
import { fileTypeIconsMap, documentSyncStatusMap } from "../../constant"
import SubSider from "../SubSider"
import { useVectorKnowledgeDetailStyles } from "./styles"
import Setting from "../Setting"
import type { Knowledge } from "@/types/knowledge"
import { KnowledgeApi } from "@/apis"
import DocumentUpload from "../Upload/DocumentUpload"

export default function VectorKnowledgeDetail() {
	const { styles } = useVectorKnowledgeDetailStyles()

	const [searchParams] = useSearchParams()
	const knowledgeBaseCode = searchParams.get("code") || ""

	const navigate = useNavigate()

	const { t } = useTranslation("flow")

	const [knowledgeDetail, setKnowledgeDetail] = useState<Knowledge.Detail>()

	const [tableData, setTableData] = useState<Knowledge.EmbedDocumentDetail[]>([])

	const [searchText, setSearchText] = useState("")

	const [currentDetailPage, setCurrentDetailPage] = useState<"document" | "setting">("document")

	const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

	const [pageInfo, setPageInfo] = useState<{
		page: number
		pageSize: number
		total: number
	}>({
		page: 1,
		pageSize: 10,
		total: 0,
	})

	// 搜索处理
	const handleSearch = useMemoizedFn((value: string) => {
		setSearchText(value)
	})

	// 删除文档
	const handleDeleteFile = useMemoizedFn(async (code: string, name?: string) => {
		await KnowledgeApi.deleteKnowledgeDocument({
			knowledge_code: knowledgeBaseCode,
			document_code: code,
		})
		if (name) {
			message.success(t("knowledgeDatabase.deleteDocumentSuccess", { name }))
		}
	})

	// 删除单个文档
	const handleDeleteSingleFile = useMemoizedFn(async (record: Knowledge.EmbedDocumentDetail) => {
		Modal.confirm({
			title: t("knowledgeDatabase.deleteDocument"),
			content: t("knowledgeDatabase.confirmDeleteDocument", { name: record.name }),
			onOk: async () => {
				await handleDeleteFile(record.code)
				getKnowledgeDocumentList(
					knowledgeBaseCode,
					searchText,
					pageInfo.page,
					pageInfo.pageSize,
				)
			},
		})
	})

	// 批量删除文档
	const handleBatchDelete = useMemoizedFn(() => {
		if (selectedRowKeys.length) {
			Modal.confirm({
				title: t("knowledgeDatabase.deleteDocument"),
				content: t("knowledgeDatabase.confirmBatchDelete", {
					count: selectedRowKeys.length,
				}),
				onOk: async () => {
					await Promise.all(selectedRowKeys.map((code) => handleDeleteFile(code)))
					message.success(t("common.deleteSuccess"))
					getKnowledgeDocumentList(
						knowledgeBaseCode,
						searchText,
						pageInfo.page,
						pageInfo.pageSize,
					)
				},
			})
		} else {
			message.warning(t("knowledgeDatabase.selectDeleteDocument"))
		}
	})

	// 获取文档状态标签
	const getStatusTag = (syncStatus: number) => {
		switch (syncStatus) {
			case documentSyncStatusMap.Pending:
				return (
					<Tag className={styles.statusTag} bordered={false} color="default">
						{t("knowledgeDatabase.syncStatus.pending")}
					</Tag>
				)
			case documentSyncStatusMap.Processing:
				return (
					<Tag className={styles.statusTag} bordered={false} color="processing">
						{t("knowledgeDatabase.syncStatus.processing")}
					</Tag>
				)
			case documentSyncStatusMap.Success:
				return (
					<Tag className={styles.statusTag} bordered={false} color="success">
						{t("knowledgeDatabase.syncStatus.available")}
					</Tag>
				)
			case documentSyncStatusMap.Failed:
				return (
					<Tag className={styles.statusTag} bordered={false} color="error">
						{t("knowledgeDatabase.syncStatus.failed")}
					</Tag>
				)
		}
	}

	/**
	 * 分页改变
	 */
	const handlePageChange = useMemoizedFn((page: number, pageSize: number) => {
		setPageInfo((prev) => ({
			...prev,
			page,
			pageSize,
		}))
	})

	/**
	 * 上一步 - 返回上一页
	 */
	const handleBack = useMemoizedFn(() => {
		navigate(
			replaceRouteParams(RoutePath.Flows, {
				type: FlowRouteType.VectorKnowledge,
			}),
		)
	})

	/**
	 * 更新知识库详情
	 */
	const updateKnowledgeDetail = useMemoizedFn(async (code: string) => {
		const res = await KnowledgeApi.getKnowledgeDetail(code)
		if (res) {
			setKnowledgeDetail(res)
		}
	})

	/**
	 * 获取知识库文档列表
	 */
	const getKnowledgeDocumentList = useMemoizedFn(
		async (code: string, name: string, page: number, pageSize: number) => {
			const res = await KnowledgeApi.getKnowledgeDocumentList({
				code,
				name: name || undefined,
				page,
				pageSize,
			})
			if (res) {
				// 只更新tableData中已有的文档
				if (tableData.length > 0 && res.page !== pageInfo.page) {
					// 创建文档编码映射，用于快速查找
					const tableDataMap = new Map(tableData.map((item) => [item.code, item]))

					// 使用映射更新文档
					const updatedTableData = [...tableData]
					let hasUpdates = false

					res.list.forEach((newItem) => {
						if (tableDataMap.has(newItem.code)) {
							// 找到当前文档在数组中的索引
							const index = updatedTableData.findIndex(
								(item) => item.code === newItem.code,
							)
							if (index !== -1) {
								// 更新文档
								updatedTableData[index] = newItem
								hasUpdates = true
							}
						}
					})

					// 只有在有更新时才设置状态
					if (hasUpdates) {
						setTableData(updatedTableData)
					}
				} else {
					// 初始化时直接设置数据
					setTableData(res.list)
				}

				setPageInfo((prev) => ({
					...prev,
					total: res.total,
				}))
			}
		},
	)

	const { uploadAndGetFileUrl } = useUpload({
		storageType: "private",
	})

	/** 上传文件 */
	const handleFileUpload = useMemoizedFn(async (file: File) => {
		// 上传文件
		const newFile = genFileData(file)
		// 已通过 beforeFileUpload 预校验，故传入 () => true 跳过方法校验
		const { fullfilled } = await uploadAndGetFileUrl([newFile], () => true)
		// 更新上传的文件列表状态
		if (fullfilled && fullfilled.length) {
			const { path } = fullfilled[0].value
			const res = await KnowledgeApi.addKnowledgeDocument({
				knowledge_code: knowledgeBaseCode,
				enabled: true,
				document_file: {
					name: file.name,
					key: path,
				},
			})
			if (res) {
				message.success(t("knowledgeDatabase.uploadSuccess"))
				getKnowledgeDocumentList(
					knowledgeBaseCode,
					searchText,
					pageInfo.page,
					pageInfo.pageSize,
				)
			}
		}
	})

	const rightContainerRef = useRef<HTMLDivElement>(null)
	const headerRef = useRef<HTMLDivElement>(null)
	const [tableHeight, setTableHeight] = useState<number | string>("100%")

	// 计算表格高度
	useEffect(() => {
		const calculateTableHeight = () => {
			if (rightContainerRef.current && headerRef.current) {
				const containerHeight = rightContainerRef.current.clientHeight
				const headerHeight = headerRef.current.clientHeight
				const tableHeaderHeight = 45 // 表格头部高度，根据实际调整
				const paginationHeight = 64 // 分页器高度，根据实际调整
				const padding = 40 // 根据实际内边距调整
				setTableHeight(
					containerHeight - headerHeight - tableHeaderHeight - paginationHeight - padding,
				)
			}
		}

		calculateTableHeight()
		window.addEventListener("resize", calculateTableHeight)

		return () => {
			window.removeEventListener("resize", calculateTableHeight)
		}
	}, [])

	useEffect(() => {
		if (knowledgeBaseCode) {
			updateKnowledgeDetail(knowledgeBaseCode)
		}
	}, [knowledgeBaseCode])

	useEffect(() => {
		if (knowledgeBaseCode) {
			getKnowledgeDocumentList(
				knowledgeBaseCode,
				searchText,
				pageInfo.page,
				pageInfo.pageSize,
			)
		}
	}, [knowledgeBaseCode, searchText, pageInfo.page, pageInfo.pageSize])

	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		if (
			tableData.length &&
			tableData.some((item) =>
				[documentSyncStatusMap.Pending, documentSyncStatusMap.Processing].includes(
					item.sync_status,
				),
			)
		) {
			// 清除之前的timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}

			// 设置新的timeout并保存引用
			timeoutRef.current = setTimeout(() => {
				getKnowledgeDocumentList(
					knowledgeBaseCode,
					searchText,
					pageInfo.page,
					pageInfo.pageSize,
				)
			}, 5000)
		}

		// 组件卸载时清除timeout
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [tableData])

	// 表格列定义
	const columns = [
		{
			title: t("knowledgeDatabase.documentTitle"),
			dataIndex: "name",
			key: "name",
			width: 300,
			render: (name: string) => (
				<Flex align="center">
					<span className={styles.fileTypeIcon}>
						{fileTypeIconsMap[name.split(".").pop() || ""]}
					</span>
					{name}
				</Flex>
			),
		},
		{
			title: t("knowledgeDatabase.wordCount"),
			dataIndex: "word_count",
			key: "word_count",
			width: 160,
		},
		{
			title: t("knowledgeDatabase.createTime"),
			dataIndex: "created_at",
			key: "created_at",
			width: 200,
		},
		{
			title: t("knowledgeDatabase.status"),
			dataIndex: "sync_status",
			key: "sync_status",
			width: 120,
			render: getStatusTag,
		},
		{
			title: t("knowledgeDatabase.operation"),
			key: "operation",
			width: 100,
			render: (_: any, record: Knowledge.EmbedDocumentDetail) => (
				<Dropdown
					menu={{
						items: [
							{
								label: (
									<div className={styles.deleteText}>
										{t("knowledgeDatabase.delete")}
									</div>
								),
								key: "delete",
								onClick: () => handleDeleteSingleFile(record),
							},
						],
					}}
				>
					<Flex align="center" justify="center" className={styles.operationButton}>
						<IconDots size={20} />
					</Flex>
				</Dropdown>
			),
		},
	]

	const PageContent = useMemo(() => {
		if (currentDetailPage === "document") {
			return (
				<Flex vertical className={styles.rightContainer} ref={rightContainerRef}>
					<div ref={headerRef}>
						<div className={styles.title}>{t("knowledgeDatabase.documentTitle")}</div>
						<div className={styles.subTitle}>{t("knowledgeDatabase.documentDesc")}</div>

						<Flex align="center" justify="space-between">
							<Input
								className={styles.searchBar}
								placeholder={t("knowledgeDatabase.search")}
								onChange={(e) => handleSearch(e.target.value)}
								allowClear
							/>
							<Flex align="stretch" gap={10}>
								<Dropdown
									menu={{
										items: [
											{
												label: (
													<div className={styles.deleteText}>
														{t("knowledgeDatabase.delete")}
													</div>
												),
												key: "delete",
												onClick: () => handleBatchDelete(),
											},
										],
									}}
								>
									<Flex align="center" gap={4} className={styles.batchOperation}>
										<div>{t("knowledgeDatabase.batchOperation")}</div>
										<IconChevronDown size={16} />
									</Flex>
								</Dropdown>
								<DocumentUpload handleFileUpload={handleFileUpload} dragger={false}>
									<Button type="primary" icon={<IconPlus size={16} />}>
										{t("knowledgeDatabase.addDocument")}
									</Button>
								</DocumentUpload>
							</Flex>
						</Flex>
					</div>

					<div className={styles.tableContainer}>
						<Table
							rowKey="code"
							rowSelection={{
								selectedRowKeys,
								onChange: (codes) => setSelectedRowKeys(codes as string[]),
							}}
							columns={columns}
							dataSource={tableData}
							scroll={{ scrollToFirstRowOnChange: true, y: tableHeight }}
							pagination={{
								position: ["bottomLeft"],
								total: pageInfo.total,
								pageSize: pageInfo.pageSize,
								showSizeChanger: true,
								showQuickJumper: false,
								pageSizeOptions: ["10", "20", "50"],
								onChange: handlePageChange,
							}}
						/>
					</div>
				</Flex>
			)
		}

		if (currentDetailPage === "setting") {
			return (
				<div className={styles.rightContainer}>
					<Setting
						knowledgeBaseCode={knowledgeBaseCode}
						updateKnowledgeDetail={updateKnowledgeDetail}
					/>
				</div>
			)
		}

		return null
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedRowKeys, columns, tableData, handleSearch, handleBatchDelete, currentDetailPage])

	return (
		<Flex className={styles.wrapper}>
			<Flex vertical className={styles.leftContainer}>
				<Flex className={styles.header} align="center" gap={14}>
					<MagicIcon
						component={IconChevronLeft}
						size={24}
						className={styles.arrow}
						onClick={handleBack}
					/>
					<div>{t("common.knowledgeDatabase")}</div>
				</Flex>
				{knowledgeDetail && (
					<SubSider
						knowledgeDetail={knowledgeDetail}
						setCurrentDetailPage={setCurrentDetailPage}
					/>
				)}
			</Flex>
			{PageContent}
		</Flex>
	)
}
