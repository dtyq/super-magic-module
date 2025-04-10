import MagicButton from "@/opensource/components/base/MagicButton"
import MagicModal from "@/opensource/components/base/MagicModal"
import OrganizationPanel from "@/opensource/components/business/OrganizationPanel"
import { isDepartment, isMember } from "@/opensource/components/business/OrganizationPanel/utils"
import { useMemoizedFn } from "ahooks"
import { Divider, Flex, Form, Input, type ModalProps } from "antd"
import { useForm } from "antd/es/form/Form"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { CreateGroupConversationParams as FormValues } from "@/types/chat/seen_message"
import { CreateGroupConversationParamKey as ParamKey } from "@/opensource/apis/modules/chat/types"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import { RoutePath } from "@/const/routes"
import type { OrganizationSelectItem } from "@/opensource/components/business/MemberDepartmentSelectPanel/types"
import SelectItemTag from "@/opensource/components/business/MemberDepartmentSelectPanel/components/SelectItemTag"
import MemberSearch from "@/opensource/components/business/SearchMember"
import ConversationService from "@/opensource/services/chat/conversation/ConversationService"
import { ChatApi } from "@/opensource/apis"
import { defaultFormValues } from "./utils"
import useStyles from "./styles"

interface CreateGroupConversationProps extends ModalProps {
	close?: () => void
}

function CreateGroupConversationModal({ open, close, ...props }: CreateGroupConversationProps) {
	const { t } = useTranslation("interface")
	const { styles } = useStyles()
	const initialValues = useRef(defaultFormValues())

	const navigate = useNavigate()

	const [form] = useForm<FormValues>()
	const [organizationChecked, setOrganizationChecked] = useState<OrganizationSelectItem[]>([])

	/**
	 * 关闭弹窗
	 */
	const closeModal = useMemoizedFn(() => {
		form.resetFields()
		setOrganizationChecked([])
		close?.()
	})

	/**
	 * 确认创建
	 */
	const onConfirm = useMemoizedFn(() => {
		form.validateFields().then((values) => {
			ChatApi.createGroupConversation(values).then((data) => {
				const conversationId = data.seq.conversation_id

				ChatApi.getConversationList([conversationId]).then((res) => {
					const conversation = res.items[0]
					// 跳转到会话页面
					if (conversation) {
						ConversationService.switchConversation(
							ConversationService.addNewConversation(conversation),
						)
						navigate(RoutePath.Chat)
					}
					closeModal?.()
				})
			})
		})
	})

	/**
	 * 组织架构面板选中状态
	 */
	const organizationPanelCheckboxOptions = useMemo(
		() => ({
			checked: organizationChecked,
			onChange: setOrganizationChecked,
			disabled: [],
		}),
		[organizationChecked],
	)

	useEffect(() => {
		const userIds = [] as string[]
		const departmentIds = [] as string[]

		organizationChecked.forEach((item) => {
			if (isMember(item)) {
				userIds.push(item.id)
			} else if (isDepartment(item)) {
				departmentIds.push(item.id)
			}
		})

		form.setFieldValue(ParamKey.user_ids, userIds)
		form.setFieldValue(ParamKey.department_ids, departmentIds)
	}, [form, organizationChecked])

	// const [imageUrl] = useState<string>()

	/**
	 * 取消创建
	 */
	const onCancel = useMemoizedFn(() => {
		closeModal?.()
	})

	const [searchValue, setSearchValue] = useState("")

	useEffect(() => {
		if (open) {
			setSearchValue("")
			setOrganizationChecked([])
			form.resetFields()
		}
	}, [open])

	const shouldShowDefaultEmptyFallback = !searchValue

	return (
		<MagicModal
			className={styles.modal}
			centered
			maskClosable={false}
			title={t("sider.createGroupConversation", { ns: "interface" })}
			open={open}
			onOk={onConfirm}
			onCancel={close}
			footer={null}
			width={760}
			{...props}
		>
			<Flex className={styles.container}>
				<Flex
					vertical
					gap={5}
					flex={1}
					className={styles.left}
					style={{ position: "relative", overflow: "hidden" }}
				>
					<MemberSearch
						searchValue={searchValue}
						onChangeSearchValue={setSearchValue}
						checkboxOptions={organizationPanelCheckboxOptions}
						listClassName={styles.panelWrapper}
						showSearchResults={!shouldShowDefaultEmptyFallback}
						style={{ display: "flex", flexDirection: "column", height: "100%" }}
						containerHeight={380}
						filterResult={(result) => {
							return result.filter((item:any) => {
								return !item.ai_code
							})
						}}
					/>
					<div
						className={styles.fadeWrapper}
						style={{
							opacity: shouldShowDefaultEmptyFallback ? 1 : 0,
							visibility: shouldShowDefaultEmptyFallback ? "visible" : "hidden",
							position: "absolute",
							width: "100%",
							top: "32px", // 搜索框高度
							left: "0",
							right: "0",
							bottom: "0",
							padding: "0",
							margin: "0",
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							zIndex: shouldShowDefaultEmptyFallback ? 1 : -1,
						}}
					>
						<OrganizationPanel
							className={styles.organizationList}
							checkboxOptions={organizationPanelCheckboxOptions}
						/>
					</div>
				</Flex>
				<div className={styles.rightContainer}>
					<div className={styles.formContainer}>
						<Form
							form={form}
							className={styles.form}
							initialValues={initialValues.current}
						>
							<Form.Item noStyle name={ParamKey.user_ids} />
							<Form.Item noStyle name={ParamKey.department_ids} />
							<Form.Item noStyle name={ParamKey.group_type} />
							<Flex align="center" gap={10} style={{ marginBottom: 16 }}>
								<Form.Item
									name={ParamKey.group_avatar}
									label={t("form.groupAvatar", { ns: "interface" })}
									noStyle
								>
									{/* Upload component commented out */}
								</Form.Item>
							</Flex>
							<Form.Item
								name={ParamKey.group_name}
								label={t("form.groupName", { ns: "interface" })}
								style={{ marginBottom: 16 }}
							>
								<Input
									placeholder={t("form.placeholder.groupName", {
										ns: "interface",
									})}
								/>
							</Form.Item>
							<Divider className={styles.divider} style={{ margin: "16px 0" }} />
							<Flex gap={4} wrap="wrap" style={{ paddingBottom: 16 }}>
								{organizationChecked.map((item) => (
									<SelectItemTag
										key={item.id}
										data={item}
										onClose={() => {
											setOrganizationChecked(
												organizationChecked.filter((i) => i.id !== item.id),
											)
										}}
									/>
								))}
							</Flex>
						</Form>
					</div>
					<Flex align="center" justify="flex-end" gap={10} className={styles.footer}>
						<MagicButton type="default" onClick={onCancel}>
							{t("button.cancel", { ns: "interface" })}
						</MagicButton>
						<MagicButton type="primary" onClick={onConfirm}>
							{t("button.create", { ns: "interface" })}
						</MagicButton>
					</Flex>
				</div>
			</Flex>
		</MagicModal>
	)
}

export default CreateGroupConversationModal
