import { Flex, Form, Input } from "antd"
import { useTranslation } from "react-i18next"
import { useBoolean, useMemoizedFn } from "ahooks"
import MagicModal from "@/opensource/components/base/MagicModal"
import type { OpenableProps } from "@/utils/react"
import IconWarning from "@/enhance/tabler/icons-react/icons/IconWarning"
import MagicButton from "@/opensource/components/base/MagicButton"
import { useMemo, useState } from "react"

import { colorScales } from "@/opensource/providers/ThemeProvider/colors"
import { useStyles } from "./styles"

interface DeleteDangerModalProps {
	// 删除内容
	content: string
	// 是否二次确认
	needConfirm?: boolean
	onSubmit?: () => void
}

function DeleteDangerModal({
	content,
	needConfirm = false,
	onSubmit,
	onClose,
	...props
}: OpenableProps<DeleteDangerModalProps>) {
	const { styles } = useStyles()
	const { t } = useTranslation("interface")
	const [form] = Form.useForm()
	const [open, { setFalse }] = useBoolean(true)
	const [focus, { setTrue: openFocus, setFalse: closeFocus }] = useBoolean(false)
	const [confirmText, setConfirmText] = useState<string>("")

	const onCancel = useMemoizedFn(() => {
		setFalse()
		closeFocus()
		onClose?.()
	})

	const onConfirm = useMemoizedFn(() => {
		onSubmit?.()
		onCancel()
	})

	const disable = useMemo(() => {
		return needConfirm ? !(confirmText === content) : false
	}, [content, confirmText, needConfirm])

	const footer = useMemoizedFn(() => (
		<Flex justify="end" gap={12}>
			<MagicButton onClick={onCancel} type="text" className={styles.button}>
				{t("button.cancel")}
			</MagicButton>
			<MagicButton disabled={disable} onClick={onConfirm} className={styles.dangerButton}>
				{t("deleteConfirm")}
			</MagicButton>
		</Flex>
	))

	return (
		<MagicModal
			className={styles.modal}
			centered
			maskClosable={false}
			open={open}
			onOk={onConfirm}
			onCancel={onCancel}
			width={400}
			destroyOnClose
			footer={footer}
			{...props}
		>
			<Flex gap={12}>
				<IconWarning size={24} color={colorScales.orange[5]} />
				<Flex vertical gap={8}>
					<div className={styles.title}>{t("deleteConfirmTitle")}</div>
					{needConfirm && (
						<>
							<div className={styles.desc}>
								<span>{t("deleteConfirmTip1")} </span>
								<span className={styles.content}>{content}</span>
								<span> {t("deleteConfirmTip2")}</span>
							</div>
							<Form form={form} requiredMark={false}>
								<Form.Item
									name="confirm"
									noStyle
									rules={[
										() => ({
											validator(_, value) {
												if (!value || content === value) {
													return Promise.resolve()
												}
												return Promise.reject(new Error(t("diffTip")))
											},
										}),
									]}
								>
									{!focus ? (
										<Flex
											align="center"
											className={styles.fakeInput}
											onClick={openFocus}
										>
											<span>{t("pleaseInput1")} </span>
											<span className={styles.content}>{content}</span>
											<span> {t("pleaseInput2")}</span>
										</Flex>
									) : (
										<Input
											className={styles.input}
											autoFocus
											onChange={(e) => setConfirmText(e.target.value)}
										/>
									)}
								</Form.Item>
							</Form>
						</>
					)}
					{!needConfirm && (
						<div className={styles.desc}>
							<span>{t("deleteConfirm")} </span>
							<span className={styles.content}>{content}</span>
						</div>
					)}
				</Flex>
			</Flex>
		</MagicModal>
	)
}

export default DeleteDangerModal
