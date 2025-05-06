import MagicButton from "@/opensource/components/base/MagicButton"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import MagicModal from "@/opensource/components/base/MagicModal"
import { IconCopy, IconUserCog } from "@tabler/icons-react"
import { Checkbox, message, Space, Switch } from "antd"
import { cx } from "antd-style"
import { memo, useCallback, useEffect, useMemo } from "react"
import useStyles from "./style"
import departmentOrMemberIcon from "./svg/department-or-member.svg"
import internetIcon from "./svg/internet.svg"
import organizationIcon from "./svg/organization.svg"
import StopShareIcon from "@/opensource/pages/superMagic/assets/svg/stop_share.svg"
import type { ShareProps } from "./types"
import { ShareType } from "./types"

// 生成随机密码
const generateRandomPassword = (length: number) => {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	let result = ""
	for (let i = 0; i < length; i += 1) {
		result += characters.charAt(Math.floor(Math.random() * characters.length))
	}
	return result
}

export default memo(function Share(props: ShareProps) {
	const {
		shareContext,
		onChangeType,
		types,
		extraData,
		setExtraData,
		type,
		getValidateShareSettings,
		handleOk,
	} = props
	const { styles } = useStyles()

	// 生成链接URL
	const shareUrl = useMemo(() => {
		return `${window.location.origin}/share/${shareContext?.resource_id}`
	}, [shareContext?.resource_id])

	useEffect(() => {
		if (setExtraData && !extraData?.shareUrl) {
			const newData = {
				passwordEnabled: false,
				password: generateRandomPassword(5),
				shareUrl,
				...extraData,
			}
			setExtraData(newData)
		}
	}, [extraData, setExtraData, shareUrl])

	// 切换密码开关
	const handlePasswordSwitch = useCallback(
		(checked: boolean) => {
			if (setExtraData) {
				const newExtraData = {
					...extraData,
					passwordEnabled: checked,
					// 如果启用密码，则自动生成密码
					password: checked ? generateRandomPassword(5) : extraData?.password,
				}
				setExtraData(newExtraData)
				handleOk?.(type, newExtraData)
			}
		},
		[extraData, setExtraData, type, handleOk],
	)

	// 重置密码
	const handleResetPassword = useCallback(() => {
		MagicModal.confirm({
			title: "提示",
			content: "重置访问密码后，之前生成的密码将失效",
			onOk: () => {
				if (setExtraData) {
					const newExtraData = {
						...extraData,
						password: generateRandomPassword(5),
					}
					setExtraData(newExtraData)
					handleOk?.(type, newExtraData)
				}
			},
			okText: "确定",
			cancelText: "取消",
		})
	}, [extraData, setExtraData, handleOk, type])

	// 验证分享设置
	const validateShareSettings = useCallback(() => {
		// 密码现在总是自动生成的，无需验证
		return true
	}, [])

	// 向父组件传递验证函数
	useEffect(() => {
		if (getValidateShareSettings) {
			getValidateShareSettings(validateShareSettings)
		}
	}, [getValidateShareSettings, validateShareSettings])

	// 复制链接
	const handleCopyLink = useCallback(() => {
		const text = extraData?.passwordEnabled
			? `${extraData?.shareUrl}?password=${extraData?.password}`
			: extraData?.shareUrl || shareUrl
		navigator.clipboard.writeText(text)
		message.success("链接已复制到剪贴板")
	}, [extraData, shareUrl])

	const list = useMemo(() => {
		return [
			{
				type: ShareType.OnlySelf,
				icon: StopShareIcon,
				title: "禁止分享",
				description: "关闭话题分享功能",
				backgroundColor: styles.backgroundOnlySelf,
			},
			{
				type: ShareType.Organization,
				icon: organizationIcon,
				title: "组织内部可访问",
				description: "当前组织所有成员可访问网站",
				backgroundColor: styles.backgroundOrganization,
			},
			{
				type: ShareType.DepartmentOrMember,
				icon: departmentOrMemberIcon,
				title: "指定部门/成员可访问",
				description: "指定部门或人员可访问网站",
				backgroundColor: styles.backgroundDepartmentOrMember,
				rightContent: (
					<MagicButton
						size="small"
						color="primary"
						variant="outlined"
						icon={<MagicIcon component={IconUserCog} size={16} color="currentColor" />}
						className={styles.departmentOrMemberButton}
						onClick={(event) => {
							event.stopPropagation()
						}}
					>
						管理
					</MagicButton>
				),
			},
			{
				type: ShareType.Internet,
				icon: internetIcon,
				title: "互联网可访问",
				description: "任何获得链接的人可访问网站",
				backgroundColor: styles.backgroundInternet,
				bottomContent: (
					<Space direction="vertical" size={12} className={styles.internetContent}>
						<div className={styles.internetLinkWrapper}>
							<div className={styles.internetLink}>
								<span>{extraData?.shareUrl || shareUrl}</span>
							</div>
							<MagicButton
								variant="filled"
								color="default"
								icon={<MagicIcon component={IconCopy} size={18} />}
								className={styles.copyButton}
								onClick={handleCopyLink}
							>
								复制链接{extraData?.passwordEnabled ? "和密码" : null}
							</MagicButton>
						</div>
						<Space size={8}>
							<Switch
								size="default"
								checked={extraData?.passwordEnabled}
								onChange={handlePasswordSwitch}
							/>
							<span className={styles.passwordTitle}>访问密码</span>
							{extraData?.passwordEnabled && (
								<>
									<div className={styles.password}>
										{extraData?.password || ""}
									</div>
									<MagicButton size="middle" onClick={handleResetPassword}>
										重置密码
									</MagicButton>
								</>
							)}
						</Space>
					</Space>
				),
			},
		].filter((item) => types.includes(item.type))
	}, [
		styles.backgroundOnlySelf,
		styles.backgroundOrganization,
		styles.backgroundDepartmentOrMember,
		styles.departmentOrMemberButton,
		styles.backgroundInternet,
		styles.internetContent,
		styles.internetLinkWrapper,
		styles.internetLink,
		styles.copyButton,
		styles.passwordTitle,
		styles.password,
		extraData?.shareUrl,
		extraData?.passwordEnabled,
		extraData?.password,
		shareUrl,
		handleCopyLink,
		handlePasswordSwitch,
		handleResetPassword,
		types,
	])

	return (
		<div className={styles.shareContainer}>
			{list.map((item) => {
				const isActive = item.type === type
				return (
					<div key={item.type}>
						<div
							className={styles.top}
							onClick={() => {
								onChangeType?.(item.type)
							}}
						>
							<div className={styles.left}>
								<div className={cx(styles.icon, item.backgroundColor)}>
									<img src={item.icon} alt={item.title} />
								</div>
								<div className={styles.info}>
									<div className={styles.title}>{item.title}</div>
									<div className={styles.description}>{item.description}</div>
								</div>
							</div>
							<div className={styles.right}>
								{isActive && item.rightContent}
								<Checkbox className={styles.checkbox} checked={isActive} />
							</div>
						</div>

						{isActive && item.bottomContent && (
							<div className={styles.bottom}>{item.bottomContent}</div>
						)}
					</div>
				)
			})}
		</div>
	)
})
